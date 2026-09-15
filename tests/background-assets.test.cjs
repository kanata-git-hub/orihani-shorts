const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function compile(rel, mocks = {}) {
  if (cache.has(rel) && !Object.keys(mocks).length) return cache.get(rel);
  const m = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, rel), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(name => mocks[name] || (name.startsWith('.') ? compile(path.posix.normalize(path.posix.join(path.posix.dirname(rel), name)) + '.ts') : require(name)), m, m.exports);
  if (!Object.keys(mocks).length) cache.set(rel, m.exports);
  return m.exports;
}
const bg = compile('src/backgroundAssets.ts'), refs = compile('src/characterReference.ts');
const extractors = compile('src/utils/extractors.ts'), pkg = compile('src/workflow/package.ts');
const scene = (prompt, extra={}) => ({ title:'Scene 1',prompt,...extra });
const resolve = (prompt, plan='', extra={}) => bg.resolveBackground([scene(prompt, extra)],0,plan)?.id;
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';

test('Korean and English clinic rooms select the expected original', () => {
  for (const [text,id] of [['탕비실에서 약과를 먹는다','pantry'],['A cozy clinic tea room','pantry'],['치료실 침대','treatment'],['acupuncture room','treatment'],['접수대 뒤','reception'],['A clinic reception desk','reception']]) assert.equal(resolve(text),id);
});
test('other places and ambiguous multi-room locations do not inherit the overall clinic room', () => {
  const plan=JSON.stringify({location:'치료실'});
  for(const text of ['at home in his bedroom','the office break room','a cafe reception desk','탕비실과 치료실이 동시에 보인다','거리의 접수대 간판']) assert.equal(resolve(text,plan),undefined,text);
});
test('clip environment takes precedence over incidental mentions in action or dialogue', () => {
  assert.equal(resolve('The duck remembers the pantry.', '', {videoPrompt:'ENVIRONMENT: Clinic treatment room.\nACTION: Think of tea.\nDIALOGUE: Somi: "탕비실!"'}),'treatment');
  assert.equal(resolve('Close-up duck',JSON.stringify({location:'탕비실'})),'pantry');
  assert.equal(resolve('Close-up duck',JSON.stringify({scenario:'접수대가 등장한다'})),undefined);
});
test('structured scene location supports context and explicitly unrelated locations',()=>{
  assert.equal(resolve('close-up', '', {backgroundAsset:'reception'}),'reception');
  assert.equal(resolve('pantry', JSON.stringify({location:'탕비실'}),{backgroundAsset:'none'}),undefined);
  assert.equal(resolve('home bedroom', '', {backgroundAsset:'invalid'}),undefined);
});
test('same-room shots inherit the immediately preceding resolved scene',()=>{
  const scenes=[scene('탕비실'),scene('same room, close-up',{title:'Scene 2'}),scene('치료실',{title:'Scene 3'})];
  assert.equal(bg.resolveBackground(scenes,1)?.id,'pantry');
  assert.equal(bg.resolveBackground(scenes,2)?.id,'treatment');
  assert.equal(bg.resolveBackground(scenes,1,'',{'Scene 1':'reception'})?.id,'reception');
});
test('manual choices override automatic selection and explicit none disables assets',()=>{
  assert.equal(bg.resolveBackground([scene('탕비실')],0,'',{'Scene 1':'treatment'}).id,'treatment');
  assert.equal(bg.resolveBackground([scene('탕비실')],0,'',{'Scene 1':'none'}),undefined);
});
test('canonical backgrounds are never classified as character sheets',()=>{
  const parts=refs.buildReferenceParts([{url:png,label:'오원장 Front'},{url:png,role:'background',label:'치료실'}],'x');
  assert.equal(parts.filter(p=>p.inlineData).length,2);
  assert.equal(parts.filter(p=>p.text?.startsWith('[ORIGINAL CHARACTER DESIGN SHEET')).length,1);
  assert.match(parts[2].text,/CANONICAL ROOM BACKGROUND/);
  assert.match(parts.at(-1).text,/O-wonjang: pale/);
  assert.throws(()=>refs.buildReferenceParts([{url:png,role:'background'}],'x'),/원본/);
});
test('generation uses blank labels even when the approved original contains markings',()=>{
  for(const asset of bg.BACKGROUND_ASSETS){
    const instruction=bg.backgroundInstruction(asset.id);
    assert.match(instruction,/ALL jar labels/);
    assert.match(instruction,/blank surfaces/);
    assert.match(instruction,/takes priority over any markings/);
    assert.doesNotMatch(instruction,/machinery|NOT a character sheet/);
  }
});
test('room changes and canonical room images exclude stale generated scene references',()=>{
  assert.equal(bg.mayUsePreviousScene([scene('탕비실'),scene('치료실')],1,0,'',{}),false);
  assert.equal(bg.mayUsePreviousScene([scene('탕비실'),scene('home bedroom')],1,0,'',{}),false);
  assert.equal(bg.mayUsePreviousScene([scene('old'),scene('close-up duck')],1,0,'',{}),true);
});
test('manual selections survive work-file export/import and reject invalid values',()=>{
  const item={id:'test',timestamp:1,characterId:'owonjang',duration:5,result:JSON.stringify({title:'Test',clips:[{imageTitle:'Scene 1',imagePrompt:'탕비실',videoPrompt:'x'},{imageTitle:'Scene 2',imagePrompt:'치료실',videoPrompt:'y'}]}),backgroundChoices:{'Scene 1':'reception','Scene 2':'none'}};
  assert.deepEqual(pkg.readPackage(pkg.makePackage(item,{})).item.backgroundChoices,item.backgroundChoices);
  assert.throws(()=>pkg.makePackage({...item,backgroundChoices:{'Scene 1':'../../other'}},{}),/배경/);
  assert.throws(()=>pkg.makePackage({...item,backgroundChoices:{unknown:'pantry'}},{}),/배경/);
  assert.equal(pkg.readPackage(pkg.makePackage({...item,backgroundChoices:undefined},{})).item.backgroundChoices,undefined);
});
test('scene extraction retains the per-clip location from new plans',()=>{
  assert.equal(extractors.extractScenes(JSON.stringify({clips:[{imagePrompt:'close-up',backgroundAsset:'pantry',videoPrompt:'ENVIRONMENT: pantry'}]}))[0].backgroundAsset,'pantry');
});
test('all three approved originals are real portrait PNG files',()=>{
  for(const asset of bg.BACKGROUND_ASSETS){
    const bytes=fs.readFileSync(path.join(root,'public',asset.url));
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
    const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
    assert.ok(width>=720&&height>width); assert.ok(Math.abs(width/height-9/16)<0.02);
  }
});
test('generation sends the selected original alongside character sheets and fails before a paid call if missing',async()=>{
  const old=global.fetch,calls=[];
  const useMedia=compile('src/hooks/useMediaGeneration.ts',{'react':{useRef:v=>({current:v})},'../utils/db':{db:{get:async()=>({images:{'Scene 1':png}})}},'../constants':{CHARACTERS:[{id:'owonjang',name:'오원장',file:'doctor.png',imgs:['front.png','side.png','back.png']}]}});
  const {handleGenerateImage}=useMedia.useMediaGeneration(()=>{},async()=>{},'record',()=>{},{},()=>{},{},'owonjang',{'Scene 2':'reception'});
  const scenes=[scene('탕비실'),scene('치료실',{title:'Scene 2'})];
  try{
    global.fetch=async(url,options)=>{calls.push({url,body:options?.body});return url==='/api/generate-image'?Response.json({result:png}):new Response(Buffer.from(png.split(',')[1],'base64'),{headers:{'Content-Type':'image/png'}});};
    assert.equal(await handleGenerateImage('Scene 2','치료실',1,scenes),true);
    assert.ok(calls.some(c=>c.url==='/backgrounds/reception.png'));
    const parts=JSON.parse(calls.find(c=>c.url==='/api/generate-image').body).parts;
    assert.equal(parts.filter(p=>p.inlineData).length,4);assert.match(parts.at(-1).text,/CANONICAL CLINIC BACKGROUND: 접수대/);
    assert.ok(!parts.some(p=>p.text?.startsWith('[PREVIOUS GENERATED SCENE')));
    calls.length=0;
    global.fetch=async(url,options)=>{calls.push({url});return url.startsWith('/backgrounds/')?new Response('missing',{status:404}):new Response(Buffer.from(png.split(',')[1],'base64'),{headers:{'Content-Type':'image/png'}});};
    assert.equal(await handleGenerateImage('Scene 2','치료실',1,scenes),false);
    assert.ok(!calls.some(c=>c.url==='/api/generate-image'));
  }finally{global.fetch=old;}
});
