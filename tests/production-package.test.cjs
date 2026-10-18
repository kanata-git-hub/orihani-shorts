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

test('the 1900-character budget includes the actual heading, Unicode and legacy normalization',()=>{
  const {clipVideoText,KLING_PROMPT_TARGET}=compile('src/videoPrompt.ts');
  const pack=fresh(),clip=pack.episodes[0].plan.clips[0];
  clip.videoPrompt=videoPromptForCopy(clip.videoPrompt);
  clip.videoPrompt=clip.videoPrompt.replace('ACTION:', 'ACTION:'+'x'.repeat(KLING_PROMPT_TARGET-clipVideoText(clip.videoPrompt,0,clip.title).length));
  assert.equal(clipVideoText(clip.videoPrompt,0,clip.title).length,1900);
  assert.doesNotThrow(()=>readProductionPackage(JSON.stringify(pack)));
  clip.videoPrompt=clip.videoPrompt.replace('ACTION:', 'ACTION:x');
  assert.throws(()=>readProductionPackage(JSON.stringify(pack)),/1901/);
  clip.videoPrompt=clip.videoPrompt.replace('ACTION:x', 'ACTION:😀');
  assert.equal(clipVideoText(clip.videoPrompt,0,clip.title).length,1902);
  assert.throws(()=>readProductionPackage(JSON.stringify(pack)),/1902/);
  const long='ACTION: '+ 'x'.repeat(2200)+'\nDIALOGUE: No speech.\nAUDIO: Wind.';
  assert.ok(clipVideoText(long,1).startsWith('[CLIP 2]\n'+long),'copy never truncates an old prompt');
  assert.ok(clipVideoText(long,1).length>long.length+9,'legacy audio expansion is counted too');
});

test('prompt-only refresh preserves source, images, media keys and edits; mismatched or customized plans stay intact',()=>{
  const {refreshAuthoredVideoPrompts,needsVideoPromptRefresh}=compile('src/workflow/promptRevision.ts');
  const pack=readProductionPackage(raw),item=preparedHistory(pack.episodes[0],'previous');
  item.editorKey='existing-editor';item.backgroundChoices={'Scene 1':{mode:'previous',scene:1}};
  const plan=JSON.parse(item.result);
  plan.clips[0].videoPrompt+='\n'+ 'old long instruction '.repeat(130);
  item.result=JSON.stringify(plan);
  assert.equal(needsVideoPromptRefresh(item),true);
  const updated=refreshAuthoredVideoPrompts(item,pack),expected=structuredClone(item);
  const expectedPlan=JSON.parse(expected.result);
  expectedPlan.productionRevision=pack.revision;
  expectedPlan.clips.forEach((clip,i)=>clip.videoPrompt=pack.episodes[0].plan.clips[i].videoPrompt);
  expected.result=JSON.stringify(expectedPlan);
  assert.deepEqual(updated,expected);
  assert.equal(needsVideoPromptRefresh(updated),false);
  assert.equal(refreshAuthoredVideoPrompts(updated,pack),updated);
  for(const mutate of [
    p=>p.clips[0].imagePrompt+=' customized image',
    p=>p.clips[0].frame.action+=' different action',
    p=>p.clips[0].referencePlan.background=2,
    p=>p.productionSource='generated',
  ]){
    const custom=structuredClone(item),p=JSON.parse(custom.result);mutate(p);custom.result=JSON.stringify(p);
    assert.equal(refreshAuthoredVideoPrompts(custom,pack),custom);
  }
  const differentSource={...item,episode:{...item.episode,title:'Different story'}};
  assert.equal(refreshAuthoredVideoPrompts(differentSource,pack),differentSource);
});

test('the history hook persists prompt revisions without touching IndexedDB or changing record order',()=>{
  const pack=readProductionPackage(raw),item=preparedHistory(pack.episodes[0],'previous');
  const plan=JSON.parse(item.result);plan.clips[0].videoPrompt+='x'.repeat(2200);item.result=JSON.stringify(plan);
  const other={...item,id:'unrelated',result:'legacy text'};
  let stored=JSON.stringify([other,item]);const writes=[];
  const previous=global.localStorage;
  global.localStorage={getItem:()=>stored,setItem:(key,value)=>{assert.equal(key,'pov_director_history');stored=value;writes.push(value);}};
  try{
    const {useHistory}=compile('src/hooks/useHistory.ts',{
      react:{useState:v=>[typeof v==='function'?v():v,()=>{}],useRef:v=>({current:v}),useCallback:f=>f,useEffect:()=>{}},
      '../utils/db':{db:new Proxy({},{get:()=>{throw Error('Media must not be changed');}})},
    });
    const hook=useHistory(),changed=hook.applyVideoPromptRevision(pack);
    assert.equal(changed.length,1);assert.equal(changed[0].id,item.id);
    assert.deepEqual(JSON.parse(stored).map(i=>i.id),[other.id,item.id]);
    assert.equal(hook.applyVideoPromptRevision(pack).length,0);assert.equal(writes.length,1);
  }finally{global.localStorage=previous;}
});

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

test('the actual generation hook persists authored plans without any fetch/model call',async()=>{
  const saved=[],states=[];
  const {useGeneration}=compile('src/hooks/useGeneration.ts',{
    react:{useState:v=>[v,next=>states.push(next)]},
    '../authFetch':{authFetch:()=>{throw Error('Unexpected API call');}},
    '../constants':{CHARACTERS:[]},'../utils/db':{db:{}},
  });
  const hook=useGeneration(()=>{},item=>saved.push(item),{});
  const pack=readProductionPackage(raw);
  await hook.handleLoadPrepared(pack.episodes[0],pack.revision);
  assert.equal(saved.length,1);assert.equal(saved[0].characterId,'nurse');
  assert.deepEqual(JSON.parse(saved[0].result).clips,pack.episodes[0].plan.clips);
  assert.ok(states.includes(saved[0].result));
  const broken=fresh().episodes[0];delete broken.plan.clips[1].videoPrompt;
  await assert.rejects(hook.handleLoadPrepared(broken,pack.revision));assert.equal(saved.length,1);
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

test('weekly picker combines main and same-date bonus files without merging or truncating source packages',async()=>{
 const {createWeeklyReader,weeklySources}=compile('server/workflow/weekly.ts');
 const {readWeeklySources}=compile('src/workflow/productionPackage.ts');
 const main=fresh(),third=structuredClone(main.episodes[0]);third.number=3;third.episode.title=third.episode.title.replace('[에피소드 1]','[에피소드 3]');main.episodes.push(third);
 const bonus=fresh();bonus.revision='bonus-pair';
 const mainFile={id:'main_abcdefghijklmnopqrst',name:'[2026-10-18] 3D 오리 삼총사 릴스 개그 시리즈 주간 패키지.json',mimeType:'application/json'};
 const bonusFile={id:'bonus_abcdefghijklmnopqrst',name:'[2026-10-18] 번외 05-06 제작안.json',mimeType:'application/json',modifiedTime:'2026-10-18T01:00:00Z'};
 const unrelated=[{...bonusFile,id:'old_abcdefghijklmnopqrst',name:'[2026-10-17] 번외 03-04 제작안.json'}, {...bonusFile,id:'future_abcdefghijklmnopqr',name:'[2026-10-19] 번외 제작안.json'}, {...bonusFile,id:'review_abcdefghijklmnopqr',name:'[2026-10-18] 번외 05-06 검수기록.json'}, {...bonusFile,id:'older_abcdefghijklmnopqrs',modifiedTime:'2026-10-18T00:00:00Z'}];
 assert.deepEqual(weeklySources([mainFile,bonusFile,...unrelated]).map(f=>f.id),[mainFile.id,bonusFile.id]);
 const sourceTexts=[JSON.stringify(main),JSON.stringify(bonus)];
 const reader=createWeeklyReader({key:()=> 'test',fetch:async url=>{
  const u=new URL(url);
  if(u.pathname==='/drive/v3/files')return Response.json({files:[mainFile,bonusFile,...unrelated]});
  if(u.pathname.endsWith(mainFile.id))return new Response(sourceTexts[0]);
  assert.ok(u.pathname.endsWith(bonusFile.id));return new Response(sourceTexts[1]);
 }});
 const result=await reader();assert.equal(result.episodeCount,5);assert.equal(result.sources.length,2);
 const choices=readWeeklySources(result.sources.map(s=>s.text));assert.equal(choices.length,5);
 assert.equal(choices[3].preparedRevision,'bonus-pair');assert.deepEqual(choices[3].prepared,bonus.episodes[0]);assert.equal(result.text,sourceTexts[0]);
 assert.throws(()=>readWeeklySources([sourceTexts[0],sourceTexts[0]]),/중복/);
 const bad=createWeeklyReader({key:()=> 'test',fetch:async url=>new URL(url).pathname==='/drive/v3/files'?Response.json({files:[mainFile,bonusFile]}):new Response(new URL(url).pathname.endsWith(mainFile.id)?sourceTexts[0]:'{}')});
 await assert.rejects(bad(),/완성 제작안/);
});
