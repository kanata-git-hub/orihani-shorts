const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compiled = path.join(root, '.editor-test');
fs.mkdirSync(compiled, { recursive: true });
fs.writeFileSync(path.join(compiled, 'package.json'), '{"type":"commonjs"}');
for (const f of ['src/workflow/package.ts','src/workflow/weekly.ts','src/utils/extractors.ts','src/editor/model.ts', 'src/editor/media.ts', 'src/editor/storage.ts', 'server/editor/render.ts', 'server/editor/routes.ts', 'src/editor/speech.ts', 'server/editor/transcribe.ts']) {
  const dest = path.join(compiled, f.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, ts.transpileModule(fs.readFileSync(path.join(root, f), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText);
}
const { defaultPlan, validatePlan, importEpisode } = require(path.join(compiled, 'src/editor/model.js'));
const { subtitles, render, command, inspect } = require(path.join(compiled, 'server/editor/render.js'));
const { audioResponse } = require(path.join(compiled, 'server/editor/routes.js'));
const workPackage=require(path.join(compiled,'src/workflow/package.js'));
const {parseWeekly}=require(path.join(compiled,'src/workflow/weekly.js'));
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
  assert.equal(p.narration, '월요일 아침입니다.'); assert.equal(p.captions.length,2); assert.equal(p.captions[1].end,4); assert.equal(p.thumbnail,'월요일 아침'); validatePlan(p);
});
test('ASS user text cannot insert commands; titles end at one second', () => {
  const text = subtitles({...defaultPlan(),thumbnail:'첫 화면',captions:[{start:0,end:5,text:'{\\pos(0,0)} 자막'}]});
  assert.match(text,/0:00:00.00,0:00:01.00,Title/); assert.match(text,/pos\(540,1440\)/); assert.ok(!text.includes('{\\pos(0,0)}'));
});
test('real render: silent source, audio source, narration mixing and 15s concat', { skip: !process.env.FFMPEG_PATH, timeout:240000 }, async () => {
  const dir = path.join(compiled, 'media'); fs.mkdirSync(dir,{recursive:true}); const ff = process.env.FFMPEG_PATH;
  await command(ff,['-y','-f','lavfi','-i','color=c=0x67514a:s=360x640:r=30','-f','lavfi','-i','sine=frequency=220:sample_rate=48000','-t','5','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','source.mp4'],dir);
  await command(ff,['-y','-f','lavfi','-i','sine=frequency=880:sample_rate=24000','-t','4.5','voice.wav'],dir);
  const p = {...defaultPlan(),thumbnail:'월요일 아침\n일어나야 한다',captions:[{start:0,end:2,text:'첫 번째 자막입니다.'},{start:2,end:5,text:'마지막 음성과 자막을 확인합니다.'}]};
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

test('explicit absence of narration never produces spoken placeholder text',()=>{
 const p=importEpisode({duration:5,korean:'나레이션: 없음 (캐릭터 대사만)\nDialog: O-wong: "안녕!"'});
 assert.equal(p.narration,'');assert.equal(p.importWarning,undefined);assert.equal(p.captions[0].text,'안녕!');assert.equal(p.captions[0].source,'dialogue');
});
