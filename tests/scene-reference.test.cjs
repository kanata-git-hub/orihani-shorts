const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map();
function compile(rel,mocks={}){
 if(cache.has(rel)&&!Object.keys(mocks).length)return cache.get(rel);
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(name=>mocks[name]||(name.startsWith('.')?compile(path.posix.normalize(path.posix.join(path.posix.dirname(rel),name))+'.ts'):require(name)),m,m.exports);
 if(!Object.keys(mocks).length)cache.set(rel,m.exports);return m.exports;
}
const refs=compile('src/sceneReference.ts'),characters=compile('src/characterReference.ts'),pkg=compile('src/workflow/package.ts');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const later='data:image/png;base64,bGF0ZXItc3ludGhldGljLWZpeHR1cmU=';
const item={id:'episode-four',timestamp:1,characterId:'owonjang',duration:15,result:JSON.stringify({title:'4화 산책',clips:[4,4,3,4].map((n,i)=>({title:`장면 ${i+1}`,imageTitle:`image-${i+1}`,imagePrompt:'O-wonjang walks with a cart.',videoPrompt:`OUTPUT SPECS: ${n}s\nACTION: Walk.`}))})};
const snapshot=refs.captureSceneReference(item,'image-4',{'image-4':png});

test('explicit scene selection captures exact image and rejects unknown scenes, remote URLs and malformed data',()=>{
 assert.equal(snapshot.sceneNumber,4);assert.equal(snapshot.imageUrl,png);assert.equal(snapshot.sourceId,item.id);
 assert.equal(refs.readSceneReference(undefined),null);
 for(const patch of [{sceneNumber:0},{sceneTitle:''},{sourceId:null},{imageUrl:'https://example.com/photo.png'},{imageUrl:'data:text/html;base64,AAAA'},{imageUrl:'data:image/svg+xml;base64,AAAA'},{imageUrl:png+'!'}])assert.throws(()=>refs.readSceneReference({...snapshot,...patch}),/참고 장면/);
 assert.throws(()=>refs.captureSceneReference(item,'unknown',{'unknown':png}),/참고 장면/);
});
test('both planning stages can receive the selected still while unlinked planning stays text-only',()=>{
 for(const prompt of ['Plan episode five','Convert the plan to image and video prompts']){
  const contents=refs.planWithSceneReference(prompt,snapshot);
  assert.equal(contents.parts.find(p=>p.inlineData).inlineData.data,png.split(',')[1]);
  assert.match(contents.parts[0].text,/BOTH image and video prompts/);
  assert.match(contents.parts[0].text,/not a required starting frame/);
  assert.equal(refs.planWithSceneReference(prompt,null),prompt);
 }
});
test('work files carry a self-contained selected still and older work files remain valid',()=>{
 const pack=pkg.readPackage(pkg.makePackage(item,{'image-4':png},snapshot));
 assert.deepEqual(pack.sceneReference,snapshot);assert.equal(pack.images['image-4'],png);
 assert.equal(pkg.readPackage(pkg.makePackage(item,{})).sceneReference,undefined);
 assert.deepEqual(pkg.readPackage(JSON.stringify({...pack,item:{...pack.item,id:'new-device'}})).sceneReference,snapshot);
 assert.throws(()=>pkg.readPackage(JSON.stringify({...pack,sceneReference:{...snapshot,imageUrl:'file:///tmp/test'}})),/참고 장면/);
});
test('saved references survive source replacement, deletion and concurrent destination image writes; detach is record-specific',async()=>{
 require('fake-indexeddb/auto');global.window=new EventTarget();
 const {db}=compile('src/utils/db.ts');await db.clear();
 await db.set(item.id,{images:{'image-4':png}});
 await db.setSceneReference('episode-five',snapshot);await db.setSceneReference('episode-six',snapshot);
 await db.setImages(item.id,{'image-4':later});await db.delete(item.id);
 assert.equal((await db.get('episode-five')).sceneReference.imageUrl,png);
 await Promise.all([db.setImages('episode-five',{'image-1':later}),db.setSceneReference('episode-five',snapshot)]);
 assert.equal((await db.get('episode-five')).images['image-1'],later);
 assert.deepEqual((await db.get('episode-five')).sceneReference,snapshot);
 await db.setSceneReference('episode-five',null);
 assert.equal((await db.get('episode-five')).sceneReference,undefined);
 assert.equal((await db.get('episode-five')).images['image-1'],later);
 assert.deepEqual((await db.get('episode-six')).sceneReference,snapshot);
 assert.equal((await db.get('episode-seven'))?.sceneReference,undefined);
});
test('image generation sends the exact selected still with originals and keeps it separate from within-episode continuity',async()=>{
 let media={images:{first:later},sceneReference:snapshot},request;
 const oldFetch=global.fetch;
 const create=()=>compile('src/hooks/useMediaGeneration.ts',{
  react:{useRef:v=>({current:v})},'../utils/db':{db:{get:async()=>media}},
  '../constants':{CHARACTERS:[{id:'owonjang',name:'오원장',file:'owonjang.png',imgs:[png,png,png]}]},
 }).useMediaGeneration(()=>{},async()=>{},'episode-five',()=>{},{},()=>{},{},'owonjang');
 try{
  global.fetch=async(url,options)=>{assert.equal(url,'/api/generate-image');request=JSON.parse(options.body);return Response.json({result:png});};
  assert.equal(await create().handleGenerateImage('second','O-wonjang moves the cart',1,[{title:'first',prompt:'Earlier shot'}]),true);
  let labels=request.parts.filter(p=>p.text).map(p=>p.text);
  assert.equal(request.parts.filter(p=>p.inlineData).length,5);
  const refIndex=request.parts.findIndex(p=>p.text?.startsWith('[USER-SELECTED EARLIER EPISODE STILL:'));
  assert.equal(request.parts[refIndex+1].inlineData.data,png.split(',')[1]);
  assert.match(labels.at(-2),/PREVIOUS GENERATED SCENE/);
  assert.match(labels.at(-1),/Original character design sheets remain authoritative/);
  media={images:{}};request=undefined;
  assert.equal(await create().handleGenerateImage('first','O-wonjang at home',0,[]),true);
  assert.equal(request.parts.filter(p=>p.inlineData).length,3);
  assert.ok(!request.parts.some(p=>p.text?.includes('USER-SELECTED EARLIER')));
  media={images:{},sceneReference:{...snapshot,imageUrl:'https://bad.example'}};request=undefined;
  assert.equal(await create().handleGenerateImage('first','O-wonjang',0,[]),false);assert.equal(request,undefined);
 }finally{global.fetch=oldFetch;}
});
test('plan creation persists the snapshot before selecting the new record and never carries it into an unlinked plan',async()=>{
 const requests=[],events=[],saved=[];const oldFetch=global.fetch;
 const hook=compile('src/hooks/useGeneration.ts',{
  react:{useState:v=>[v,next=>events.push(['state',next])]},
  '../utils/db':{db:{setSceneReference:async(id,ref)=>events.push(['snapshot',id,ref])}},
  '../constants':{CHARACTERS:[{id:'owonjang',name:'오원장'}]},
 }).useGeneration(()=>{},record=>{saved.push(record);events.push(['history',record.id]);},{});
 try{
  global.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return Response.json({result:item.result});};
  assert.equal(await hook.handleGenerate('owonjang','5화','15s',undefined,snapshot),true);
  assert.deepEqual(requests[0].sceneReference,snapshot);
  const snap=events.findIndex(e=>e[0]==='snapshot'),chosen=events.findIndex(e=>e[0]==='state'&&e[1]===saved[0].id);
  assert.ok(snap>=0&&chosen>snap);assert.ok(!JSON.stringify(saved[0]).includes('data:image'));
  assert.equal(await hook.handleGenerate('owonjang','7화','15s'),true);
  assert.equal(requests[1].sceneReference,undefined);assert.notEqual(saved[0].id,saved[1].id);
  assert.equal(events.filter(e=>e[0]==='snapshot').length,1);
 }finally{global.fetch=oldFetch;}
});
