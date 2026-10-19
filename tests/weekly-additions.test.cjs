const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
function compile(rel,mocks={}){
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(n=>Object.hasOwn(mocks,n)?mocks[n]:n.endsWith('.css')?{}:n.startsWith('.')?compile(['.ts','.tsx'].map(ext=>path.join(path.dirname(rel),n)+ext).find(p=>fs.existsSync(path.join(root,p))),mocks):require(n),m,m.exports);return m.exports;
}
const {readWeeklySources,MAX_WEEKLY_SOURCES}=compile('src/workflow/productionPackage.ts');
const {weeklySources,createWeeklyReader}=compile('server/workflow/weekly.ts');
const {createWeeklyImagesReader}=compile('server/workflow/weeklyImages.ts');
const {prepareDriveWork}=compile('src/workflow/preparedWork.ts');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=','base64'),hash=createHash('sha256').update(png).digest('hex');
function pack(revision){
 const plan={workflow:'kling4',duration:5,title:revision,location:'room',scenario:'synthetic motion',instagramCaption:'caption',hashtags:['#a','#b','#c','#d','#e'],continuity:'same prop',videoPrompt:'Move and land.',keyframes:[0,5].map((time,i)=>({time,title:'frame '+i,imageTitle:revision+'-'+i,imagePrompt:'synthetic frame',referencePlan:{background:null,props:[]}}))};
 return {format:'orihani-production',version:1,revision,episodes:[{number:3,characterId:'owonjang',episode:{duration:5,title:'[에피소드 3] '+revision,scenario:plan.scenario,korean:'',thumbnail:'',caption:plan.instagramCaption},plan,assets:Object.fromEntries(plan.keyframes.map((k,i)=>[k.imageTitle,{fileId:revision+'_image_'+i+'_abcdefghijklmnopq',sha256:hash}]))}]};
}
const file=(name,id,time='2026-10-19T01:00:00Z')=>({name,id:id+'_abcdefghijklmnopqrst',mimeType:'application/json',modifiedTime:time});
const main=file('[2026-10-18] 3D 오리 삼총사 릴스 개그 시리즈 주간 패키지.json','main');
const bonus=file('[2026-10-18] 번외 제작안.json','bonus');
const addition=file('[2026-10-18] 번외 추가 03-2 제작안.json','extra');
const raws=[pack('main'),pack('bonus'),pack('extra')].map(JSON.stringify);
function reader(extraRaw=raws[2]){
 return createWeeklyReader({key:()=> 'test',fetch:async url=>{
  const u=new URL(url);if(u.pathname==='/drive/v3/files')return Response.json({files:[addition,main,bonus]});
  const i=[main,bonus,addition].findIndex(f=>u.pathname.endsWith(f.id));assert.notEqual(i,-1);
  return new Response(i===2?extraRaw:raws[i]);
 }});
}
test('explicit additions preserve the newest normal bonus bundle and select latest per label',()=>{
 const oldBundle=file('[2026-10-18] 번외 05-06 제작안.json','old','2026-10-18T00:00:00Z');
 const oldAddition=file('[2026-10-18] 번외 추가 3 · 2 제작안.json','oldExtra','2026-10-18T00:00:00Z');
 const noise=[file('[2026-10-17] 번외 추가 03-2 제작안.json','past'),file('[2026-10-19] 번외 추가 03-2 제작안.json','future'),file('[2026-10-18] 번외 추가 03-2 검수기록.json','review'),file('[2026-10-18] 번외 추가 03-2 제작안.orihani-work.json','export')];
 assert.deepEqual(weeklySources([oldBundle,oldAddition,...noise,addition,bonus,main]).map(f=>f.id),[main.id,bonus.id,addition.id]);
 const over=Array.from({length:MAX_WEEKLY_SOURCES},(_,i)=>file('[2026-10-18] 번외 추가 '+(i+1)+' 제작안.json','extra'+i));
 assert.throws(()=>weeklySources([main,...over]),/너무 많/);
 assert.throws(()=>readWeeklySources(Array(MAX_WEEKLY_SOURCES+1).fill(raws[0])),/목록/);
});
test('three sources retain their own revisions and malformed additions fail visibly',async()=>{
 const result=await reader()();
 assert.equal(result.episodeCount,3);assert.equal(result.sources.length,3);
 assert.deepEqual(result.sources.map(s=>s.date),Array(3).fill('2026-10-18'));
 assert.deepEqual(readWeeklySources(result.sources.map(s=>s.text)).map(c=>c.preparedRevision),['main','bonus','extra']);
 await assert.rejects(reader('{}')(),/완성 제작안/);
 assert.throws(()=>readWeeklySources([raws[0],raws[1],raws[0]]),/중복/);
});
test('third-source image lookup and work import preserve that source despite matching episode numbers',async()=>{
 const catalog=await reader()(),requested=[];
 const load=createWeeklyImagesReader({key:()=> 'test',weekly:async()=>catalog,fetch:async url=>{
  const u=new URL(url);requested.push(u.pathname);
  if(u.pathname==='/drive/v3/files')return Response.json({files:raws.flatMap(raw=>JSON.parse(raw).episodes.flatMap(e=>Object.values(e.assets).map(a=>({id:a.fileId,mimeType:'image/png',size:String(png.length)}))))});
  assert.ok(u.pathname.includes('/extra_image_'));return new Response(png);
 }});
 const result=await load(3,'extra');assert.equal(Object.keys(result.images).length,2);
 const entry=JSON.parse(raws[2]).episodes[0];
 const work=await prepareDriveWork(entry,'extra',async()=>Response.json(result));
 assert.equal(JSON.parse(work.item.result).videoPrompt,entry.plan.videoPrompt);
 assert.deepEqual(JSON.parse(work.item.result).keyframes,entry.plan.keyframes);
 assert.equal(requested.length,3);await assert.rejects(load(3,'stale'),/갱신/);
});
test('weekly UI accepts the third source on its real refresh path',async()=>{
 let state=[],cursor=0;
 const jsx=(type,props)=>({type,props});
 const mocks={
  react:{useState:v=>{const i=cursor++;if(!(i in state))state[i]=v;return[state[i],n=>{state[i]=n;}];},useRef:v=>({current:v}),useEffect:()=>{}},
  'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},
  'lucide-react':{RefreshCw:()=>null},
  '../lib/firebase':{auth:{currentUser:{getIdToken:async()=> 'test'}}},
  './PromptComparison':{PromptComparison:()=>null},
 };
 const {WeeklyScript}=compile('src/workflow/WeeklyScript.tsx',mocks);
 const flatten=n=>Array.isArray(n)?n.flatMap(flatten):n&&typeof n==='object'?[n,...flatten(n.props?.children)]:[];
 const originalFetch=global.fetch;global.fetch=async()=>Response.json(await reader()());
 try{
  let tree=WeeklyScript({onChoose:()=>{},onPrepared:()=>{}});
  flatten(tree).find(n=>n.props?.['aria-label']==='최신 제작안 다시 확인').props.onClick();
  for(let i=0;i<20&&!state[1]?.length;i++)await new Promise(resolve=>setImmediate(resolve));
  cursor=0;tree=WeeklyScript({onChoose:()=>{},onPrepared:()=>{}});
  assert.equal(flatten(tree).filter(n=>n.type==='option').length,3);
  assert.equal(state[1][2].preparedRevision,'extra');
 }finally{global.fetch=originalFetch;}
});

