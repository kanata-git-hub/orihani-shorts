const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function compile(rel,mocks={}){
  const m={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  new Function('require','module','exports',code)(n=>Object.hasOwn(mocks,n)?mocks[n]:n.startsWith('.')?compile(path.join(path.dirname(rel),n)+'.ts',mocks):require(n),m,m.exports);
  return m.exports;
}
const raw=fs.readFileSync(path.join(root,'tests/fixtures/authored-production.json'),'utf8');
const {readProductionPackage,readWeeklyInput,preparedHistory,isAuthoredPlan}=compile('src/workflow/productionPackage.ts');
const {readPackage,makePackage}=compile('src/workflow/package.ts');
const {extractClips}=compile('src/utils/extractors.ts');
const {videoPromptForCopy}=compile('src/videoPrompt.ts');
const fresh=()=>JSON.parse(raw);

test('authored package loads all 16 prompts unchanged, links the script and round-trips through old work files',()=>{
  const pack=readProductionPackage(raw),choices=readWeeklyInput(raw);
  assert.deepEqual(pack.episodes.map(e=>e.number),[1,2]);
  assert.equal(choices[0].preparedRevision,pack.revision);
  for(const e of pack.episodes){
    const item=preparedHistory(e,pack.revision),again=preparedHistory(e,pack.revision);
    assert.notEqual(item.id,again.id);
    assert.equal(isAuthoredPlan(item.result),true);
    assert.deepEqual(item.episode,e.episode);
    const restored=readPackage(makePackage(item,{}));
    assert.equal(restored.item.result,item.result);
    const clips=extractClips(restored.item.result);
    assert.equal(clips.length,4);
    clips.forEach((c,i)=>{
      assert.equal(c.referencePlanError,undefined);
      assert.equal(c.imagePrompt,e.plan.clips[i].imagePrompt);
      assert.equal(c.videoPrompt,e.plan.clips[i].videoPrompt);
      assert.equal(videoPromptForCopy(videoPromptForCopy(c.videoPrompt)),videoPromptForCopy(c.videoPrompt));
      assert.ok(!c.imagePrompt.includes(e.plan.clips[i].frame.action));
      assert.ok(c.videoPrompt.includes(e.plan.clips[i].frame.action));
    });
  }
});

test('bad timing, missing prompts, stale sources, duplicate names and forward references fail before import',()=>{
  for(const mutate of [
    p=>p.episodes[0].plan.clips[2].videoPrompt=p.episodes[0].plan.clips[2].videoPrompt.replace('OUTPUT SPECS: 3s','OUTPUT SPECS: 4s'),
    p=>delete p.episodes[0].plan.clips[1].imagePrompt,
    p=>p.episodes[0].plan.scenario+='changed',
    p=>p.episodes[0].plan.clips[1].imageTitle=p.episodes[0].plan.clips[0].imageTitle,
    p=>p.episodes[0].plan.clips[1].referencePlan.background=4,
    p=>p.episodes[0].plan.clips[1].frame.props.push({id:'invented',placement:'test',parts:[]}),
    p=>p.episodes[0].plan.clips[0].videoPrompt=p.episodes[0].plan.clips[0].videoPrompt.replace('DIALOGUE:','MISSING:'),
    p=>p.episodes[1].number=1,
  ]){
    const value=fresh();mutate(value);assert.throws(()=>readProductionPackage(JSON.stringify(value)));
  }
  assert.throws(()=>readProductionPackage('{'));
  assert.throws(()=>readProductionPackage('x'.repeat(300001)));
});

test('the actual generation hook persists authored plans without any fetch/model call',()=>{
  const saved=[],states=[];
  const {useGeneration}=compile('src/hooks/useGeneration.ts',{
    react:{useState:v=>[v,next=>states.push(next)]},
    '../authFetch':{authFetch:()=>{throw Error('Unexpected API call');}},
    '../constants':{CHARACTERS:[]},'../utils/db':{db:{}},
  });
  const hook=useGeneration(()=>{},item=>saved.push(item),{});
  const pack=readProductionPackage(raw);
  hook.handleLoadPrepared(pack.episodes[0],pack.revision);
  assert.equal(saved.length,1);assert.equal(saved[0].characterId,'nurse');
  assert.deepEqual(JSON.parse(saved[0].result).clips,pack.episodes[0].plan.clips);
  assert.ok(states.includes(saved[0].result));
  const broken=fresh().episodes[0];delete broken.plan.clips[1].videoPrompt;
  assert.throws(()=>hook.handleLoadPrepared(broken,pack.revision));assert.equal(saved.length,1);
});

test('Drive prefers same-date authored JSON, reads it without AI, and never falls back from a malformed latest package',async()=>{
  const {newestWeekly,createWeeklyReader}=compile('server/workflow/weekly.ts');
  const stem='[2026-10-14] 3D 오리 삼총사 릴스 개그 시리즈 주간 패키지';
  const json={id:'j'.repeat(25),name:stem+'.json',mimeType:'application/json',modifiedTime:'2026-10-14T00:00:00Z'};
  const doc={id:'d'.repeat(25),name:stem+'.md',mimeType:'application/vnd.google-apps.document',modifiedTime:'2026-10-14T12:00:00Z'};
  assert.equal(newestWeekly([doc,json]).id,json.id);
  const calls=[];
  const read=createWeeklyReader({key:()=> 'test-only',fetch:async url=>{calls.push(String(url));return String(url).includes('/files?')?Response.json({files:[doc,json]}):new Response(raw);}});
  const result=await read();assert.equal(result.episodeCount,2);assert.equal(result.text,raw);
  assert.ok(calls[1].includes(json.id));assert.ok(calls[1].includes('alt=media'));
  const badCalls=[];
  const bad=createWeeklyReader({key:()=> 'test-only',fetch:async url=>{badCalls.push(String(url));return String(url).includes('/files?')?Response.json({files:[doc,json]}):new Response('{"format":"bad"}');}});
  await assert.rejects(bad());assert.equal(badCalls.length,2);
  const legacy=fs.readFileSync(path.join(root,'docs/editorial-reviews/2026-10-11-16-18-adult-life/screenplay.txt'),'utf8');
  assert.equal(readWeeklyInput(legacy).length,3);assert.equal(readWeeklyInput(legacy)[0].prepared,undefined);
});
