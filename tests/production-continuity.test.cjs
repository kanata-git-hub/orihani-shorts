const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function compile(rel,mocks={}){
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(n=>Object.hasOwn(mocks,n)?mocks[n]:n.startsWith('.')?compile(path.join(path.dirname(rel),n)+'.ts',mocks):require(n),m,m.exports);return m.exports;
}
const {compileProductionPlan,readReviewIssues}=compile('src/productionContinuity.ts');
function housePlan(){
 const parts=[{id:'front-wall',description:'Full front panel, folds forward on the bottom hinge.'},{id:'side-door',description:'Separate small entrance on the left wall, vertical hinge.'},{id:'star-window',description:'Fixed star-shaped opening beside the entry; no shutter.'},{id:'roof',description:'Liftable cover. No pre-cut holes.'}];
 return {propBible:[{id:'house',name:'Cardboard house',appearance:'Brown corrugated cardboard.',scale:'Always wide enough for the three unchanged ducks; low roof.',parts}],clips:[0,1,2,3].map(i=>({
  imagePrompt:'BAD_OLD_PROMPT: the fallen wall and completed ending.',
  shot:{size:i===2?'close-up':'wide',angle:'Left front oblique',focus:i===2?'Fan and front panel only':'House and its current occupants',startState:'START_POSE_'+i},
  frame:{environment:'Warm clinic pantry, right window.',visibleCharacters:i===2?['Somi']:['Deok-i','O-wonjang','Somi'],props:[{id:'house',placement:'On the floor beside the window.',parts:parts.map(p=>({id:p.id,state:p.id==='front-wall'?(i===3?'Flat on the floor.':'Upright and closed.'):p.id==='side-door'?'Open.':p.id==='star-window'?'Open aperture.':'Cover attached.',visibility:i===2&&p.id!=='front-wall'?'offscreen':'visible'}))}],action:'ACTION_ONLY_'+i,endState:'END_ONLY_'+i,continuityFromPrevious:'BRIDGE_ONLY_'+i},
  videoPrompt:`REFERENCE INSTRUCTION: example\nOUTPUT SPECS: ${[4,4,3,4][i]}s, vertical 9:16.\nCINEMATOGRAPHY: Fixed.\nENVIRONMENT: Pantry.\nACTION: OLD_ACTION\nDIALOGUE: ${i===3?'Deok-i: "이제 아무도 못 들어와요."':'None.'}\nAUDIO: Room tone.\nSTRICT RULES: Duck anatomy.`,
 }))};
}
test('episode 10 image prompts contain only current start facts; video retains causal action and exact dialogue',()=>{
 const original=housePlan(),plan=compileProductionPlan(original);
 for(const [i,c] of plan.clips.entries()){
  assert.match(c.imagePrompt,new RegExp('START_POSE_'+i));
  assert.doesNotMatch(c.imagePrompt,/ACTION_ONLY|END_ONLY|BRIDGE_ONLY|BAD_OLD_PROMPT/);
  assert.match(c.videoPrompt,new RegExp('During this clip: ACTION_ONLY_'+i));
  assert.match(c.videoPrompt,new RegExp('End: END_ONLY_'+i));
  assert.doesNotMatch(c.videoPrompt,/OLD_ACTION/);
  assert.match(c.imagePrompt,/Always wide enough for the three unchanged ducks/);
  assert.match(c.imagePrompt,/Separate small entrance/);assert.match(c.imagePrompt,/Fixed star-shaped opening/);
 }
 assert.match(plan.clips[2].imagePrompt,/START state: Upright and closed/);
 assert.match(plan.clips[3].imagePrompt,/START state: Flat on the floor/);
 assert.match(plan.clips[3].videoPrompt,/DIALOGUE: Deok-i: "이제 아무도 못 들어와요\."\nAUDIO: Room tone/);
 assert.equal(original.clips[0].imagePrompt.startsWith('BAD_OLD_PROMPT'),true);
});
test('part omission, unplanned roof holes, duplicate ids and unknown props are rejected',()=>{
 let p=housePlan();p.clips[1].frame.props[0].parts.pop();assert.throws(()=>compileProductionPlan(p),/부품 상태 누락/);
 p=housePlan();p.clips[3].frame.props[0].parts[3].id='roof-hole';assert.throws(()=>compileProductionPlan(p),/부품 상태 누락/);
 p=housePlan();p.propBible.push(p.propBible[0]);assert.throws(()=>compileProductionPlan(p),/중복/);
 p=housePlan();p.clips[1].frame.props[0].id='new-bigger-house';assert.throws(()=>compileProductionPlan(p),/정의되지 않은 소품/);
});
test('close-up preserves offscreen parts without dragging all cast into the frame; no-prop scenes are valid',()=>{
 const p=housePlan(),close=compileProductionPlan(p).clips[2];
 assert.match(close.imagePrompt,/Shot size: close-up/);assert.match(close.imagePrompt,/Visible cast: Somi\./);
 assert.match(close.imagePrompt,/visibility: offscreen/);
 p.propBible=[];p.clips.forEach(c=>c.frame.props=[]);
 assert.match(compileProductionPlan(p).clips[0].imagePrompt,/No story props/);
});
test('malformed reviews never become a pass',()=>{
 assert.deepEqual(readReviewIssues('{"issues":[]}'),[]);
 assert.throws(()=>readReviewIssues('{}'),/검수 결과/);
 assert.throws(()=>readReviewIssues('{"issues":[null]}'),/검수 지적/);
 assert.throws(()=>readReviewIssues('not json'));
});
test('compiled scene reaches the actual image request without later-action text',async()=>{
 const png='data:image/png;base64,AQID',calls=[];
 const scene=compileProductionPlan(housePlan()).clips[2];
 const {useMediaGeneration}=compile('src/hooks/useMediaGeneration.ts',{
  'react':{useRef:v=>({current:v})},'../authFetch':{authFetch:async(url,opts)=>{calls.push(JSON.parse(opts.body));return Response.json({result:png});}},
  '../utils/db':{db:{get:async()=>({images:{}})}},
  '../constants':{CHARACTERS:[{id:'nurse',name:'소미',file:'somi',imgs:[png]}]},
 });
 const api=useMediaGeneration(()=>{},async()=>{},'new',()=>{},{},()=>{},{},'nurse');
 const scenes=[{title:'test',prompt:scene.imagePrompt,shot:scene.shot,backgroundAsset:'none',referencePlan:{background:null,props:[]}}];
 assert.equal(await api.handleGenerateImage('test',scene.imagePrompt,0,scenes),true);
 const prompt=calls[0].parts.filter(p=>p.text).map(p=>p.text).join('\n');
 assert.match(prompt,/START state: Upright and closed/);assert.doesNotMatch(prompt,/END_ONLY|ACTION_ONLY|BAD_OLD_PROMPT/);
});
