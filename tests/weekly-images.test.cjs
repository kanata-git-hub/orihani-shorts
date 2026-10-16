const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
function compile(rel,mocks={}){
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(n=>Object.hasOwn(mocks,n)?mocks[n]:n.endsWith('.css')?{}:n.startsWith('.')?compile(['.ts','.tsx'].map(ext=>path.join(path.dirname(rel),n)+ext).find(p=>fs.existsSync(path.join(root,p))),mocks):require(n),m,m.exports);return m.exports;
}
const {readProductionPackage,readWeeklyInput}=compile('src/workflow/productionPackage.ts');
const {prepareDriveWork}=compile('src/workflow/preparedWork.ts');
const {createWeeklyImagesReader}=compile('server/workflow/weeklyImages.ts');
const {WEEKLY_FOLDER}=compile('server/workflow/weekly.ts');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=','base64');
const digest=createHash('sha256').update(png).digest('hex');
function fixture(){
 const p=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/authored-production.json'),'utf8'));
 p.episodes.forEach((e,ep)=>{e.assets=Object.fromEntries(e.plan.clips.map((c,i)=>[c.imageTitle,{fileId:'image_'+ep+'_'+i+'_abcdefghijklmnopqrst',sha256:digest}]));});return p;
}
const latest=p=>async()=>({id:'package_abcdefghijklmnopqrst',name:'fixture',date:'2026-10-16',url:'https://drive.google.com/',text:JSON.stringify(p),checkedAt:new Date().toISOString(),episodeCount:p.episodes.length});
function reader(pack,mutate=(m)=>m,bytes=png){
 const calls=[];
 const load=createWeeklyImagesReader({key:()=> 'test-server-key',weekly:latest(pack),fetch:async(url,init)=>{
  calls.push(String(url)); assert.equal(init.redirect,'error');assert.equal(init.headers['x-goog-api-key'],'test-server-key');
  const u=new URL(url);assert.equal(u.origin,'https://www.googleapis.com');
  const id=u.pathname.split('/').pop();
  return u.searchParams.has('alt')?new Response(bytes):Response.json(mutate({id,mimeType:'image/png',parents:[WEEKLY_FOLDER],size:String(png.length),trashed:false}));
 }});return {load,calls};
}
test('asset metadata survives the picker; malformed or partial manifests fail before fetch',()=>{
 const p=fixture(),checked=readProductionPackage(JSON.stringify(p));
 assert.deepEqual(checked,p);assert.deepEqual(readWeeklyInput(JSON.stringify(p))[0].prepared.assets,p.episodes[0].assets);
 for(const mutate of [e=>delete e.assets[Object.keys(e.assets)[0]],e=>e.assets.wrong={fileId:'a'.repeat(25),sha256:digest},e=>Object.values(e.assets)[0].fileId='https://evil.example/file',e=>Object.values(e.assets)[0].sha256='bad']){
  const bad=fixture();mutate(bad.episodes[0]);assert.throws(()=>readProductionPackage(JSON.stringify(bad)),/이미지/);
 }
});
test('selected episode loads exact image bytes and prompts without another episode or generation',async()=>{
 const p=fixture(),{load,calls}=reader(p),entry=p.episodes[0];
 const result=await load(entry.number,p.revision);
 assert.equal(Object.keys(result.images).length,4);assert.equal(calls.length,8);
 assert.ok(calls.every(url=>!url.includes('image_1_')));
 const work=await prepareDriveWork(entry,p.revision,async(url)=>{assert.ok(url.startsWith('/api/editor/weekly/1/images?revision='));return Response.json(result);});
 assert.deepEqual(JSON.parse(work.item.result).clips,entry.plan.clips);
 assert.ok(Object.values(work.images).every(v=>Buffer.from(v.split(',')[1],'base64').equals(png)));
});
test('foreign folders, trashed files, wrong types and declared oversize fail before binary download',async()=>{
 for(const mutate of [m=>({...m,parents:['unrelated']}),m=>({...m,trashed:true}),m=>({...m,mimeType:'text/html'}),m=>({...m,size:String(8*1024*1024+1)})]){
  const p=fixture(),r=reader(p,mutate);await assert.rejects(r.load(1,p.revision));assert.equal(r.calls.length,1);
 }
});
test('changed bytes and stale revisions fail without stale or partial fallback',async()=>{
 const p=fixture(),changed=Buffer.from(png);changed[20]^=1;
 await assert.rejects(reader(p,m=>m,changed).load(1,p.revision),/원본/);
 const r=reader(p);await assert.rejects(r.load(1,'stale'),/갱신/);assert.equal(r.calls.length,0);
 await assert.rejects(r.load(999,p.revision),/연결/);assert.equal(r.calls.length,0);
});
test('client rejects partial images, mismatched revisions and errors; prompt-only work stays local',async()=>{
 const p=fixture(),entry=p.episodes[0],complete=await reader(p).load(1,p.revision);
 for(const body of [{...complete,images:{}},{...complete,revision:'other'},{...complete,number:2}])await assert.rejects(prepareDriveWork(entry,p.revision,async()=>Response.json(body)),/일치/);
 await assert.rejects(prepareDriveWork(entry,p.revision,async()=>Response.json({error:'network failed'},{status:502})),/network failed/);
 delete entry.assets;const work=await prepareDriveWork(entry,p.revision,async()=>{throw Error('unexpected network');});assert.deepEqual(work.images,{});
});
test('real hook saves images before history and rolls back failed imports',async()=>{
 const p=fixture(),entry=p.episodes[0],response=await reader(p).load(1,p.revision);
 for(const failure of [null,'media','history']){
  const events=[],states=[];
  const {useGeneration}=compile('src/hooks/useGeneration.ts',{
   react:{useState:v=>[v,n=>states.push(n)]},'../constants':{CHARACTERS:[]},
   '../authFetch':{authFetch:async(url)=>{assert.ok(url.includes('/weekly/1/images'));events.push('download');return Response.json(response);}},
   '../utils/db':{db:{setImages:async(id,images)=>{assert.equal(Object.keys(images).length,4);events.push('media');if(failure==='media')throw Error('quota');},delete:async()=>events.push('cleanup')}}
  });
  const hook=useGeneration(()=>{},()=>{events.push('history');if(failure==='history')throw Error('quota');},{});
  if(failure){await assert.rejects(hook.handleLoadPrepared(entry,p.revision),/quota/);assert.equal(states.length,0);assert.deepEqual(events,failure==='media'?['download','media']:['download','media','history','cleanup']);}
  else{const item=await hook.handleLoadPrepared(entry,p.revision);assert.deepEqual(events,['download','media','history']);assert.ok(states.includes(item.result));}
 }
});
test('weekly start awaits download and exposes failure visibly for retry',async()=>{
 const p=fixture(),state=['',readWeeklyInput(JSON.stringify(p)),0,'',false,null,false,false];let cursor=0;
 const {WeeklyScript}=compile('src/workflow/WeeklyScript.tsx',{
  react:{useState:v=>{const i=cursor++;return [state[i]===undefined?v:state[i],n=>state[i]=n];},useRef:v=>({current:v}),useEffect:()=>{}},
  '../lib/firebase':{auth:{currentUser:null}}
 });
 const flatten=n=>Array.isArray(n)?n.flatMap(flatten):n&&typeof n==='object'?[n,...flatten(n.props?.children)]:[];
 const label=n=>Array.isArray(n)?n.map(label).join(''):n&&typeof n==='object'?label(n.props?.children):typeof n==='string'?n:'';
 const props={onChoose:()=>{},onPrepared:async()=>{throw Error('이미지를 불러오지 못했습니다.');}};
 let tree=WeeklyScript(props);await flatten(tree).find(n=>n.type==='button'&&label(n)==='이 제작안으로 시작').props.onClick();
 cursor=0;tree=WeeklyScript(props);const status=flatten(tree).find(n=>n.props?.role==='status');assert.equal(status.props.className,'');assert.match(label(status),/못했습니다/);
 assert.equal(flatten(tree).find(n=>n.type==='button'&&label(n)==='이 제작안으로 시작').props.disabled,false);
});

