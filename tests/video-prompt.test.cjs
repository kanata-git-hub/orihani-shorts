const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map();
function compile(rel,mocks={}){
 if(!Object.keys(mocks).length&&cache.has(rel))return cache.get(rel);
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(name=>name.endsWith('/authFetch')?{authFetch:(...args)=>fetch(...args)}:mocks[name]||(name.endsWith('.css')?{}:name.startsWith('.')?compile(path.posix.normalize(path.posix.join(path.posix.dirname(rel),name))+'.ts'):require(name)),m,m.exports);
 if(!Object.keys(mocks).length)cache.set(rel,m.exports);return m.exports;
}
const {videoPromptForCopy:prepare,normalizeVideoPlan,SILENT_CLIP_AUDIO,bindClipStartFrame}=compile('src/videoPrompt.ts');
const quiet='REFERENCE INSTRUCTION: @image1 = Scene 1 start frame reference.\nOUTPUT SPECS: 4s, vertical 9:16.\nACTION: Deok-i pushes a vacuum cleaner across the floor.\nAUDIO: A steady vacuum motor and soft wheel sounds.\nSTRICT RULES: Solid contact with the floor.';
const speaking='[CLIP 3]REFERENCE INSTRUCTION: @image3 = Scene 3 start frame reference.OUTPUT SPECS: 3s, vertical 9:16.CINEMATOGRAPHY: Medium shot.ENVIRONMENT: Warm wooden clinic reception.ACTION: Somi opens the door, nods and delivers line.DIALOGUE : Somi : "문 열었어요. 들어오세요."STRICT RULES: Keep the doorway stable.';
const legacy='[RECURRING PROP DESIGN — START FRAME PRIORITY]The supplied start-frame image defines the exact design of recurring props. Preserve their silhouette, materials, colors, proportions and attached components throughout this clip. If an incidental prop description above conflicts with the visible start frame, keep the start-frame design and perform the current scripted action with it. Animate only the specified action and state changes; do not redesign the prop or add unpictured components. Character identity stays consistent with the bound character assets.';

test('new clip references replace invented identities while preserving action, speech and silent audio',()=>{
 const original='REFERENCE INSTRUCTION: Keep Deok-i a white duck.\n'+speaking;
 const bound=bindClipStartFrame(original,3);
 assert.doesNotMatch(bound,/white duck/);
 assert.match(bound,/@image3 = Scene 3 start frame reference/);
 assert.equal((bound.match(/REFERENCE INSTRUCTION:/g)||[]).length,1);
 assert.match(bound,/문 열었어요. 들어오세요./);
 assert.match(bound,/Somi opens the door, nods and delivers line/);
 assert.ok(!prepare(bound).includes(SILENT_CLIP_AUDIO));
 const silent=bindClipStartFrame(prepare(quiet),2);
 assert.equal(prepare(silent).split(SILENT_CLIP_AUDIO).length-1,1);
});
test('specific audio labels do not turn a silent clip into a supposed spoken line',()=>{
 const actual='ACTION: Deok-i pushes a gate.\nDIALOGUE: None\n\nSpecific audio: Friction on stone.\nSTRICT RULES: No voices.';
 assert.ok(prepare(actual).includes(SILENT_CLIP_AUDIO));
 assert.match(prepare(actual),/Friction on stone/);
});

test('wordless older clips receive ambience/effects-only and no voices without losing their action or sound details',()=>{
 const out=prepare(quiet);assert.ok(out.startsWith(quiet));assert.match(out,/DIALOGUE: None/);assert.ok(out.includes(SILENT_CLIP_AUDIO));
 assert.match(out,/any language, including off-screen voices/);assert.match(out,/speech-like mouth movements/);
 assert.equal(prepare(out),out);assert.equal(prepare(''),'');assert.equal(prepare('  '),'  ');
 assert.ok(prepare(quiet.replace(/\n/g,'\\n')).includes('\nOUTPUT SPECS:'));
});
test('explicit no-line forms work with flattened fields, Markdown and Korean',()=>{
 for(const value of ['None.','None (silent).','None (SFX only)','No spoken dialogue','No dialogue.','No speech','N/A','없음','대사 없음','(침묵)','—','""','']){
  const raw=`ACTION: Deok-i watches the floor.DIALOGUE: ${value}STRICT RULES: Keep the camera still.`;
  assert.ok(prepare(raw).includes(SILENT_CLIP_AUDIO),value);
 }
 assert.ok(prepare('ACTION: Watch.\n**DIALOGUE:** None.\n**AUDIO:** Room tone.\n**STRICT RULES:** Static.').includes(SILENT_CLIP_AUDIO));
});
test('a flattened speaking clip keeps its exact line and loses only the old prop footer',()=>{
 assert.equal(prepare(speaking),speaking);
 assert.equal(prepare(speaking+legacy),speaking);
 assert.equal(prepare(speaking+'\n\n'+legacy.replace(']The',']\nThe')),speaking);
 assert.equal(prepare(speaking+'\n'+legacy+'\nSFX: Slippers land.'),speaking+'\n\nSFX: Slippers land.');
 assert.ok(prepare(quiet+legacy).includes(SILENT_CLIP_AUDIO));
});
test('existing dialogue, narration, multiple speakers and speech in legacy action fields are never muted',()=>{
 const voiced=[
  'ACTION: Somi: "안녕하세요."',
  'ACTION: Somi says "진료 시작하죠."',
  'ACTION: Somi delivers the line calmly.',
  'DIALOGUE: None.\nNARRATION: "아침이 밝았다."\nACTION: Ducks walk.',
  'ACTION: Walk.\nVOICE-OVER: O-wonjang: "여기입니다."',
  'DIALOGUE: Deok-i: "네?"\nDIALOGUE: Somi: "시작합니다."\nAUDIO: Room tone.',
  'DIALOGUE: Somi: "DIALOGUE: None. AUDIO: Silence. 라고 적혀 있네요."\nSTRICT RULES: Static.',
  'ACTION: Somi says "안녕하세요."\nDIALOGUE: None.',
 ];
 for(const raw of voiced){assert.equal(prepare(raw),raw);assert.ok(!prepare(raw).includes(SILENT_CLIP_AUDIO));}
});
test('new plans normalize each clip independently and preserve script, image, duration and actual dialogue',()=>{
 const original={title:'새 이야기',scenario:'원본 대본',clips:[{imagePrompt:'yellow duck',videoPrompt:quiet},{imagePrompt:'white duck',videoPrompt:speaking}]};
 const normalized=JSON.parse(normalizeVideoPlan(JSON.stringify(original)));
 assert.equal(normalized.scenario,original.scenario);assert.equal(normalized.clips[0].imagePrompt,'yellow duck');
 assert.match(normalized.clips[0].videoPrompt,/OUTPUT SPECS: 4s/);assert.ok(normalized.clips[0].videoPrompt.includes(SILENT_CLIP_AUDIO));
 assert.equal(normalized.clips[1].videoPrompt,speaking);
 assert.equal(normalizeVideoPlan(JSON.stringify(normalized)),JSON.stringify(normalized));
});
test('the actual workboard, history and Kling copy buttons use the same corrected per-clip text',async()=>{
 const copies=[],noop=()=>{},oldNavigator=Object.getOwnPropertyDescriptor(global,'navigator'),oldTimeout=global.setTimeout;
 Object.defineProperty(global,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>copies.push(text)}}});global.setTimeout=noop;
 const hookMocks={react:{useState:value=>[value==='scenario'?'prompts':value,noop],useEffect:noop},'../hooks/useToast':{useToast:()=>({showToast:noop})},'../constants':{CHARACTERS:[]},'react-markdown':{default:noop},'./share':{imageFile:noop,shareFile:noop},'../workflow/HistoryContinue':{HistoryContinue:noop}};
 const item={id:'synthetic',timestamp:1,characterId:'owonjang',duration:15,result:JSON.stringify({title:'검사',clips:[quiet,speaking,quiet,speaking].map((videoPrompt,i)=>({title:`장면 ${i+1}`,imageTitle:`image${i}`,imagePrompt:'Duck',videoPrompt}))})};
 const images=Object.fromEntries([0,1,2,3].map(i=>['image'+i,'data:image/png;base64,AAAA']));
 const flatten=node=>Array.isArray(node)?node.flatMap(flatten):node&&typeof node==='object'?[node,...flatten(node.props?.children)]:[];
 const label=node=>Array.isArray(node)?node.map(label).join(''):node&&typeof node==='object'?label(node.props?.children):typeof node==='string'||typeof node==='number'?String(node):'';
 try{
  for(const name of ['WorkboardContent','HistoryContent']){
   const Component=compile('src/components/'+name+'.tsx',hookMocks)[name];
   const tree=Component({activeTab:'prompts',result:item.result,isGenerating:false,error:null,currentScenes:[],sceneImages:images,generatingImages:{},selectedCharacter:'owonjang',handleSaveDraft:noop,handleExportPlan:noop,handleGenerateImage:noop,viewingHistoryId:item.id,history:[item],viewingScenes:[],onEdit:noop,onBusy:noop,mediaReady:true});
   const buttons=flatten(tree).filter(n=>n.type==='button');
   buttons.find(n=>label(n).includes('비디오 프롬프트 전체 복사')).props.onClick();
   assert.equal(copies.at(-1).split(SILENT_CLIP_AUDIO).length-1,2,name);
   assert.ok(copies.at(-1).includes('문 열었어요. 들어오세요.'));
   assert.ok(!copies.at(-1).includes('START FRAME PRIORITY'));
   const singles=buttons.filter(n=>/^CLIP 1$/.test(label(n).trim()));
   singles.at(-1).props.onClick();assert.ok(copies.at(-1).includes(SILENT_CLIP_AUDIO));
  }
  const {HistoryContinue}=compile('src/workflow/HistoryContinue.tsx',hookMocks);
  const tree=HistoryContinue({item,images,generating:{},onGenerate:noop,onEdit:noop,onBusy:noop,mediaReady:true});
  await flatten(tree).find(n=>n.type==='button'&&label(n)==='프롬프트 복사').props.onClick();
  assert.ok(copies.at(-1).includes(SILENT_CLIP_AUDIO));
  assert.equal(flatten(tree).find(n=>n.type==='textarea').props.value,prepare(quiet));
 }finally{if(oldNavigator)Object.defineProperty(global,'navigator',oldNavigator);else delete global.navigator;global.setTimeout=oldTimeout;}
});
