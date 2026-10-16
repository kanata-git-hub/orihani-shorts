const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map();
function compile(rel,mocks={}){
 if(!Object.keys(mocks).length&&cache.has(rel))return cache.get(rel);
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(n=>mocks[n]||(n.endsWith('.css')?{}:n.startsWith('.')?compile(['.ts','.tsx'].map(ext=>path.join(path.dirname(rel),n)+ext).find(p=>fs.existsSync(path.join(root,p)))):require(n)),m,m.exports);
 if(!Object.keys(mocks).length)cache.set(rel,m.exports);return m.exports;
}
const {defaultKeyframeTimes,validateKling4Plan,legacyKling4Copy}=compile('src/kling4.ts');
const {readProductionPackage,preparedHistory}=compile('src/workflow/productionPackage.ts');
const {makePackage,readPackage,editorEpisode}=compile('src/workflow/package.ts');
const {extractClips,extractScenes,extractOverview}=compile('src/utils/extractors.ts');
const {importEpisode,validatePlan}=compile('src/editor/model.ts');
const {clipLengths,validateMediaSizes}=compile('src/editor/media.ts');
const {recordProgress}=compile('src/workflow/progress.ts');
function production(duration=15){
 const episode={duration,title:'[에피소드 99] 연결 시험',scenario:'0초 준비, 중간 변화, 마지막 결과. 이야기 장면 수와 이미지 수는 다르다.',korean:'해설: 없음',thumbnail:'',caption:'연결 시험'};
 const plan={workflow:'kling4',duration,title:'연결 시험',location:'공원',scenario:episode.scenario,instagramCaption:'하나의 이야기',hashtags:['오리','공원','친구','일상','짧은영상'],continuity:'One blue bench, unchanged width. Same tree and path. No new props.',videoPrompt:'ONE continuous video.\n'+('Preserve the actual action and Korean dialogue. '.repeat(50)),keyframes:defaultKeyframeTimes(duration).map((time,i)=>({time,title:'장면 '+i,imageTitle:'frame-'+i,imagePrompt:`At ${time}s: precise pose and object state.`,locationId:'park',backgroundAsset:'none',referencePlan:{background:i?1:null,props:i?[{scene:1,objects:['벤치']}]:[]}}))};
 return {format:'orihani-production',version:1,revision:'test',episodes:[{number:99,characterId:'owonjang',episode,plan}]};
}
test('5/15/30-second production imports preserve exact prompts, portable images and one-video editor handoff',()=>{
 for(const duration of [5,15,30]){
  const raw=production(duration),pack=readProductionPackage(JSON.stringify(raw)),entry=pack.episodes[0];
  const item=preparedHistory(entry,pack.revision),clips=extractClips(item.result);
  assert.equal(clips.length,{5:2,15:3,30:5}[duration]);
  assert.equal(JSON.parse(item.result).videoPrompt,raw.episodes[0].plan.videoPrompt);
  assert.ok(JSON.parse(item.result).videoPrompt.length>1900);
  const images=Object.fromEntries(clips.map(c=>[c.imageTitle,'data:image/png;base64,AAAA']));
  const restored=readPackage(makePackage(item,images));assert.deepEqual(restored.images,images);
  assert.equal(restored.item.result,item.result);
  const edit=importEpisode(editorEpisode(restored.item));validatePlan(edit);
  assert.equal(edit.duration,duration);assert.equal(edit.videoLayout,'single');assert.deepEqual(clipLengths(edit.duration,edit.videoLayout),[duration]);
  validateMediaSizes([{size:1000}],edit.duration,0,edit.videoLayout);
  assert.equal(recordProgress(item,{imageTitles:Object.keys(images)}).action,'Kling 자료 확인');
  assert.equal(extractScenes(item.result)[1].referencePlan.background,1);
 }
});
test('invalid keyframe timing, references and mixed schemas are rejected before persistence',()=>{
 for(const mutate of [p=>p.keyframes[1].time=0,p=>p.keyframes[0].time=1,p=>p.keyframes[2].time=16,p=>p.keyframes[1].referencePlan.background=2,p=>p.keyframes[1].imageTitle=p.keyframes[0].imageTitle,p=>p.keyframes[1].imageTitle='__proto__',p=>p.clips=[],p=>p.duration=20,p=>p.videoPrompt='',p=>p.keyframes=[]]){
  const p=production().episodes[0].plan;mutate(p);assert.throws(()=>validateKling4Plan(p));
 }
 const pack=production();pack.episodes[0].plan.needsVideoReview=true;assert.throws(()=>readProductionPackage(JSON.stringify(pack)),/확인/);
});
test('keyframe reference numbering is independent of the four story beats',()=>{
 const pack=production(),entry=pack.episodes[0];
 entry.plan.scenario=entry.episode.scenario=[1,2,3,4].map((n)=>`[장면 ${n} (4초)]\nreferencePlan: {"background":null,"props":[]}`).join('\n');
 const item=preparedHistory(readProductionPackage(JSON.stringify(pack)).episodes[0],'test');
 assert.equal(extractScenes(item.result).length,3);
 assert.equal(extractScenes(item.result)[2].referencePlanError,undefined);
 assert.equal(extractScenes(item.result)[2].referencePlan.background,1);
});
test('legacy conversion copies identities and exact images without inventing an ending pose or discarding old edits',()=>{
 const legacy=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/authored-production.json'),'utf8')).episodes[0];
 const item=preparedHistory(legacy,'legacy');item.editorKey='saved-edit';
 const original=JSON.stringify(item),clips=extractClips(item.result);
 const copy=legacyKling4Copy(item,clips,extractOverview(item.result)),plan=JSON.parse(copy.result);
 assert.notEqual(copy.id,item.id);assert.equal(copy.editorKey,undefined);assert.equal(JSON.stringify(item),original);
 assert.deepEqual(plan.keyframes.map(f=>f.imagePrompt),clips.map(c=>c.imagePrompt));
 assert.deepEqual(plan.keyframes.map(f=>f.time),item.duration===5?[0,2]:[0,4,8,11]);
 assert.equal(plan.needsVideoReview,true);assert.ok(plan.keyframes.at(-1).time<plan.duration);
 assert.equal(importEpisode(editorEpisode(copy)).videoLayout,'single');
 assert.equal(clipLengths(15).length,4);assert.equal(importEpisode(editorEpisode(item)).videoLayout,undefined);
});
test('real Kling 4.0 copy button copies only the full prompt, without clip prefix or truncation',async()=>{
 const copies=[],noop=()=>{},descriptor=Object.getOwnPropertyDescriptor(global,'navigator');
 Object.defineProperty(global,'navigator',{configurable:true,value:{clipboard:{writeText:async t=>copies.push(t)}}});
 const {Kling4Workspace}=compile('src/workflow/Kling4Workspace.tsx',{react:{useState:v=>[v,noop]}});
 const flatten=n=>Array.isArray(n)?n.flatMap(flatten):n&&typeof n==='object'?[n,...flatten(n.props?.children)]:[];
 const label=n=>Array.isArray(n)?n.map(label).join(''):n&&typeof n==='object'?label(n.props?.children):typeof n==='string'?n:'';
 try{
  const plan=production().episodes[0].plan;
  const props={result:JSON.stringify(plan),images:{},onApply:noop,onGenerate:()=>{throw Error('unexpected generation');},onUpdate:noop};
  let tree=Kling4Workspace(props),button=flatten(tree).find(n=>n.type==='button'&&label(n)==='전체 영상 프롬프트 복사');
  assert.equal(button.props.disabled,false);await button.props.onClick();assert.equal(copies[0],plan.videoPrompt);
  plan.needsVideoReview=true;tree=Kling4Workspace({...props,result:JSON.stringify(plan)});
  assert.equal(flatten(tree).find(n=>n.type==='button'&&label(n)==='전체 영상 프롬프트 복사').props.disabled,true);
 }finally{descriptor?Object.defineProperty(global,'navigator',descriptor):delete global.navigator;}
});
test('image imports detect actual file type and reject disguised non-images',()=>{
 const {imageMime}=compile('src/workflow/importImage.ts');
 assert.equal(imageMime(Uint8Array.from([255,216,255])),'image/jpeg');
 assert.equal(imageMime(Uint8Array.from([137,80,78,71])),'image/png');
 assert.throws(()=>imageMime(new TextEncoder().encode('<svg><script')),/이미지/);
});

test('optional Gemini keyframe generation reuses the first approved set and renders the real ending state',async()=>{
 const png='data:image/png;base64,AAAA',calls=[],plan=production().episodes[0].plan;
 plan.keyframes[2].imagePrompt='O-wonjang is finally seated on the SAME bench. ENDING_PAYOFF.';
 const refs=compile('src/characterReference.ts',{'./authFetch':{authFetch:()=>{throw Error('unexpected auth call');}}});
 const {useMediaGeneration}=compile('src/hooks/useMediaGeneration.ts',{
  react:{useRef:v=>({current:v})},'../utils/db':{db:{get:async()=>({images:{'frame-0':png}}),setImageChecks:async()=>{}}},
  '../constants':{CHARACTERS:[{id:'owonjang',name:'오원장',file:'doctor.png',imgs:[png,png,png]}]},
  '../characterReference':refs,
  '../authFetch':{authFetch:async(url,options)=>{calls.push(JSON.parse(options.body));return Response.json({result:png,review:{status:'pass',issues:[]}});}},
 });
 const hook=useMediaGeneration(()=>{},async()=>{},'modern',()=>{},{},()=>{},{},'owonjang');
 const raw=JSON.stringify(plan),scenes=extractScenes(raw);
 assert.equal(await hook.handleGenerateImage('frame-2',plan.keyframes[2].imagePrompt,2,scenes,raw),true);
 assert.equal(calls.length,1);
 const parts=calls[0].parts,text=parts.filter(p=>p.text).map(p=>p.text).join('\n');
 assert.ok(parts.some(p=>p.inlineData?.data==='AAAA'));assert.match(text,/SCRIPT REFERENCE/);
 assert.match(text,/at 15s of a 15s video/);assert.match(text,/ENDING_PAYOFF/);assert.match(text,/One blue bench/);
 assert.doesNotMatch(text,/Do not draw the clip's later action result early/);
});
