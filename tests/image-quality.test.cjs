const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function compile(rel,mocks={}){
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(name=>Object.hasOwn(mocks,name)?mocks[name]:name.startsWith('.')?compile(path.posix.normalize(path.posix.join(path.posix.dirname(rel),name))+'.ts',mocks):require(name),m,m.exports);
 return m.exports;
}
const {readImageRequest,generateReviewedImage}=compile('server/imageGeneration.ts');
const {IMAGE_MODELS,approvedImage,readImageReview}=compile('src/imageQuality.ts');
const png='data:image/png;base64,AQID';
const parts=[{text:'ORIGINAL ONE DUCK'}, {inlineData:{mimeType:'image/png',data:'AQID'}},{text:'START: One duck inside a bottomless box. Connected feet underneath.'}];
function fakeAI(review='{"issues":[]}'){
 const calls=[];
 return {calls,models:{generateContent:async r=>{calls.push(r);if(r.model.includes('image'))return {modelVersion:r.model,candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:'BAUG'}}]}}]};if(review instanceof Error)throw review;return {text:review};}}};
}
test('image comparison sends identical references/config, reviews real output and performs no retries',async()=>{
 const a=fakeAI(),b=fakeAI();
 const x=await generateReviewedImage(a,readImageRequest({parts,imageModel:IMAGE_MODELS[0]}));
 const y=await generateReviewedImage(b,readImageRequest({parts,imageModel:IMAGE_MODELS[1]}));
 assert.equal(x.inputHash,y.inputHash);assert.notEqual(x.model,y.model);
 assert.deepEqual(a.calls[0].contents,b.calls[0].contents);assert.deepEqual(a.calls[0].config,b.calls[0].config);
 assert.equal(a.calls.length,2);assert.equal(b.calls.length,2);
 assert.deepEqual(a.calls[1].contents.parts.at(-1),{inlineData:{mimeType:'image/png',data:'BAUG'}});
 assert.equal(approvedImage(x),'data:image/png;base64,BAUG');
});
test('detached feet, uncertainty and failed/malformed review retain candidates but never approve',async()=>{
 for(const review of [JSON.stringify({issues:[{category:'anatomy',severity:'error',evidence:'상자와 떨어진 바닥에 발 두 개가 있습니다.'}]}),JSON.stringify({issues:[{category:'geometry',severity:'uncertain',evidence:'문 위치를 확인할 수 없습니다.'}]}),'bad json',new Error('temporarily unavailable')]){
  const ai=fakeAI(review),value=await generateReviewedImage(ai,readImageRequest({parts}));
  assert.ok(value.candidate);assert.equal(value.result,undefined);assert.equal(approvedImage(value),undefined);assert.equal(ai.calls.length,2);
 }
 assert.throws(()=>readImageReview('{"issues":[{"category":"anatomy","severity":"error","evidence":""}]}'));
 assert.equal(approvedImage({result:png}),undefined);
});
test('unknown models, remote URLs and excess references fail before provider calls',()=>{
 assert.throws(()=>readImageRequest({parts,imageModel:'other-model'}));
 assert.throws(()=>readImageRequest({parts:[{text:'draw'},{fileData:{fileUri:'https://example.com'}}]}));
 assert.throws(()=>readImageRequest({parts:[{text:'draw'},...Array(15).fill(parts[1])]}));
});
test('client keeps old images on rejection, persists failed candidate, comparison never overwrites',async()=>{
 for (const compare of [false,true]) {
  const requests=[],reports=[],saves=[],state=[];
  const failure={model:IMAGE_MODELS[0],candidate:png,review:{status:'fail',issues:[{category:'anatomy',severity:'error',evidence:'몸에서 떨어진 발'}]}};
  const hook=compile('src/hooks/useMediaGeneration.ts',{
   react:{useRef:v=>({current:v})},'../authFetch':{authFetch:async(u,o)=>{requests.push(JSON.parse(o.body));return Response.json(failure);}},
   '../utils/db':{db:{get:async()=>({images:{old:png}}),setImageChecks:async(...args)=>reports.push(args)}},
   '../constants':{CHARACTERS:[{id:'deoki',name:'덕이',file:'duck',imgs:[png]}]},
  }).useMediaGeneration(()=>{},async(...v)=>saves.push(v),'record',()=>{},{old:png},v=>state.push(v),{},'deoki');
  const scenes=[{title:'first',prompt:'Deok-i inside a box',referencePlan:{background:null,props:[]},backgroundAsset:'none'}];
  await (compare?hook.handleCompareImages:hook.handleGenerateImage)('first',scenes[0].prompt,0,scenes);
  assert.equal(saves.length,0);assert.equal(state.length,0);assert.equal(reports.length,1);assert.equal(reports[0][2].rows[0].candidate,png);
  assert.equal(requests.length,compare?2:1);
  if(compare)assert.deepEqual(requests[0].parts,requests[1].parts);
 }
});
test('saving review candidates preserves existing images and reference assignments in IndexedDB',async()=>{
 require('fake-indexeddb/auto');global.window=new EventTarget();
 const {db}=compile('src/utils/db.ts');
 await db.set('quality-test',{images:{old:png},clipReferences:{old:{foo:'preserved'}}});
 await db.setImageChecks('quality-test','first',{mode:'generation',rows:[{candidate:png}]});
 const value=await db.get('quality-test');assert.equal(value.images.old,png);assert.equal(value.clipReferences.old.foo,'preserved');assert.equal(value.imageChecks.first.rows[0].candidate,png);
 assert.deepEqual((await db.summaries())['quality-test'].imageTitles,['old']);await db.delete('quality-test');
});
