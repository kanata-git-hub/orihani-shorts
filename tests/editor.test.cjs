const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compiled = path.join(root, '.editor-test');
fs.mkdirSync(compiled, { recursive: true });
fs.writeFileSync(path.join(compiled, 'package.json'), '{"type":"commonjs"}');
for (const f of ['src/editor/model.ts', 'server/editor/render.ts', 'server/editor/routes.ts', 'src/editor/speech.ts', 'server/editor/transcribe.ts']) {
  const dest = path.join(compiled, f.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, ts.transpileModule(fs.readFileSync(path.join(root, f), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText);
}
const { defaultPlan, validatePlan, importEpisode } = require(path.join(compiled, 'src/editor/model.js'));
const { subtitles, render, command, inspect } = require(path.join(compiled, 'server/editor/render.js'));
const { audioResponse } = require(path.join(compiled, 'server/editor/routes.js'));
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
