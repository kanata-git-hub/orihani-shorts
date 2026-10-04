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
 const x=await generateReviewedImage(a,readImageRequest({parts,imageModel:IMAGE_MODELS[0],operation:'compare'}));
 const y=await generateReviewedImage(b,readImageRequest({parts,imageModel:IMAGE_MODELS[1],operation:'compare'}));
 assert.equal(x.inputHash,y.inputHash);assert.notEqual(x.model,y.model);
 assert.deepEqual(a.calls[0].contents,b.calls[0].contents);assert.deepEqual(a.calls[0].config,b.calls[0].config);
 assert.equal(a.calls.length,2);assert.equal(b.calls.length,2);
 assert.deepEqual(a.calls[1].contents.parts.at(-1),{inlineData:{mimeType:'image/png',data:'BAUG'}});
 assert.equal(approvedImage(x),'data:image/png;base64,BAUG');
});
test('detached feet, uncertainty and failed/malformed review retain candidates but never approve',async()=>{
 for(const review of [JSON.stringify({issues:[{category:'anatomy',severity:'error',evidence:'상자와 떨어진 바닥에 발 두 개가 있습니다.'}]}),JSON.stringify({issues:[{category:'geometry',severity:'uncertain',evidence:'문 위치를 확인할 수 없습니다.'}]}),'bad json',new Error('temporarily unavailable')]){
  const ai=fakeAI(review),value=await generateReviewedImage(ai,readImageRequest({parts,operation:'compare'}));
  assert.ok(value.candidate);assert.equal(value.result,undefined);assert.equal(approvedImage(value),undefined);assert.equal(ai.calls.length,review === 'bad json' ? 3 : 2);
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

const badReview=JSON.stringify({issues:[{category:'anatomy',severity:'error',evidence:'발 세 개',fix:'Remove only the extra third foot; retain the two connected feet.'}]});
function sequenceAI(reviews,editError) {
 const calls=[];let imageCalls=0;
 return {calls,models:{generateContent:async r=>{
  calls.push(r);
  if(r.model.includes('image')){
   imageCalls++;if(editError&&imageCalls===2)throw editError;
   return {modelVersion:r.model,candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:['BAUG','BwgJ','CgsM','DQ4P'][imageCalls-1]}}]}}]};
  }
  const value=reviews.shift();if(value instanceof Error)throw value;return {text:value,modelVersion:r.model};
 }}};
}
test('normal image flow makes one targeted Flash edit and rechecks it before approval',async()=>{
 const ai=sequenceAI([badReview,'{"issues":[]}']);const r=await generateReviewedImage(ai,readImageRequest({parts}));
 assert.deepEqual(ai.calls.map(c=>c.model),['gemini-3.1-flash-image','gemini-3.8-flash','gemini-3.1-flash-image','gemini-3.8-flash']);
 assert.equal(r.repairCount,1);assert.equal(r.attempts.length,2);assert.equal(approvedImage(r),'data:image/png;base64,BwgJ');
 assert.deepEqual(ai.calls[2].contents.parts.at(-2),{inlineData:{mimeType:'image/png',data:'BAUG'}});
 assert.match(ai.calls[2].contents.parts.at(-1).text,/Remove only the extra third foot/);
 assert.match(ai.calls[3].contents.parts.at(-4).text,/PRE-EDIT/);
 assert.deepEqual(ai.calls[3].contents.parts.at(-1),{inlineData:{mimeType:'image/png',data:'BwgJ'}});
});
test('four failed candidates stop at the hard image-call cap and keep every candidate',async()=>{
 const ai=sequenceAI(Array(4).fill(badReview)),r=await generateReviewedImage(ai,readImageRequest({parts}));
 assert.equal(ai.calls.length,8);assert.equal(r.repairCount,3);assert.equal(r.maxRepairs,3);
 assert.equal(r.attempts.length,4);assert.equal(approvedImage(r),undefined);assert.equal(r.candidate,'data:image/png;base64,DQ4P');
 assert.ok(ai.calls.every(c=>['gemini-3.1-flash-image','gemini-3.8-flash'].includes(c.model)));
});
test('success after any repair stops immediately and each edit targets only the latest image and findings',async()=>{
 const fixes=['Remove the extra foot.','Restore the original glasses.','Close the starting-state door.'];
 const checks=fixes.map((fix,i)=>JSON.stringify({issues:[{category:['anatomy','identity','start-state'][i],severity:'error',evidence:`visible error ${i+1}`,fix}]}));
 const payloads=['BAUG','BwgJ','CgsM','DQ4P'];
 for(let edits=0;edits<=3;edits++){
  const ai=sequenceAI([...checks.slice(0,edits),'{"issues":[]}']);
  const r=await generateReviewedImage(ai,readImageRequest({parts}));
  assert.equal(ai.calls.length,2*(edits+1));assert.equal(r.repairCount,edits);
  assert.equal(approvedImage(r),`data:image/png;base64,${payloads[edits]}`);
  for(let edit=1;edit<=edits;edit++){
   const request=ai.calls[edit*2].contents.parts;
   assert.deepEqual(request.slice(0,parts.length),parts);
   assert.deepEqual(request.at(-2),{inlineData:{mimeType:'image/png',data:payloads[edit-1]}});
   assert.ok(request.at(-1).text.includes(fixes[edit-1]));
   for(const other of fixes.filter(f=>f!==fixes[edit-1]))assert.ok(!request.at(-1).text.includes(other));
   const review=ai.calls[edit*2+1].contents.parts;
   assert.deepEqual(review.at(-3),{inlineData:{mimeType:'image/png',data:payloads[edit-1]}});
   assert.deepEqual(review.at(-1),{inlineData:{mimeType:'image/png',data:payloads[edit]}});
  }
 }
});
test('network and uncertain checks stop early without escalating or retrying paid requests',async()=>{
 const unavailable=sequenceAI([badReview,new Error('429 quota')]);
 const stopped=await generateReviewedImage(unavailable,readImageRequest({parts}));
 assert.equal(unavailable.calls.length,4);assert.equal(stopped.repairCount,1);assert.equal(approvedImage(stopped),undefined);
 const ai=sequenceAI([badReview],new Error('503'));const r=await generateReviewedImage(ai,readImageRequest({parts}));
 assert.equal(ai.calls.length,3);assert.equal(r.candidate,'data:image/png;base64,BAUG');assert.match(r.repairError,/503/);assert.equal(approvedImage(r),undefined);
 for(const check of [new Error('429'),JSON.stringify({issues:[{category:'geometry',severity:'uncertain',evidence:'가려진 문',fix:'Inspect manually.'}]})]){
  const ai=sequenceAI([check]),r=await generateReviewedImage(ai,readImageRequest({parts}));
  assert.equal(ai.calls.length,2);assert.equal(r.repairCount,0);assert.equal(approvedImage(r),undefined);
 }
});
test('existing image recheck costs only one Flash call and no image generation',async()=>{
 const ai=sequenceAI([badReview]);const r=await generateReviewedImage(ai,readImageRequest({parts,operation:'review',candidate:png}));
 assert.equal(ai.calls.length,1);assert.equal(ai.calls[0].model,'gemini-3.8-flash');assert.equal(r.candidate,png);assert.equal(r.model,'existing-image');assert.equal(r.repairCount,0);
 assert.throws(()=>readImageRequest({parts,operation:'repair',imageModel:'gemini-3-pro-image',candidate:png}));
 assert.throws(()=>readImageRequest({parts,operation:'review',candidate:'https://example.com/image'}));
});
test('existing image repair is bounded and never discards original references to make room',async()=>{
 const ai=sequenceAI([badReview,'{"issues":[]}']);const r=await generateReviewedImage(ai,readImageRequest({parts,operation:'repair',candidate:png}));
 assert.equal(ai.calls.length,3);assert.equal(r.repairCount,1);assert.equal(r.attempts[0].candidate,png);assert.equal(r.review.status,'pass');
 const capped=sequenceAI(Array(4).fill(badReview));
 const failed=await generateReviewedImage(capped,readImageRequest({parts,operation:'repair',candidate:png}));
 assert.equal(capped.calls.length,7);assert.equal(failed.repairCount,3);assert.equal(failed.attempts.length,4);
 assert.equal(failed.attempts[0].candidate,png);assert.equal(approvedImage(failed),undefined);
 const all=[{text:'original refs'},...Array(14).fill(parts[1])],b=sequenceAI([badReview]);
 const held=await generateReviewedImage(b,readImageRequest({parts:all,operation:'repair',candidate:png}));
 assert.equal(b.calls.length,1);assert.equal(held.repairCount,0);assert.match(held.repairError,/14/);assert.equal(approvedImage(held),undefined);
});

test('client recheck preserves old scene even on pass; successful repair applies only corrected image',async()=>{
 for(const repair of [false,true]){
  const requests=[],saves=[],reports=[];
  const hook=compile('src/hooks/useMediaGeneration.ts',{
   react:{useRef:v=>({current:v})},'../authFetch':{authFetch:async(u,o)=>{requests.push(JSON.parse(o.body));return Response.json({model:'existing-image',candidate:png,result:png,review:{status:'pass',issues:[]}});}},
   '../utils/db':{db:{get:async()=>({images:{first:'data:image/png;base64,BAUG'},imageChecks:{first:{mode:'comparison',rows:[{candidate:png},{candidate:'data:image/png;base64,BwgJ'}]}}}),setImageChecks:async(...v)=>reports.push(v)}},
   '../constants':{CHARACTERS:[{id:'deoki',name:'덕이',file:'duck',imgs:[png]}]},
  }).useMediaGeneration(()=>{},async(...v)=>saves.push(v),'record',()=>{},{},()=>{},{},'deoki');
  const scenes=[{title:'first',prompt:'Deok-i inside a box',referencePlan:{background:null,props:[]},backgroundAsset:'none'}];
  await hook.handleReviewImage('first',scenes[0].prompt,0,scenes,'',png,repair);
  assert.equal(requests[0].operation,repair?'repair':'review');assert.equal(requests[0].candidate,png);
  assert.equal(saves.length,repair?1:0);assert.equal(reports[0][2].rows.length,2);assert.equal(reports[0][2].rows[1].candidate,'data:image/png;base64,BwgJ');
 }
});

test('empty or truncated review recovers with one review-only retry and records both responses',async()=>{
 for(const broken of ['', '   ', '{"issues":[']){
  const ai=sequenceAI([broken,'{"issues":[]}']);
  const result=await generateReviewedImage(ai,readImageRequest({parts}));
  assert.equal(ai.calls.filter(c=>c.model.includes('image')).length,1);
  assert.equal(ai.calls.length,3);assert.equal(result.review.status,'pass');
  assert.equal(result.attempts[0].reviewCalls.length,2);
  assert.deepEqual(ai.calls[1].contents,ai.calls[2].contents);
  assert.equal(ai.calls[2].config.httpOptions.timeout,60000);
  assert.equal(ai.calls[2].config.httpOptions.retryOptions.attempts,1);
  assert.equal(approvedImage(result),'data:image/png;base64,BAUG');
 }
 assert.equal(readImageReview('```json\n{"issues":[]}\n```').status,'pass');
});

test('repeated empty review stops with a usable candidate, Korean explanation and no false approval',async()=>{
 const ai=sequenceAI(['','']);
 const result=await generateReviewedImage(ai,readImageRequest({parts}));
 assert.equal(ai.calls.length,3);assert.equal(result.review.status,'unavailable');
 assert.equal(result.candidate,'data:image/png;base64,BAUG');assert.equal(approvedImage(result),undefined);
 assert.match(result.review.error,/그림은 유지/);assert.doesNotMatch(result.review.error,/JSON input|SyntaxError/);
 assert.deepEqual(result.attempts[0].reviewCalls.map(c=>c.code),['EMPTY_RESPONSE','EMPTY_RESPONSE']);
});

test('the retry budget belongs to the entire request, including later image edits',async()=>{
 const ai=sequenceAI(['',badReview,'']);
 const result=await generateReviewedImage(ai,readImageRequest({parts}));
 assert.equal(ai.calls.length,5);assert.equal(result.repairCount,1);
 assert.equal(result.candidate,'data:image/png;base64,BwgJ');assert.equal(result.review.status,'unavailable');
 assert.deepEqual(result.attempts.map(a=>a.reviewCalls.length),[2,1]);
});

test('finish reasons are retained; truncated output retries but blocked responses never pass or retry',async()=>{
 for(const finishReason of ['MAX_TOKENS','SAFETY']){
  let calls=0;
  const ai={models:{generateContent:async()=>{calls++;return {text:'{"issues":[]}',modelVersion:'test-review',responseId:'response-1',usageMetadata:{totalTokenCount:42},candidates:[{finishReason:calls===1?finishReason:'STOP'}]};}}};
  const result=await generateReviewedImage(ai,readImageRequest({parts,operation:'review',candidate:png}));
  assert.equal(calls,finishReason==='MAX_TOKENS'?2:1);
  assert.equal(result.review.status,finishReason==='MAX_TOKENS'?'pass':'unavailable');
  const info=result.attempts[0].reviewCalls[0];
  assert.equal(info.finishReason,finishReason);assert.equal(info.responseId,'response-1');assert.equal(info.usage.totalTokenCount,42);
 }
});

test('empty HTTP, HTML errors and invalid JSON recheck preserve the original image, history and release busy state',async()=>{
 for(const response of [()=>new Response(''),()=>new Response('<html>timeout</html>',{status:504}),()=>new Response('{"candidate":')]){
  const reports=[],saves=[],busy=[],toasts=[];
  const old={model:IMAGE_MODELS[0],candidate:png,inputHash:'original',attempts:[{candidate:png,review:{status:'unavailable',issues:[]}}]};
  const hook=compile('src/hooks/useMediaGeneration.ts',{
   react:{useRef:v=>({current:v})},'../authFetch':{authFetch:async()=>response()},
   '../utils/db':{db:{get:async()=>({images:{first:png},imageChecks:{first:{mode:'generation',rows:[old]}}}),setImageChecks:async(...v)=>reports.push(v)}},
   '../constants':{CHARACTERS:[{id:'deoki',name:'덕이',file:'duck',imgs:[png]}]},
  }).useMediaGeneration((...v)=>toasts.push(v),async(...v)=>saves.push(v),'record',fn=>busy.push(fn({})),{},()=>{},{},'deoki');
  const scenes=[{title:'first',prompt:'Deok-i inside a box',referencePlan:{background:null,props:[]},backgroundAsset:'none'}];
  assert.equal(await hook.handleReviewImage('first',scenes[0].prompt,0,scenes,'',png,false),false);
  const row=reports[0][2].rows[0];
  assert.equal(row.candidate,png);assert.deepEqual(row.attempts,old.attempts);assert.equal(row.inputHash,'original');
  assert.equal(row.review.status,'unavailable');assert.equal(saves.length,0);assert.equal(busy.at(-1).first,false);
  assert.doesNotMatch(row.error,/Unexpected|<html>/);assert.match(toasts.at(-1)[0],/그림을 보관/);
 }
});

test('manual selection applies only that image without provider calls or changing its review status',async()=>{
 const saves=[];let images={other:'data:image/png;base64,BwgJ'};
 const hook=compile('src/hooks/useMediaGeneration.ts',{
  react:{useRef:v=>({current:v})},'../authFetch':{authFetch:async()=>{throw Error('must not generate');}},
  '../constants':{CHARACTERS:[]},
 }).useMediaGeneration(()=>{},async(...v)=>saves.push(v),'record',()=>{},images,fn=>{images=fn(images);},{},'deoki');
 assert.equal(await hook.handleApplyImage('first',png),true);
 assert.deepEqual(saves,[['record',{first:png}]]);assert.equal(images.other,'data:image/png;base64,BwgJ');assert.equal(images.first,png);
 assert.equal(await hook.handleApplyImage('first','https://example.com/image'),false);assert.equal(saves.length,1);
});


test('a failed new generation keeps the previous candidate available without applying it again',async()=>{
 const reports=[],saves=[];
 const hook=compile('src/hooks/useMediaGeneration.ts',{
  react:{useRef:v=>({current:v})},'../authFetch':{authFetch:async()=>new Response('',{status:502})},
  '../utils/db':{db:{get:async()=>({imageChecks:{first:{mode:'generation',rows:[{model:IMAGE_MODELS[0],candidate:png,result:png,review:{status:'pass',issues:[]}}]}}}),setImageChecks:async(...v)=>reports.push(v)}},
  '../constants':{CHARACTERS:[{id:'deoki',name:'덕이',file:'duck',imgs:[png]}]},
 }).useMediaGeneration(()=>{},async(...v)=>saves.push(v),'record',()=>{},{},()=>{},{},'deoki');
 const scenes=[{title:'first',prompt:'Deok-i inside a box',referencePlan:{background:null,props:[]},backgroundAsset:'none'}];
 await hook.handleGenerateImage('first',scenes[0].prompt,0,scenes);
 assert.equal(reports[0][2].rows[0].candidate,png);assert.equal(reports[0][2].rows[0].result,undefined);
 assert.match(reports[0][2].rows[0].error,/이전 그림을 보관/);assert.equal(saves.length,0);
});
