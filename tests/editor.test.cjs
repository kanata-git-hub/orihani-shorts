const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compiled = path.join(root, '.editor-test');
fs.mkdirSync(compiled, { recursive: true });
fs.writeFileSync(path.join(compiled, 'package.json'), '{"type":"commonjs"}');
for (const f of ['src/editor/model.ts', 'server/editor/render.ts']) {
  const dest = path.join(compiled, f.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, ts.transpileModule(fs.readFileSync(path.join(root, f), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText);
}
const { defaultPlan, validatePlan, importEpisode } = require(path.join(compiled, 'src/editor/model.js'));
const { subtitles, render, command, inspect } = require(path.join(compiled, 'server/editor/render.js'));
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
  const files=[];
  for(const [i,n] of [4,4,3,4].entries()) { const name=`source${i}.mp4`; await command(ff,['-y','-i','source.mp4','-t',String(n),'-an','-c:v','copy',name],dir); files.push(path.join(dir,name)); }
  await render({...p,duration:15,originalVolume:0},files,path.join(dir,'voice.wav'),dir);
  const long=await inspect('finished.mp4',dir); assert.equal(long.audio,true); assert.ok(Math.abs(long.duration-15)<0.1);
  fs.copyFileSync(path.join(dir,'finished.mp4'),path.join(dir,'verified-15s.mp4'));
});
