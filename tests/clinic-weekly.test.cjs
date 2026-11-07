const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
function compile(rel,mocks={}){
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(n=>Object.hasOwn(mocks,n)?mocks[n]:n.endsWith('.css')?{}:n.startsWith('.')?compile(['.ts','.tsx'].map(ext=>path.join(path.dirname(rel),n)+ext).find(p=>fs.existsSync(path.join(root,p))),mocks):require(n),m,m.exports);return m.exports;
}
const {readProductionPackage,readWeeklySources,preparedHistory}=compile('src/workflow/productionPackage.ts');
const {readPackage,makePackage,editorEpisode}=compile('src/workflow/package.ts');
const {importEpisode,validatePlan}=compile('src/editor/model.ts');
const {prepareDriveWork}=compile('src/workflow/preparedWork.ts');
const {createWeeklyImagesReader}=compile('server/workflow/weeklyImages.ts');
const {weeklySources,createWeeklyReader}=compile('server/workflow/weekly.ts');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=','base64'),hash=createHash('sha256').update(png).digest('hex');
const timeline=[{start:0,end:3.5,text:'첫 문구',source:'screen'},{start:3.5,end:7.5,text:'다음 문구',source:'screen'},{start:7.5,end:11.5,text:'세 번째',source:'screen'},{start:11.5,end:15,text:'마지막 문구',source:'screen'}];
function pack(clinic=false){
 const revision=clinic?'clinic-synthetic':'main-synthetic';
 return {format:'orihani-production',version:1,revision,episodes:Array.from({length:clinic?2:3},(_,i)=>{
  const number=i+1,title=clinic?`한의원 쇼츠 ${String(number).padStart(2,'0')} 시험`:`${number}화 시험 (하찮은 오리 일상)`;
  const plan={workflow:'kling4',duration:15,title,location:'synthetic room',scenario:'Synthetic action and result.',instagramCaption:'synthetic copy',hashtags:['#a','#b','#c','#d','#e'],continuity:'Keep the same prop.',videoPrompt:'ONE video. Move, then stop.\nNo speech.',keyframes:[0,7.5,15].map((time,k)=>({time,title:'frame '+k,imageTitle:revision+'-'+number+'-'+k,imagePrompt:'Synthetic state '+k,referencePlan:{background:null,props:[]}}))};
  const episode={duration:15,title:`[에피소드 ${number}] ${title}`,scenario:plan.scenario,korean:clinic?'해설: 없음\n'+timeline.map(c=>`화면 자막: ${c.start}~${c.end}초 ${c.text}`).join('\n'):'해설: 없음',thumbnail:title,caption:'synthetic copy',...(clinic?{captionStyle:'clinic',videoLayout:'single',clinicBrandStart:11.5}:{})};
  return {number,characterId:'owonjang',episode,plan,assets:Object.fromEntries(plan.keyframes.map((k,j)=>[k.imageTitle,{fileId:revision+'_'+number+'_'+j+'_abcdefghijklmnopq',sha256:hash}]))};
 })};
}
const main=pack(),clinic=pack(true),raws=[main,clinic].map(JSON.stringify);
const catalog={id:'main_abcdefghijklmnopqrst',name:'main',date:'2026-11-01',url:'https://drive.google.com/file/d/main',text:raws[0],checkedAt:'2026-11-01T00:00:00Z',episodeCount:5,sources:raws.map((text,i)=>({id:'source_'+i,name:i?'clinic':'main',date:'2026-11-01',url:'https://drive.google.com/file/d/source'+i,text,episodeCount:i?2:3}))};

test('discovery selects the current clinic bundle only, and reader returns all five episodes',async()=>{
 const file=(name,id,time='2026-11-01T00:00:00Z')=>({name,id:id+'_abcdefghijklmnopqrst',mimeType:'application/json',modifiedTime:time});
 const a=file('[2026-11-01] 3D 오리 삼총사 릴스 개그 시리즈 주간 패키지.json','main');
 const b=file('[2026-11-01] 한의원 쇼츠 01-02 제작안.json','clinic','2026-11-01T01:00:00Z');
 const files=[a,b,file('[2026-11-01] 한의원 쇼츠 제작안.json','old'),file('[2026-10-25] 한의원 쇼츠 01-02 제작안.json','past'),file('[2026-11-01] 한의원 쇼츠 01-02 검수기록.json','review'),file('[2026-11-01] 한의원 쇼츠 01-02 제작안.orihani-work.json','work')];
 assert.deepEqual(weeklySources(files).map(f=>f.id),[a.id,b.id]);
 const reader=raw=>createWeeklyReader({key:()=> 'test',fetch:async url=>{
  const u=new URL(url);if(u.pathname==='/drive/v3/files')return Response.json({files});
  if(u.pathname.endsWith(a.id))return new Response(raws[0]);
  assert.ok(u.pathname.endsWith(b.id));return new Response(raw);
 }});
 const result=await reader(raws[1])();assert.equal(result.episodeCount,5);
 assert.deepEqual(result.sources.map(s=>s.date),['2026-11-01','2026-11-01']);
 assert.deepEqual(result.sources.map(s=>s.episodeCount),[3,2]);
 assert.equal(readWeeklySources(result.sources.map(s=>s.text))[4].title,'한의원 쇼츠 02 시험');
 await assert.rejects(reader('{}')(),/완성 제작안/);
});

test('five choices retain separate series numbers and canonical packages while clinic labels use official titles',()=>{
 const before=JSON.stringify(clinic),choices=readWeeklySources(raws);
 assert.equal(choices.length,5);
 assert.deepEqual(choices.map(c=>c.prepared.number),[1,2,3,1,2]);
 assert.equal(choices[0].title,main.episodes[0].episode.title);
 assert.equal(choices[3].title,'한의원 쇼츠 01 시험');
 assert.equal(choices[4].title,'한의원 쇼츠 02 시험');
 assert.equal(choices[3].prepared.episode.title,'[에피소드 1] 한의원 쇼츠 01 시험');
 assert.deepEqual(readProductionPackage(raws[1]),clinic);
 assert.equal(JSON.stringify(clinic),before);
 assert.throws(()=>readWeeklySources([raws[1],raws[1]]),/중복/);
});

test('clinic history and portable work handoff preserve the exact screen captions and no narration',()=>{
 for(const entry of clinic.episodes){
  const item=preparedHistory(entry,clinic.revision),images=Object.fromEntries(entry.plan.keyframes.map(k=>[k.imageTitle,'data:image/png;base64,'+png.toString('base64')]));
  assert.equal(item.episode.title,entry.plan.title);
  const restored=readPackage(makePackage(item,images));
  assert.deepEqual(restored.images,images);
  assert.equal(JSON.parse(restored.item.result).videoPrompt,entry.plan.videoPrompt);
  const edit=importEpisode(editorEpisode(restored.item));validatePlan(edit);
  assert.equal(edit.title,entry.plan.title);assert.equal(edit.captionStyle,'clinic');assert.equal(edit.videoLayout,'single');assert.equal(edit.originalVolume,1);assert.equal(edit.clinicBrandStart,11.5);assert.equal(edit.narration,'');assert.deepEqual(edit.captions,timeline);
 }
 assert.equal(preparedHistory(main.episodes[0],main.revision).episode.title,main.episodes[0].episode.title);
});

test('clinic image loading uses its revision even when a main episode has the same number',async()=>{
 const requested=[];
 const load=createWeeklyImagesReader({key:()=> 'test',weekly:async()=>catalog,fetch:async url=>{
  const u=new URL(url);requested.push(u.pathname);
  if(u.pathname==='/drive/v3/files')return Response.json({files:[main,clinic].flatMap(p=>p.episodes.flatMap(e=>Object.values(e.assets).map(a=>({id:a.fileId,mimeType:'image/png',size:String(png.length)}))))});
  assert.ok(u.pathname.includes('/clinic-synthetic_1_'));return new Response(png);
 }});
 const result=await load(1,clinic.revision),entry=clinic.episodes[0];
 const work=await prepareDriveWork(entry,clinic.revision,async url=>{
  assert.equal(url,'/api/editor/weekly/1/images?revision=clinic-synthetic');return Response.json(result);
 });
 assert.equal(Object.keys(work.images).length,3);assert.equal(requested.length,4);
 assert.equal(work.item.episode.title,'한의원 쇼츠 01 시험');
 assert.deepEqual(importEpisode(editorEpisode(work.item)).captions,timeline);
});

test('real weekly refresh offers all five choices and opens clinic entry with its original revision',async()=>{
 let state=[],cursor=0,opened;
 const jsx=(type,props)=>({type,props});
 const mocks={react:{useState:v=>{const i=cursor++;if(!(i in state))state[i]=v;return[state[i],n=>{state[i]=n;}];},useRef:v=>({current:v}),useEffect:()=>{}},'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},'lucide-react':{RefreshCw:()=>null},'../lib/firebase':{auth:{currentUser:{getIdToken:async()=> 'test'}}},'./PromptComparison':{PromptComparison:()=>null}};
 const {WeeklyScript}=compile('src/workflow/WeeklyScript.tsx',mocks);
 const flatten=n=>Array.isArray(n)?n.flatMap(flatten):n&&typeof n==='object'?[n,...flatten(n.props?.children)]:[];
 const label=n=>Array.isArray(n)?n.map(label).join(''):n&&typeof n==='object'?label(n.props?.children):n==null?'':String(n);
 const props={onChoose:()=>{throw Error('authored plans must not enter generation');},onPrepared:async(e,r)=>{opened={e,r};}};
 const originalFetch=global.fetch;global.fetch=async()=>Response.json(catalog);
 try{
  let tree=WeeklyScript(props);flatten(tree).find(n=>n.props?.['aria-label']==='최신 제작안 다시 확인').props.onClick();
  for(let i=0;i<20&&!state[1]?.length;i++)await new Promise(resolve=>setImmediate(resolve));
  cursor=0;tree=WeeklyScript(props);
  assert.equal(flatten(tree).filter(n=>n.type==='option').length,5);
  assert.match(label(tree),/선택 가능한 제작안 5편 · 본편 3편 · 한의원 쇼츠 2편/);
  assert.ok(!label(tree).includes('번외 2편'));
  flatten(tree).find(n=>n.type==='select').props.onChange({target:{value:'3'}});
  cursor=0;tree=WeeklyScript(props);
  await flatten(tree).find(n=>n.type==='button'&&label(n)==='이 제작안으로 시작').props.onClick();
  assert.equal(opened.r,clinic.revision);assert.equal(opened.e.episode.captionStyle,'clinic');assert.equal(opened.e.episode.title,'[에피소드 1] 한의원 쇼츠 01 시험');
 }finally{global.fetch=originalFetch;}
});
