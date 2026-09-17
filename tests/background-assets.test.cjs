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

test('cinematic worlds do not inherit a clinic asset and explicit scene cuts reset reference continuity',()=>{
  const plan=JSON.stringify({location:'탕비실'});
  for(const text of ['A stormy ocean','On a ship deck','A galaxy in outer space']) assert.equal(resolve(text,plan),undefined);
  const scenes=extractors.extractScenes(JSON.stringify({clips:[
    {imageTitle:'a',imagePrompt:'cosmic sofa',backgroundAsset:'none',locationId:'sofa',sceneTransition:'new-scene'},
    {imageTitle:'b',imagePrompt:'ordinary sofa',backgroundAsset:'none',locationId:'sofa',sceneTransition:'new-scene'},
    {imageTitle:'c',imagePrompt:'closer',backgroundAsset:'none',locationId:'sofa',sceneTransition:'reframe'},
  ]}));
  assert.equal(bg.mayUsePreviousScene(scenes,1,0,plan,{}),false);
  assert.equal(bg.mayUsePreviousScene(scenes,2,0,plan,{}),false);
  assert.equal(bg.mayUsePreviousScene(scenes,2,1,plan,{}),true);
  assert.equal(resolve('new visual world',plan,{sceneTransition:'new-scene'}),undefined);
});

test('typed composition reaches image generation without changing legacy or manually edited prompts',async()=>{
  const old=global.fetch,requests=[];
  const shot={size:'close-up',angle:'low side angle',focus:'Deok-i face and reaching wing; doctor outside crop',startState:'Leaning toward the handle'};
  const scenes=extractors.extractScenes(JSON.stringify({clips:[
    {imageTitle:'one',imagePrompt:'Deok-i wide shot',locationId:'gate',backgroundAsset:'none',sceneTransition:'new-scene'},
    {imageTitle:'two',imagePrompt:'Deok-i reaches',locationId:'gate',backgroundAsset:'none',sceneTransition:'reframe',shot},
    {imageTitle:'three',imagePrompt:'Deok-i in a new visual world',locationId:'gate',backgroundAsset:'none',sceneTransition:'new-scene',shot:{...shot,size:'extreme-wide'}},
  ]}));
  const useMedia=compile('src/hooks/useMediaGeneration.ts',{'react':{useRef:v=>({current:v})},'../utils/db':{db:{get:async()=>({images:{one:png}})}},'../constants':{CHARACTERS:[{id:'deoki',name:'덕이',file:'duck.png',imgs:['front.png','side.png','back.png']} ]}});
  const api=useMedia.useMediaGeneration(()=>{},async()=>{},'record',()=>{},{},()=>{},{},'deoki');
  try{
    global.fetch=async(url,options)=>{if(url==='/api/generate-image'){requests.push(JSON.parse(options.body));return Response.json({result:png});}return new Response(Buffer.from(png.split(',')[1],'base64'),{headers:{'Content-Type':'image/png'}});};
    assert.equal(await api.handleGenerateImage('two',scenes[1].prompt,1,scenes),true);
    assert.match(requests.at(-1).parts.at(-1).text,/Shot size: close-up/);
    assert.match(requests.at(-1).parts.at(-1).text,/doctor outside crop/);
    assert.equal(await api.handleGenerateImage('two','User edited wide framing',1,scenes),true);
    assert.doesNotMatch(requests.at(-1).parts.at(-1).text,/Shot size: close-up/);
    assert.equal(await api.handleGenerateImage('three',scenes[2].prompt,2,scenes),true);
    assert.ok(!requests.at(-1).parts.some(p=>p.text?.startsWith('[PREVIOUS GENERATED SCENE')));
    assert.match(requests.at(-1).parts.at(-1).text,/Shot size: extreme-wide/);
  }finally{global.fetch=old;}
});

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
test('room changes exclude earlier locations while shots in the same canonical room stay connected',()=>{
  assert.equal(bg.mayUsePreviousScene([scene('탕비실'),scene('치료실')],1,0,'',{}),false);
  assert.equal(bg.mayUsePreviousScene([scene('탕비실'),scene('home bedroom')],1,0,'',{}),false);
  assert.equal(bg.mayUsePreviousScene([scene('old'),scene('close-up duck')],1,0,'',{}),true);
  assert.equal(bg.mayUsePreviousScene([scene('탕비실'),scene('탕비실')],1,0,'',{}),true);
  assert.equal(bg.mayUsePreviousScene([scene('탕비실'),scene('치료실'),scene('탕비실')],2,0,'',{}),false);
});
test('saved office scenes retain continuity without a canonical background, including flattened prompts',()=>{
  const environments=["A warm, cozy doctor's office in a traditional Korean Medicine Clinic with wooden herbal cabinets and soft warm interior lighting.",'Same cozy clinic office interior with warm ambient lighting.','Warm clinic office background softly blurred.',"Warm doctor's office in Korean Medicine Clinic."];
  const scenes=environments.map((environment,i)=>scene('O-wonjang and Deok-i beside a white digital scale.',{title:`Scene ${i+1}`,backgroundAsset:'none',videoPrompt:`CINEMATOGRAPHY: Static.ENVIRONMENT: ${environment}ACTION: Look down.DIALOGUE: O-wonjang: "집에 가자."`}));
  for(let i=1;i<scenes.length;i++)assert.equal(bg.mayUsePreviousScene(scenes,i,0,'',{}),true);
  assert.equal(bg.mayUsePreviousScene([scene('원장실 체중계'),scene('원장실에서 체중계를 내려다본다')],1,0,'',{}),true);
  assert.equal(bg.mayUsePreviousScene([scene('home bedroom'),scene("doctor's office")],1,0,'',{}),false);
});
test('new location IDs survive extraction and distinguish separate rooms of the same type',()=>{
  const scenes=extractors.extractScenes(JSON.stringify({clips:[
    {imageTitle:'one',imagePrompt:'close-up',backgroundAsset:'none',locationId:'room-a'},
    {imageTitle:'two',imagePrompt:'another expression',backgroundAsset:'none',locationId:'room-a'},
    {imageTitle:'three',imagePrompt:'same style',backgroundAsset:'none',locationId:'room-b'},
    {imageTitle:'four',imagePrompt:'return',backgroundAsset:'none',locationId:'room-a'},
  ]}));
  assert.equal(scenes[0].locationId,'room-a');
  assert.equal(bg.mayUsePreviousScene(scenes,1,0,'',{}),true);
  assert.equal(bg.mayUsePreviousScene(scenes,2,1,'',{}),false);
  assert.equal(bg.mayUsePreviousScene(scenes,3,0,'',{}),false);
  assert.equal(bg.mayUsePreviousScene(scenes,1,0,'',{'one':'pantry','two':'treatment'}),false);
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

test('actual generation attaches the first same-room image instead of accumulating later frame drift',async()=>{
  const old=global.fetch,calls=[],toasts=[];
  const drifted='data:image/png;base64,BBBB';
  let images={'Scene 1':png,'Scene 2':drifted};
  const useMedia=compile('src/hooks/useMediaGeneration.ts',{'react':{useRef:v=>({current:v})},'../utils/db':{db:{get:async()=>({images})}},'../constants':{CHARACTERS:[{id:'owonjang',name:'오원장',file:'doctor.png',imgs:['front.png','side.png','back.png']}]}});
  const {handleGenerateImage}=useMedia.useMediaGeneration(msg=>toasts.push(msg),async()=>{},'record',()=>{},{},()=>{},{},'owonjang');
  const scenes=[1,2,3,4].map(i=>scene('O-wonjang and Deok-i in the clinic office.',{title:`Scene ${i}`,backgroundAsset:'none',videoPrompt:'ENVIRONMENT: Warm clinic office.\nACTION: Look down.'}));
  try{
    global.fetch=async(url,options)=>{calls.push({url,body:options?.body});return url==='/api/generate-image'?Response.json({result:png}):new Response(Buffer.from(png.split(',')[1],'base64'),{headers:{'Content-Type':'image/png'}});};
    for(const index of [1,2,3]){
      calls.length=0;
      assert.equal(await handleGenerateImage(scenes[index].title,scenes[index].prompt,index,scenes),true);
      const parts=JSON.parse(calls.find(c=>c.url==='/api/generate-image').body).parts;
      assert.equal(parts.filter(p=>p.inlineData).length,4);
      assert.match(parts.at(-3).text,/PREVIOUS GENERATED SCENE/);
      assert.equal(parts.at(-2).inlineData.data,png.split(',')[1]);
      assert.ok(!parts.some(p=>p.inlineData?.data==='BBBB'));
      assert.match(parts.at(-1).text,/Scene 1, the established spatial anchor/);
      assert.match(parts.at(-1).text,/left\/right relationship/);
      assert.match(parts.at(-1).text,/coherent screen direction/);
      assert.match(parts.at(-1).text,/current starting pose/);
    }
    images={};calls.length=0;
    assert.equal(await handleGenerateImage('Scene 2',scenes[1].prompt,1,scenes),false);
    assert.ok(!calls.some(c=>c.url==='/api/generate-image'));
    assert.match(toasts.at(-1),/앞 장면 이미지를 먼저/);
    // A real location change may start a new set without an earlier image.
    scenes[1]={...scenes[1],prompt:'Home bedroom',videoPrompt:'ENVIRONMENT: Home bedroom.'};calls.length=0;
    assert.equal(await handleGenerateImage('Scene 2',scenes[1].prompt,1,scenes),true);
    assert.ok(!JSON.parse(calls.find(c=>c.url==='/api/generate-image').body).parts.some(p=>p.text?.startsWith('[PREVIOUS GENERATED SCENE')));
  }finally{global.fetch=old;}
});

test('regenerating saved cuts keeps the room image but sends only current performance and camera instructions',async()=>{
  const old=global.fetch,requests=[];
  const originalPrompt='O-wonjang in the clinic office, gazing up at Deok-i with an ANCHOR_ONLY_BEAMING_SMILE. Wide shot.';
  const currentPrompts=[
    'STARTING STATE: O-wonjang in the clinic office looks down at the scale display, head slightly tilted, puzzled expression. CAMERA: Static medium shot focused on O-wonjang. SET: Same room.',
    'STARTING STATE: Deok-i in the clinic office starts with a small smile and his head angled toward the display. CAMERA: Static close-up on Deok-i; the doctor is outside the crop. SET: Same room.',
  ];
  const scenes=[originalPrompt,...currentPrompts].map((prompt,i)=>scene(prompt,{title:`Scene ${i+1}`,backgroundAsset:'none',videoPrompt:'ENVIRONMENT: Warm clinic office.'}));
  // Saved pre-fix plans have no locationId and can contain old poses and future outcomes.
  const plan=JSON.stringify({location:'원장실',scenario:'LATER_OUTCOME: a duck puts away the scale.',clips:scenes.map(s=>({imageTitle:s.title,imagePrompt:s.prompt,videoPrompt:s.videoPrompt,backgroundAsset:s.backgroundAsset}))});
  const useMedia=compile('src/hooks/useMediaGeneration.ts',{'react':{useRef:v=>({current:v})},'../utils/db':{db:{get:async()=>({images:{'Scene 1':png}})}},'../constants':{CHARACTERS:[
    {id:'owonjang',name:'오원장',file:'doctor.png',imgs:['doctor-front.png','doctor-side.png','doctor-back.png']},
    {id:'deoki',name:'덕이',file:'duck.png',imgs:['duck-front.png','duck-side.png','duck-back.png']},
  ]}});
  const {handleGenerateImage}=useMedia.useMediaGeneration(()=>{},async()=>{},'saved-record',()=>{},{},()=>{},{},'owonjang');
  try{
    global.fetch=async(url,options)=>{
      if(url==='/api/generate-image'){requests.push(JSON.parse(options.body));return Response.json({result:png});}
      return new Response(Buffer.from(png.split(',')[1],'base64'),{headers:{'Content-Type':'image/png'}});
    };
    for(let i=1;i<scenes.length;i++){
      assert.equal(await handleGenerateImage(scenes[i].title,scenes[i].prompt,i,scenes,plan),true);
      const parts=requests.at(-1).parts;
      const text=parts.filter(p=>p.text).map(p=>p.text).join('\n');
      assert.ok(text.includes(currentPrompts[i-1]));
      assert.ok(!text.includes(originalPrompt));
      assert.ok(!text.includes(currentPrompts[i===1?1:0]));
      assert.doesNotMatch(text,/ANCHOR_ONLY_BEAMING_SMILE|LATER_OUTCOME|relative distance, eyeline|preserve the established camera position/);
      assert.equal(parts.at(-2).inlineData.data,png.split(',')[1]);
      assert.match(parts.at(-3).text,/physical set/);
      assert.match(text,/current shot below has priority for gaze target/i);
      assert.match(text,/static or locked camera stays still WITHIN this clip/i);
      assert.match(text,/current starting pose and expression/i);
      assert.match(text,/ORIGINAL CHARACTER DESIGN/);
    }
  }finally{global.fetch=old;}
});
