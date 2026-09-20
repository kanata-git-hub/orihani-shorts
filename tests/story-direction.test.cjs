const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function compile(rel,mocks={},runtime={}){
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 new Function('require','module','exports','process','console',code)(name=>name.endsWith('/authFetch')?{authFetch:(...args)=>fetch(...args)}:Object.hasOwn(mocks,name)?mocks[name]:name.startsWith('.')?compile(path.posix.normalize(path.posix.join(path.posix.dirname(rel),name)).replace(/\.ts$/, '')+'.ts',mocks,runtime):require(name),m,m.exports,runtime.process||process,runtime.console||console);
 return m.exports;
}
const {episodePrompt}=compile('src/workflow/weekly.ts');
const source={duration:15,title:'[에피소드 4] 4화 퇴근의 문 (하찮은 오리 일상)',scenario:'[장면 1 (4초)]\n거대한 성문을 미는 덕이.\n[장면 2 (4초)]\n낮은 측면 구도.\n[장면 3 (3초)]\n문이 열린다.\n[장면 4 (4초)]\n현실의 출입문.',korean:'[장면 1]\n(무대사)\n[장면 4]\n소미 대사: 당기는 문이에요.',caption:'4화 퇴근의 문\n#퇴근 #하찮은오리일상 #오원장 #애니메이션 #유머',thumbnail:'4화 퇴근의 문'};
const result={title:'rewritten',scenario:'rewritten',clips:[4,4,3,4].map((s,i)=>({imageTitle:`Scene ${i+1}`,imagePrompt:'current image',videoPrompt:`OUTPUT SPECS: ${s}s, vertical 9:16.\nACTION: Push.\nDIALOGUE: None.`,locationId:'gate',backgroundAsset:'none',sceneTransition:i===3?'new-scene':'reframe',shot:{size:i===1?'close-up':'wide',angle:'low angle',focus:'Deok-i and gate',startState:'Leaning forward'}}))};
function server(){
 const routes={},calls=[];
 const app={use(){},post(route,handler){routes[route]=handler;},get(){},listen(){}};
 const express=()=>app;express.json=()=>{};express.static=()=>{};
 compile('server.ts',{'express':express,'./server/editor/routes':{editorRouter:{}},'dotenv':{config(){}},'@google/genai':{GoogleGenAI:class{models={generateContent:async request=>{calls.push(request);return {text:request.config?.responseMimeType?JSON.stringify(result):'FREE FORM PLAN'};}};}}},{process:{...process,env:{NODE_ENV:'production'},argv:[],cwd:()=>root},console:{log(){}}});
 const response={statusCode:200,status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;}};
 return {calls,response,run:body=>routes['/api/generate']({body},response)};
}
test('selected weekly screenplay bypasses ideation and reaches conversion unchanged',async()=>{
 const s=server();await s.run({duration:'15s',customPrompt:episodePrompt(source),sourceEpisode:source});
 assert.equal(s.response.statusCode,200);assert.equal(s.calls.length,1);
 assert.ok(s.calls[0].contents.includes(source.scenario));assert.ok(s.calls[0].contents.includes(source.korean));
 assert.match(s.calls[0].contents,/AUTHORITATIVE FINISHED SCREENPLAY/);
 assert.match(s.calls[0].config.systemInstruction,/Deok-i: keep his own ORIGINAL yellow/);
 assert.equal(s.calls[0].config.temperature,0.2);
 const plan=JSON.parse(s.response.body.result);assert.equal(plan.scenario,source.scenario);
 assert.equal(plan.title,'4화 퇴근의 문 (하찮은 오리 일상)');assert.deepEqual(plan.hashtags,['퇴근','하찮은오리일상','오원장','애니메이션','유머']);
 assert.equal(plan.clips[1].shot.size,'close-up');
 assert.match(plan.clips[1].videoPrompt,/@image2 = Scene 2 start frame reference/);
});
test('free-form ideas still plan and then convert; mismatched source fails before any model call',async()=>{
 const s=server();await s.run({duration:'15s',customPrompt:'a new idea'});assert.equal(s.calls.length,2);assert.equal(s.response.statusCode,200);
 const invalid=server();await invalid.run({duration:'15s',customPrompt:'edited story',sourceEpisode:source});assert.equal(invalid.response.statusCode,400);assert.equal(invalid.calls.length,0);
});
test('generation hook sends the selected source rather than only storing it in history',async()=>{
 let request,history;
 const old=global.fetch;
 const hook=compile('src/hooks/useGeneration.ts',{'react':{useState:v=>[v,()=>{}]},'../constants':{CHARACTERS:[{id:'deoki',name:'덕이'}]},'../utils/db':{db:{}}});
 try{
  global.fetch=async(url,options)=>{request=JSON.parse(options.body);return Response.json({result:JSON.stringify(result)});};
  const api=hook.useGeneration(()=>{},v=>{history=v;},{});
  assert.equal(await api.handleGenerate('deoki',episodePrompt(source),'15s',source),true);
  assert.deepEqual(request.sourceEpisode,source);assert.deepEqual(history.episode,source);
 }finally{global.fetch=old;}
});
