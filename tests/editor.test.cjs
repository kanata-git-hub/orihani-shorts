const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compiled = path.join(root, '.editor-test');
fs.mkdirSync(compiled, { recursive: true });
fs.writeFileSync(path.join(compiled, 'package.json'), '{"type":"commonjs"}');
for (const f of ['server/workflow/weekly.ts','src/workflow/package.ts','src/workflow/progress.ts','src/workflow/weekly.ts','src/utils/db.ts','src/utils/extractors.ts','src/editor/text.ts','src/editor/draft.ts','src/editor/model.ts', 'src/editor/media.ts', 'src/editor/storage.ts', 'server/editor/render.ts', 'server/editor/typography.ts', 'server/editor/routes.ts', 'src/editor/speech.ts', 'server/editor/transcribe.ts']) {
  const dest = path.join(compiled, f.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, ts.transpileModule(fs.readFileSync(path.join(root, f), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText);
}
const { defaultPlan, validatePlan, importEpisode } = require(path.join(compiled, 'src/editor/model.js'));
const { cleanVideoText } = require(path.join(compiled, 'src/editor/text.js'));
const draftModel = require(path.join(compiled, 'src/editor/draft.js'));
const { recordProgress, recordDraftId } = require(path.join(compiled, 'src/workflow/progress.js'));
const makeDraft = (patch={}) => ({id:'independent-uuid',plan:defaultPlan(),original:'',voice:'Zubenelgenubi',style:'편안하게',videos:[],...patch});
test('safe text removes emoji clusters, decorations and invisible marks without losing ordinary text',()=>{
  assert.equal(cleanVideoText('치약 짰더니 로켓? 🚀'),'치약 짰더니 로켓?');
  assert.equal(cleanVideoText('가👨‍👩‍👧‍👦나 👍🏽 🇰🇷 ✨ ★ ■ \uFFFD'),'가 나');
  assert.equal(cleanVideoText('1️⃣ 2⃣ #️⃣ *️⃣'),'1 2 # *');
  const ordinary='한글 ABC xyz 123!? “인용” (29°C) 1,000₩ 3.5% + - / @ # & …';
  assert.equal(cleanVideoText(ordinary),ordinary);
  assert.equal(cleanVideoText('한글\r\nＡＢＣ　１２３\u200B\uFE0F'),'한글\nABC 123');
  assert.equal(cleanVideoText('앞→뒤\n10≤20'),'앞->뒤\n10<=20');
  assert.equal(cleanVideoText(cleanVideoText(ordinary+'🚀')),ordinary);
});
test('Spark import cleans narration, screen titles and captions while preserving speakers and times',()=>{
  const p=importEpisode({duration:5,title:'로켓 🚀',korean:'🎙️ 해설: 숫자 12개! 🚀\n[0~2초] 자막: 12개! ✨\n[2~4초] 덕이: "가자! 👍🏽"\n[4~5초] 화면 문구: 🚀',thumbnail:'ROCKET 123 🚀'});
  assert.equal(p.title,'로켓');assert.equal(p.narration,'숫자 12개!');assert.equal(p.thumbnail,'ROCKET 123');
  assert.equal(p.captions.length,2);assert.equal(p.captions[1].source,'dialogue');assert.equal(p.captions[1].start,2);assert.equal(p.captions[1].text,'가자!');validatePlan(p);
  const ass=subtitles({...p,thumbnail:'치약 짰더니 로켓? 🚀'});
  assert.ok(!ass.includes('🚀'));assert.match(ass,/치약 짰더니 로켓\?/);assert.match(ass,/pos\(540,480\)/);assert.match(ass,/Kyobo Handwriting 2024/);
});
test('legacy drafts keep their media and text backup, reuse display-only timing and invalidate old results',()=>{
  const file=new File(['video'],'clip.mp4',{lastModified:1}),voice=new Blob(['voice']),result=new Blob(['result']);
  const old=makeDraft({plan:{...defaultPlan(),thumbnail:'로켓 🚀',captions:[{start:0,end:5,text:'가자! 🚀',source:'dialogue'}]},videos:[file],voiceBlob:voice,result,resultKey:'old-policy'});
  old.syncKey=draftModel.syncKey(old);
  const next=draftModel.restoreDraft(old);
  assert.equal(next.videos[0],file);assert.equal(next.voiceBlob,voice);assert.equal(next.result,result);assert.equal(next.textBackup.thumbnail,'로켓 🚀');
  assert.equal(next.plan.captions[0].start,0);assert.equal(next.plan.captions[0].text,'가자!');assert.equal(next.syncKey,draftModel.syncKey(next));assert.equal(draftModel.resultIsCurrent(next),false);
  assert.equal(draftModel.restoreDraft(next),next);
  next.resultKey=draftModel.resultKey(next);assert.equal(draftModel.resultIsCurrent(next),true);
  assert.equal(draftModel.resultIsCurrent({...next,plan:{...next.plan,thumbnail:'다른 제목'}}),false);
  assert.equal(old.plan.thumbnail,'로켓 🚀');
});
test('draft stages and summaries are honest, lightweight and do not store empty work',()=>{
  assert.equal(draftModel.hasDraftContent(makeDraft()),false);
  const d=makeDraft({videos:[new File(['video'],'clip.mp4')]});
  assert.equal(draftModel.draftStage(d),'voice');d.syncKey=draftModel.syncKey(d);assert.equal(draftModel.draftStage(d),'captions');
  d.result=new Blob(['result']);d.resultKey=draftModel.resultKey(d);assert.equal(draftModel.draftStage(d),'result');
  const summary=draftModel.summarizeDraft(d,5);assert.equal(summary.updatedAt,5);assert.ok(!('videos' in summary));assert.ok(!('result' in summary));assert.ok(JSON.stringify(summary).length<500);
  assert.match(draftModel.draftProgress({id:'legacy',title:'과거'}).label,/확인 필요/);
  assert.equal(draftModel.draftStage({...d,plan:{...d.plan,duration:15}}),'videos');
});
test('only exact history identities connect edits; one picture is not a complete image set',()=>{
  const item={id:'h1',duration:5,result:JSON.stringify({clips:[{imageTitle:'a'},{imageTitle:'b'}]})};
  assert.equal(recordProgress(item).action,'작업 확인하기');
  assert.equal(recordProgress(item,{imageTitles:['a','unrelated']}).action,'남은 사진 1장 만들기');
  assert.equal(recordProgress(item,{imageTitles:['a','b']}).action,'Kling 자료 확인');
  const d=draftModel.summarizeDraft(makeDraft({id:recordDraftId(item),videos:[new File(['v'],'a.mp4')]}));
  assert.equal(recordProgress(item,undefined,d).action,'음성·자막 준비');
  assert.equal(recordProgress(item,undefined,{...d,id:'independent-uuid'}).target,'history');
  assert.equal(recordDraftId({...item,editorKey:'explicit'}),'episode-explicit');
});
test('IndexedDB keeps legacy drafts and Blobs, commits summaries atomically and skips blank drafts',async()=>{
 const {IDBFactory}=require('fake-indexeddb');global.indexedDB=new IDBFactory();
 const {editorStore,persistDraft}=require(path.join(compiled,'src/editor/storage.js'));
 const old=makeDraft({id:'legacy',plan:{...defaultPlan(),title:'과거'},result:new Blob(['old'])});
 await editorStore('legacy',old);await editorStore('list',[{id:'legacy',title:'과거'}]);await editorStore('current','legacy');
 await persistDraft(makeDraft());assert.equal((await editorStore('list')).length,1);assert.equal(await editorStore('current'),'legacy');
 const a=makeDraft({id:'a',plan:{...defaultPlan(),title:'A'},videos:[new File(['video'],'a.mp4',{lastModified:1})]});
 const b=makeDraft({id:'b',plan:{...defaultPlan(),title:'B'}});
 await Promise.all([persistDraft(a,1),persistDraft(b,2)]);
 const list=await editorStore('list');assert.equal(list.length,3);assert.equal(list.find(s=>s.id==='legacy').version,undefined);
 assert.equal((await editorStore('a')).videos[0].size,5);assert.equal(await (await editorStore('legacy')).result.text(),'old');
 assert.ok(list.filter(s=>s.version===1).every(s=>!('videos'in s)&&!('result'in s)));
});
test('v1 picture store upgrades without losing images and indexes only an opened record',async()=>{
 const {IDBFactory,IDBObjectStore}=require('fake-indexeddb');global.indexedDB=new IDBFactory();global.window=new EventTarget();
 const original={images:{a:'data:image/png;base64,AQID',b:''}};
 await new Promise((resolve,reject)=>{const r=indexedDB.open('pov_director_db',1);r.onupgradeneeded=()=>r.result.createObjectStore('media');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const database=r.result,tx=database.transaction('media','readwrite');tx.objectStore('media').put(original,'legacy-record');tx.oncomplete=()=>{database.close();resolve();};};});
 const {db}=require(path.join(compiled,'src/utils/db.js'));
 const calls=[],getAll=IDBObjectStore.prototype.getAll;
 IDBObjectStore.prototype.getAll=function(...args){calls.push(this.name);return getAll.apply(this,args);};
 try {
   assert.deepEqual(await db.summaries(),{});assert.deepEqual(await db.get('legacy-record'),original);
   assert.deepEqual(await db.summaries(),{'legacy-record':{imageTitles:['a']}});
   assert.ok(calls.every(name=>name==='summaries'),'must not scan image Blobs');
   await db.set('second',{images:{x:'data:image/png;base64,AQID'}});await db.delete('second');assert.equal((await db.summaries()).second,undefined);
   assert.deepEqual(await db.get('legacy-record'),original);
 } finally {IDBObjectStore.prototype.getAll=getAll;}
});
const { subtitles, render, command, inspect } = require(path.join(compiled, 'server/editor/render.js'));
const { audioResponse } = require(path.join(compiled, 'server/editor/routes.js'));
const workPackage=require(path.join(compiled,'src/workflow/package.js'));
const {parseWeekly}=require(path.join(compiled,'src/workflow/weekly.js'));
const {newestWeekly,createWeeklyReader}=require(path.join(compiled,'server/workflow/weekly.js'));
const weeklyFile=(date,id='a'.repeat(25))=>({id,name:`[${date}] 3D 오리 삼총사 릴스 개그 시리즈 주간 패키지.md`,mimeType:'application/vnd.google-apps.document'});
const weeklyText='[에피소드 1: 5초 테스트]\n1. 시나리오\n오원장 등장\n2. 한글 나레이션 및 자막\n나레이션: 아침이다.\n3. 제목 및 해시태그\n아침 #밈\n4. 썸네일 추천 문구\n아침';
test('latest weekly uses valid filename dates, not a recently edited old document',()=>{
 assert.equal(newestWeekly([{...weeklyFile('2026-08-30'),modifiedTime:'2026-09-11'},weeklyFile('2026-09-06','b'.repeat(25)),weeklyFile('2026-02-30'),{...weeklyFile('2027-01-01'),mimeType:'application/pdf'}]).id,'b'.repeat(25));
 assert.throws(()=>newestWeekly([weeklyFile('2026-02-30')]));
});
test('weekly reader paginates, coalesces requests, caches and refreshes without AI',async()=>{
 let calls=0,time=100000;const urls=[];
 const read=createWeeklyReader({key:()=> 'test-only',now:()=>time,fetch:async(url,options)=>{
  calls++;urls.push(String(url));assert.equal(options.headers['x-goog-api-key'],'test-only');
  if(String(url).includes('/export'))return new Response(weeklyText);
  return Response.json(String(url).includes('pageToken=next')?{files:[weeklyFile('2026-09-06','b'.repeat(25))]}:{files:[weeklyFile('2026-08-30')],nextPageToken:'next'});
 }});
 const [a,b]=await Promise.all([read(),read()]);assert.equal(a,b);assert.equal(a.date,'2026-09-06');assert.equal(a.episodeCount,1);assert.equal(calls,3);
 await read();assert.equal(calls,3);time+=6000;await read(true);assert.equal(calls,6);assert.ok(urls.every(url=>!url.includes('test-only')));
});
test('public Docs export never forwards credentials and rejects foreign redirects',async()=>{
 const read=createWeeklyReader({key:()=> 'test-only',fetch:async(url,options)=>{
  if(String(url).includes('/drive/v3/files?'))return Response.json({files:[weeklyFile('2026-09-06')]});
  if(String(url).includes('googleapis.com'))return new Response('',{status:403});
  assert.equal(options.headers,undefined);assert.equal(options.credentials,'omit');
  if(String(url).includes('docs.google.com'))return new Response('',{status:302,headers:{location:'https://doc-test.googleusercontent.com/export'}});
  return new Response(weeklyText);
 }});assert.equal((await read()).episodeCount,1);
 const bad=createWeeklyReader({key:()=> 'test-only',fetch:async(url)=>String(url).includes('/drive/v3/files?')?Response.json({files:[weeklyFile('2026-09-06')]}):String(url).includes('googleapis.com')?new Response('',{status:403}):new Response('',{status:302,headers:{location:'https://evil.example/export'}})});
 await assert.rejects(bad(),/지원하지 않는/);
});
test('invalid latest text does not select an older document and failed imports remain retryable',async()=>{
 let valid=false;const downloaded=[];
 const read=createWeeklyReader({key:()=> 'test-only',fetch:async(url)=>{
  if(String(url).includes('/drive/v3/files?'))return Response.json({files:[weeklyFile('2026-08-30'),weeklyFile('2026-09-06','b'.repeat(25))]});
  downloaded.push(String(url));return new Response(valid?weeklyText:'<html>sign in</html>');
 }});
 await assert.rejects(read(),/텍스트로/);assert.equal(downloaded.length,1);assert.ok(downloaded[0].includes('b'.repeat(25)));
 valid=true;assert.equal((await read()).date,'2026-09-06');
 const huge=createWeeklyReader({key:()=> 'test-only',fetch:async(url)=>String(url).includes('/drive/v3/files?')?Response.json({files:[weeklyFile('2026-09-06')]}):new Response('x'.repeat(1000001))});
 await assert.rejects(huge(),/너무 큽니다/);
});
test('portable work preserves source and pictures; invalid data and wrong duration are rejected',()=>{
 const item={id:'record-1',timestamp:1,characterId:'owonjang',duration:5,result:JSON.stringify({title:'제목',clips:[2,3].map((n,i)=>({title:'장면',imageTitle:'사진'+i,imagePrompt:'image',videoPrompt:`OUTPUT SPECS: ${n}s`}))}),episode:{duration:5,title:'원본 제목',scenario:'오원장: "일어나!"',korean:'나레이션: 아침이다.',thumbnail:'아침',caption:'아침 #밈'}};
 const images={'사진0':'data:image/png;base64,AQID'};
 const raw=workPackage.makePackage(item,images),data=workPackage.readPackage(raw);
 assert.equal(data.item.episode.korean,item.episode.korean);assert.deepEqual(data.images,images);
 assert.equal(workPackage.editorEpisode(item).korean,'나레이션: 아침이다.');
 assert.equal(workPackage.editorEpisode({...item,episode:undefined}).korean,'');
 assert.notEqual(workPackage.importIdentity(item,[item]).id,item.id);
 assert.equal(workPackage.importIdentity(item,[]).id,item.id);
 assert.throws(()=>workPackage.makePackage({...item,duration:99},images));
 assert.throws(()=>workPackage.makePackage({...item,duration:15},images));
 assert.throws(()=>workPackage.makePackage(item,{'사진0':'https://example.com/image.png'}));
 assert.throws(()=>workPackage.makePackage(item,{'다른 기록 사진':'data:image/png;base64,AQID'}));
 assert.throws(()=>workPackage.makePackage(item,{'사진0':'data:image/svg+xml;base64,AQID'}));
 for(const patch of [{title:{wrong:true}},{hashtags:'not a list'}])assert.throws(()=>workPackage.makePackage({...item,result:JSON.stringify({...JSON.parse(item.result),...patch})},images));
 const duplicated=JSON.parse(item.result);duplicated.clips[1].imageTitle=duplicated.clips[0].imageTitle;
 assert.throws(()=>workPackage.makePackage({...item,result:JSON.stringify(duplicated)},images));
});
test('mobile weekly import keeps explicit narration and derives two episode durations',()=>{
 const make=(id,n)=>`[에피소드 ${id}: ${n}초 테스트]\n1. 시나리오\n오원장: "일어나!"\n2. 한글 나레이션 및 자막\n나레이션: 아침이다.\n자막: 아침\n3. 제목 및 해시태그\n아침 #밈\n4. 썸네일 추천 문구\n아침이다`;
 const episodes=parseWeekly(make(1,5)+'\n'+make(2,15));
 assert.equal(episodes.length,2);assert.deepEqual(episodes.map(e=>e.duration),[5,15]);
 assert.equal(episodes[0].characters[0],'owonjang');
 assert.equal(importEpisode(episodes[0]).narration,'아침이다.');
 assert.throws(()=>parseWeekly('부족한 문서'));
});
test('REST model_output audio is joined into a playable 24kHz WAV', () => {
  const first = Buffer.from([1, 0, 2, 0]), second = Buffer.from([3, 0]);
  const result = audioResponse({ steps: [
    { type: 'user_input', content: [{ type: 'audio', data: 'ignored' }] },
    { type: 'model_output', content: [{ type: 'text', text: 'ignored' }, ...[first, second].map(p => ({type:'audio', mime_type:'audio/pcm;rate=24000', data:p.toString('base64')}))] }
  ] });
  assert.equal(result.toString('ascii',0,4),'RIFF'); assert.equal(result.readUInt32LE(24),24000);
  assert.deepEqual(result.subarray(44),Buffer.concat([first,second]));
  assert.throws(() => audioResponse({steps:[]}), /오디오가/);
  assert.throws(() => audioResponse({steps:[{type:'model_output',content:[{type:'audio',mime_type:'audio/mp3',data:'AQACAA=='}]}]}), /음성 형식/);
});
test('invalid, overlapping and overlong caption times are rejected', () => {
  for (const captions of [[{start:0,end:6,text:'가'}], [{start:0,end:3,text:'가'},{start:2,end:5,text:'나'}], [{start:NaN,end:2,text:'가'}]]) assert.throws(() => validatePlan({...defaultPlan(), captions}));
});
test('5 second source preserves narration and original caption times', () => {
  const p = importEpisode({ duration:5, title:'테스트', korean:'나레이션: 월요일 아침입니다.\n[0~2초] 일어나!\n[2~4초] 벽이 날아갔다.', thumbnail:'월요일 아침\nMonday morning' });
  assert.equal(p.narration, '월요일 아침입니다.'); assert.equal(p.captions.length,2); assert.equal(p.captions[1].end,4); assert.equal(p.thumbnail,'월요일 아침\nMonday morning'); validatePlan(p);
});
test('ASS user text cannot insert commands; titles end at one second', () => {
  const text = subtitles({...defaultPlan(),thumbnail:'첫 화면',captions:[{start:0,end:5,text:'{\\pos(0,0)} 자막'}]});
  assert.match(text,/0:00:00.00,0:00:01.00,Title/); assert.match(text,/pos\(540,1440\)/); assert.ok(!text.includes('{\\pos(0,0)}'));
});
test('larger text invalidates only finished output, including unopened legacy summaries', () => {
  const d=makeDraft({plan:{...defaultPlan(),narration:'아침이다.'},videos:[new File(['video'],'clip.mp4',{lastModified:1})],voiceBlob:new Blob(['voice']),result:new Blob(['previous result'])});
  d.voiceKey=draftModel.voiceKey(d);d.syncKey=draftModel.syncKey(d);
  d.resultKey=JSON.stringify([3,1,d.plan,d.voiceKey,[[d.videos[0].name,d.videos[0].size,d.videos[0].lastModified]]]);
  const restored=draftModel.restoreDraft(d);
  assert.equal(restored,d);assert.equal(draftModel.voiceIsCurrent(restored),true);
  assert.equal(restored.syncKey,draftModel.syncKey(restored));assert.equal(draftModel.draftStage(restored),'captions');
  assert.equal(draftModel.resultIsCurrent(restored),false);assert.equal(restored.result,d.result);
  const oldSummary={...draftModel.summarizeDraft(d),state:'result',renderVersion:undefined};
  assert.match(draftModel.draftProgress(oldSummary).label,/이전 완성본/);
  d.resultKey=draftModel.resultKey(d);
  assert.equal(draftModel.draftProgress(draftModel.summarizeDraft(d)).label,'완성됨');
});
test('caption sizes are independent and wrapping preserves words and explicit line breaks', () => {
  const {fitVideoText}=require(path.join(compiled,'server/editor/typography.js'));
  const short={start:0,end:2,text:'월요일 아침 알람 끄려다'};
  const first=ass=>ass.split('\n').find(line=>line.startsWith('Dialogue:')&&line.includes(',Caption,'));
  assert.equal(first(subtitles({...defaultPlan(),captions:[short]})),first(subtitles({...defaultPlan(),captions:[short,{start:2,end:5,text:'긴 자막이 들어와도 다른 자막의 크기는 줄어들지 않고 그대로 유지되어야 합니다.'}]})));
  const phrase='Trying to turn off Monday alarm';
  const wrapped=fitVideoText(phrase,400);
  assert.equal(wrapped.text.split('\\N').join(' '),phrase);assert.ok(wrapped.text.includes('\\N'));
  assert.equal(fitVideoText('첫 줄\n둘째 줄',400).text,'첫 줄\\N둘째 줄');
  assert.ok(fitVideoText('안녕!',400).size<=150);
});
test('actual font renders larger titles and captions inside the central 75 percent', {skip:!process.env.FFMPEG_PATH}, () => {
  const {execFileSync}=require('node:child_process');
  const examples=[
    ['치약 짰더니 로켓?','월요일 아침 알람 끄려다'],
    ['알람 껐더니...?\nTurned off alarm...?','월요일 아침 알람 끄려다\nTrying to turn off\nMonday alarm'],
    ['WWWWW iiiii 123!?','아주긴한글문장과VeryLongEnglishWord12345가있어도화면을벗어나지않습니다.']
  ];
  for(const [index,[thumbnail,text]] of examples.entries()) {
    fs.writeFileSync(path.join(compiled,'text-size.ass'),subtitles({...defaultPlan(),thumbnail,captions:[{start:0,end:5,text}]}));
    const pixels=execFileSync(process.env.FFMPEG_PATH,['-v','error','-f','lavfi','-i','color=black:s=1080x1920','-vf','ass=text-size.ass','-frames:v','1','-threads','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{cwd:compiled,maxBuffer:8e6});
    assert.equal(pixels.length,1080*1920*3);
    for(const [from,to,center] of [[0,960,480],[960,1920,1440]]) {
      let left=1080,right=-1,top=1920,bottom=-1;
      for(let y=from;y<to;y++)for(let x=0;x<1080;x++) {
        const i=(y*1080+x)*3;
        if(Math.max(pixels[i],pixels[i+1],pixels[i+2])>60) {left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      }
      assert.ok(right>left,'text must be visible');
      assert.ok(left>=132&&right<=948,`example ${index}: horizontal bounds ${left}..${right}`);
      if(index<2)assert.ok(right-left>=740,`example ${index}: text remains too small (${right-left}px)`);
      assert.ok(Math.abs((top+bottom)/2-center)<45,'vertical position must stay fixed');
    }
  }
});

test('real render: silent source, audio source, narration mixing and 15s concat', { skip: !process.env.FFMPEG_PATH, timeout:240000 }, async () => {
  const dir = path.join(compiled, 'media'); fs.mkdirSync(dir,{recursive:true}); const ff = process.env.FFMPEG_PATH;
  await command(ff,['-y','-f','lavfi','-i','color=c=0x67514a:s=360x640:r=30','-f','lavfi','-i','sine=frequency=220:sample_rate=48000','-t','5','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','source.mp4'],dir);
  await command(ff,['-y','-f','lavfi','-i','sine=frequency=880:sample_rate=24000','-t','4.5','voice.wav'],dir);
  const p = {...defaultPlan(),thumbnail:'치약 짰더니 로켓? 🚀',captions:[{start:0,end:2,text:'첫 번째 자막입니다. 👨‍👩‍👧‍👦'},{start:2,end:5,text:'마지막 음성과 자막을 확인합니다. ✨'}]};
  await render(p,[path.join(dir,'source.mp4')],path.join(dir,'voice.wav'),dir);
  const meta = await inspect('finished.mp4',dir); assert.equal(meta.audio,true); assert.ok(Math.abs(meta.duration-5)<0.1);
  const stats = await command(ff,['-i','finished.mp4','-vn','-af','astats','-f','null','-'],dir); assert.ok(/RMS level dB: -(?!inf)\d/.test(stats));
  await command(ff,['-y','-ss','0.5','-i','finished.mp4','-frames:v','1','preview.png'],dir);
  fs.copyFileSync(path.join(dir,'finished.mp4'),path.join(dir,'verified-5s.mp4'));
  await assert.rejects(render({...p,voiceSpeed:0.8},[path.join(dir,'source.mp4')],path.join(dir,'voice.wav'),dir), /나레이션이 영상보다/);
  await render({...p,originalVolume:0,dialogueRanges:[{start:1.5,end:2}],voiceSegments:[{sourceStart:0,sourceEnd:1.5,start:0},{sourceStart:1.5,sourceEnd:4.5,start:2}]},[path.join(dir,'source.mp4')],path.join(dir,'voice.wav'),dir);
  const preserved = await command(ff,['-ss','1.6','-t','0.2','-i','finished.mp4','-vn','-af','astats','-f','null','-'],dir); assert.ok(/RMS level dB: -(?!inf)\d/.test(preserved));
  await render({...p,narration:'',originalVolume:1},[path.join(dir,'source.mp4')],undefined,dir);
  assert.equal((await inspect('finished.mp4',dir)).audio,true);
  const files=[];
  for(const [i,n] of [4,4,3,4].entries()) { const name=`source${i}.mp4`; await command(ff,['-y','-i','source.mp4','-t',String(n),'-an','-c:v','copy',name],dir); files.push(path.join(dir,name)); }
  await render({...p,duration:15,originalVolume:0},files,path.join(dir,'voice.wav'),dir);
  const long=await inspect('finished.mp4',dir); assert.equal(long.audio,true); assert.ok(Math.abs(long.duration-15)<0.1);
  fs.copyFileSync(path.join(dir,'finished.mp4'),path.join(dir,'verified-15s.mp4'));
});

const { spokenNumbers, parseWords, alignCaptions, scheduleNarration, placedWords } = require(path.join(compiled,'src/editor/speech.js'));
test('Korean readings preserve units and native counters',()=>{
  assert.equal(spokenNumbers('3명이 15초 동안 1%를 20개로'), '세 명이 십오 초 동안 일 퍼센트를 스무 개로');
  assert.equal(spokenNumbers('07:00에 1,000원'), '일곱 시에 천 원');
  assert.equal(spokenNumbers('3개월에 3개'), '삼 개월에 세 개');
});
test('character dialogue is not placed in TTS narration',()=>{
  const p=importEpisode({duration:5,korean:'나레이션: 오늘도 출근이다.\n오원장: "퇴근합시다!"',scenario:'Dialog:오원장:"퇴근합시다!"'});
  assert.equal(p.narration,'오늘도 출근이다.');assert.ok(p.captions.some(c=>c.source==='dialogue'));
});
test('word timestamps align without rewriting captions; uncertain matches require review',()=>{
  const words=parseWords({steps:[{type:'model_output',content:[{annotations:[{type:'word_info',text:'안녕',start_offset:'0.100s',end_offset:'0.800s'},{type:'word_info',text:'친구야',start_offset:'0.900s',end_offset:'1.400s'}]}]}]});
  const captions=alignCaptions([{text:'안녕 친구야',start:0,end:5}],words);
  assert.equal(captions[0].start,.1);assert.equal(captions[0].end,1.4);assert.equal(captions[0].review,undefined);
  assert.ok(alignCaptions([{text:'완전히 다른 내용',start:0,end:5}],words)[0].review);
});
test('narration is moved around original dialogue without dropping words',()=>{
  const words=[{text:'안녕',start:0,end:.7},{text:'친구',start:.8,end:1.5}];
  const segments=scheduleNarration(words,5,[{start:0,end:2}],1);
  assert.ok(segments[0].start>=2);assert.equal(placedWords(words,segments,1).length,2);
  assert.throws(()=>scheduleNarration(words,5,[{start:0,end:4.8}],1),/부족/);
});

const {validateMediaSizes,validateMediaDuration}=require(path.join(compiled,'src/editor/media.js'));
const {speechRanges}=require(path.join(compiled,'src/editor/speech.js'));
const {draftWriter}=require(path.join(compiled,'src/editor/storage.js'));
test('multiline narration and varied caption time markers preserve speaker separation',()=>{
 const p=importEpisode({duration:5,korean:'**나레이션:**\n오늘은 1.5개를 샀다.\n\n자막:\n[0초~2초] 오늘은 1.5개\n[2-3s] 샀다.\n오원장: "하나 반이네!"',scenario:'Dialog:오원장:"하나 반이네!"'});
 assert.equal(p.narration,'오늘은 1.5개를 샀다.');assert.equal(p.captions.length,3);
 assert.deepEqual(p.captions.slice(0,2).map(c=>[c.start,c.end,c.text]),[[0,2,'오늘은 1.5개'],[2,3,'샀다.']]);
 assert.equal(p.captions[2].source,'dialogue');assert.ok(!p.narration.includes('하나 반'));
 assert.equal(importEpisode({duration:5,korean:'나레이션:\n좋은 아침.\n의사: "안녕"'}).narration,'좋은 아침.');
 assert.ok(importEpisode({duration:5,korean:'나레이션:\n좋은 아침.\n의사: "안녕"'}).importWarning);
});
test('decimal counters and grouped large numbers have readable Korean pronunciation',()=>{
 assert.equal(spokenNumbers('1.5개와 2.5% 그리고 0.3kg'),'일 점 오 개와 이 점 오 퍼센트 그리고 영 점 삼 킬로그램');
 assert.equal(spokenNumbers('1,234,567,890원'),'십이억 삼천사백오십육만 칠천팔백구십 원');
});
test('all input clips must pass size and duration checks before speech analysis',()=>{
 assert.throws(()=>validateMediaSizes([{size:27*1024*1024}],5),/26MB/);
 assert.throws(()=>validateMediaSizes([{size:1},null,{size:1},{size:1}],15),/각 칸/);
 assert.throws(()=>validateMediaSizes([1,2,3,4].map(()=>({size:8*1024*1024})),15),/합계/);
 assert.throws(()=>validateMediaDuration(5,4,1),/2번 영상/);assert.throws(()=>validateMediaDuration(Infinity,5,0));
 validateMediaDuration(5.03,5,0);validateMediaSizes([{size:100}],5);
});
test('dialogue phrases retain their short pauses and full narration audio is preserved without dialogue',()=>{
 assert.deepEqual(speechRanges([{text:'안녕',start:.2,end:.8},{text:'친구',start:1,end:1.5},{text:'또 봐',start:3,end:4}],5),[{start:.16,end:1.54},{start:2.96,end:4.04}]);
 const w=[{text:'안녕',start:.25,end:1}];assert.deepEqual(scheduleNarration(w,5,[],1,1.4),[{sourceStart:0,sourceEnd:1.4,start:0}]);
 assert.throws(()=>scheduleNarration(w,5,[],1,6),/영상보다/);
 assert.throws(()=>validatePlan({...defaultPlan(),voiceSegments:[{sourceStart:0,sourceEnd:2,start:0},{sourceStart:2,sourceEnd:3,start:1}]}),/겹칩니다/);
 assert.throws(()=>validatePlan({...defaultPlan(),voiceSegments:[{sourceStart:0,sourceEnd:2,start:0}],dialogueRanges:[{start:1,end:3}]}),/겹칩니다/);
});
test('saving coalesces rapid edits and preserves both episodes when switching',async()=>{
 let release;const gate=new Promise(r=>release=r);const saved=[];
 const writer=draftWriter(async value=>{if(!saved.length)await gate;saved.push(value);});
 const pending=writer.write('a','a1');writer.write('a','a2');writer.write('a','a3');writer.write('b','b1');release();await pending;await writer.flush();
 assert.deepEqual(saved,['a1','a3','b1']);await writer.write('b','b2');assert.equal(saved.at(-1),'b2');
});
test('a failed save remains queued and must succeed before switching drafts',async()=>{
 let fail=true;const saved=[];const writer=draftWriter(async value=>{if(fail)throw Error('quota');saved.push(value);});
 await assert.rejects(writer.write('a','a1'),/quota/);fail=false;await writer.flush();assert.deepEqual(saved,['a1']);
 await writer.write('b','b1');assert.deepEqual(saved,['a1','b1']);
});
test('cleaned text uses glyphs from the actual bundled caption font', {skip:!process.env.FFMPEG_PATH||process.platform==='win32'},()=>{
 const {execFileSync}=require('node:child_process');
 const ranges=execFileSync('fc-query',['--format=%{charset}',path.join(root,'src/KyoboHandwriting2024psw.ttf')],{encoding:'utf8'}).trim().split(/\s+/).map(s=>s.split('-').map(n=>parseInt(n,16)));
 const text=cleanVideoText('치약 짰더니 로켓? 🚀👨‍👩‍👧‍👦 1️⃣ ABC 123 “인용” — … ° ℃ ℉ ₩ € ¥ £ ¢ ± × ÷ ‰ 「」『』【】〈〉《》 ㄱㅎぁんァヶΑΩαωЁАяё ★ ■');
 for(const c of text){const n=c.codePointAt(0);assert.ok(ranges.some(([a,b=a])=>a<=n&&n<=b),`font missing ${c} U+${n.toString(16)}`);}
});

test('explicit absence of narration never produces spoken placeholder text',()=>{
 const p=importEpisode({duration:5,korean:'나레이션: 없음 (캐릭터 대사만)\nDialog: O-wong: "안녕!"'});
 assert.equal(p.narration,'');assert.equal(p.importWarning,undefined);assert.equal(p.captions[0].text,'안녕!');assert.equal(p.captions[0].source,'dialogue');
});
