const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),ts=require('typescript');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),cache=new Map();
function compile(rel){
 if(cache.has(rel))return cache.get(rel);
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(n=>n.startsWith('.')?compile(path.join(path.dirname(rel),n)+'.ts'):require(n),m,m.exports);
 cache.set(rel,m.exports);return m.exports;
}
const {readProductionPackage,readWeeklyInput,preparedHistory}=compile('src/workflow/productionPackage.ts');
const {makePackage,readPackage,editorEpisode}=compile('src/workflow/package.ts');
const {defaultPlan,importEpisode,validatePlan}=compile('src/editor/model.ts');
const {draftStage,resultKey,resultIsCurrent}=compile('src/editor/draft.ts');
const {render,subtitles}=compile('server/editor/render.ts');
const screen=(patch={})=>({...defaultPlan(),duration:5,videoLayout:'single',captionStyle:'screen',aspectRatio:'16:9',originalVolume:1,...patch});
function production(){
 const episode={duration:30,title:'[에피소드 1] 가로 실험',scenario:'두 장소와 마지막 선택',korean:'해설: 없음\n화면 자막: (무대사)',thumbnail:'어디서 살래?',caption:'두 장소',captionStyle:'screen',videoLayout:'single',aspectRatio:'16:9',originalVolume:1};
 const plan={workflow:'kling4',duration:30,aspectRatio:'16:9',title:'가로 실험',location:'두 장소',scenario:episode.scenario,instagramCaption:'두 장소',hashtags:['오리','여행','상상','애니메이션','풍경'],continuity:'Reference continuity.',videoPrompt:'Keep the original 30-second landscape story and its four keyframes.',keyframes:[0,8,17,30].map((time,i)=>({time,title:'주요장면 '+i,imageTitle:'가로 실험 '+i,imagePrompt:'Exact image state at '+time,locationId:i<2?'underwater':'sky',backgroundAsset:'none',referencePlan:{background:null,props:[]}}))};
 return {format:'orihani-production',version:1,revision:'landscape-independent-v1',episodes:[{number:1,characterId:'deoki',episode,plan}]};
}
test('30 seconds and four authored keyframes preserve landscape settings, images and exact prompts through editor handoff',()=>{
 const raw=production(),pack=readProductionPackage(JSON.stringify(raw)),entry=pack.episodes[0];
 assert.equal(readWeeklyInput(JSON.stringify(raw))[0].title,'가로 실험');
 const item=preparedHistory(entry,pack.revision),images=Object.fromEntries(entry.plan.keyframes.map(f=>[f.imageTitle,'data:image/png;base64,AAAA']));
 const restored=readPackage(makePackage(item,images));
 assert.deepEqual(restored.images,images);assert.equal(restored.item.result,item.result);
 assert.equal(JSON.parse(restored.item.result).keyframes.length,4);
 const edit=importEpisode(editorEpisode(restored.item));validatePlan(edit);
 assert.equal(edit.title,'가로 실험');assert.equal(edit.duration,30);assert.equal(edit.aspectRatio,'16:9');assert.equal(edit.originalVolume,1);assert.equal(edit.videoLayout,'single');assert.equal(edit.narration,'');assert.deepEqual(edit.captions,[]);
 assert.equal(JSON.parse(item.result).videoPrompt,entry.plan.videoPrompt);
 const d={id:'screen-draft',plan:edit,original:'',voice:'',style:'',videos:[new File(['video'],'landscape.mp4')]};
 assert.equal(draftStage(d),'captions');
 const done={...d,result:new Blob(['finished']),resultKey:resultKey(d)};
 assert.equal(resultIsCurrent(done),true);assert.equal(draftStage(done),'result');
 assert.equal(resultIsCurrent({...done,plan:{...edit,aspectRatio:'9:16'}}),false);
});
test('manual screen mode rejects narration, extra media layouts, changed volume and invalid aspect ratios',()=>{
 for(const patch of [{narration:'read me'},{videoLayout:'legacy-clips'},{originalVolume:0.2},{aspectRatio:'4:3'},{voiceSegments:[{sourceStart:0,sourceEnd:1,start:0}]}])assert.throws(()=>validatePlan(screen(patch)));
 const p=production();p.episodes[0].plan.aspectRatio='9:16';assert.throws(()=>readProductionPackage(JSON.stringify(p)),/비율/);
 const missingPlanRatio=production();delete missingPlanRatio.episodes[0].plan.aspectRatio;assert.throws(()=>readProductionPackage(JSON.stringify(missingPlanRatio)),/비율/);
 const missingEpisodeRatio=production();delete missingEpisodeRatio.episodes[0].episode.aspectRatio;assert.throws(()=>readProductionPackage(JSON.stringify(missingEpisodeRatio)),/비율/);
 const legacyRatios=production();delete legacyRatios.episodes[0].plan.aspectRatio;delete legacyRatios.episodes[0].episode.aspectRatio;assert.doesNotThrow(()=>readProductionPackage(JSON.stringify(legacyRatios)));
 const clinic={...screen(),captionStyle:'clinic'};assert.throws(()=>validatePlan(clinic),/세로/);
 const legacy=defaultPlan();validatePlan(legacy);assert.equal(legacy.aspectRatio,undefined);assert.equal(legacy.originalVolume,0.2);
 assert.match(subtitles(legacy),/PlayResX: 1080\nPlayResY: 1920/);
 assert.match(subtitles(screen({captions:[{start:0,end:5,text:'직접 넣은 문구',source:'screen'}]})),/PlayResX: 1920\nPlayResY: 1080/);
});

const ff=process.env.FFMPEG_PATH||'ffmpeg';
const media=(args)=>execFileSync(ff,['-hide_banner','-loglevel','error','-nostdin',...args],{timeout:60000,encoding:'utf8'});
const hash=(file,stream)=>media(['-i',file,'-map',stream,'-c','copy','-f','hash','-']);
const probe=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
test('actual landscape export copies uncaptained streams and captions preserve dimensions, frames, duration and original sound',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ori-screen-test-'));
 const source=path.join(dir,'source.mp4');
 try{
  media(['-y','-f','lavfi','-i','color=c=blue:s=640x360:r=25:d=5.04','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=5.04','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',source]);
  const before=probe(source),sourceVideoHash=hash(source,'0:v:0'),sourceAudioHash=hash(source,'0:a:0');
  let output=await render(screen(),[source],undefined,dir);
  assert.equal(hash(output,'0:v:0'),sourceVideoHash);assert.equal(hash(output,'0:a:0'),sourceAudioHash);
  output=await render(screen({captions:[{start:0,end:5,text:'보이는 자막',source:'screen'}]}),[source],undefined,dir);
  const after=probe(output),a=before.streams.find(s=>s.codec_type==='video'),b=after.streams.find(s=>s.codec_type==='video');
  assert.equal(b.width,640);assert.equal(b.height,360);assert.equal(b.nb_frames,a.nb_frames);assert.equal(b.avg_frame_rate,a.avg_frame_rate);
  assert.ok(Math.abs(+after.format.duration-+before.format.duration)<0.03);assert.equal(hash(output,'0:a:0'),sourceAudioHash);
  assert.notEqual(hash(output,'0:v:0'),sourceVideoHash);assert.match(fs.readFileSync(path.join(dir,'captions.ass'),'utf8'),/보이는 자막/);
  await assert.rejects(render(screen({aspectRatio:'9:16'}),[source],undefined,dir),/세로 9:16/);
  await assert.rejects(render(screen(),[source],source,dir),/별도 음성/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('silent portrait screen exports stay silent and retain the legacy default ratio',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ori-screen-silent-')),source=path.join(dir,'source.mp4');
 try{
  media(['-y','-f','lavfi','-i','color=c=green:s=360x640:r=24:d=5','-c:v','libx264','-pix_fmt','yuv420p',source]);
  const output=await render(screen({aspectRatio:undefined}),[source],undefined,dir),metadata=probe(output);
  assert.equal(metadata.streams.filter(s=>s.codec_type==='audio').length,0);
  assert.equal(hash(output,'0:v:0'),hash(source,'0:v:0'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
