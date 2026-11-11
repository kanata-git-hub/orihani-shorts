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
const {defaultPlan,importEpisode,validatePlan}=compile('src/editor/model.ts');
const {readProductionPackage,readWeeklyInput,readWeeklySources,preparedHistory}=compile('src/workflow/productionPackage.ts');
const {makePackage,readPackage,editorEpisode,isClinicEpisode}=compile('src/workflow/package.ts');
const {hasDraftContent,resultKey,resultIsCurrent}=compile('src/editor/draft.ts');
const {generateKoreanCaptions}=compile('server/editor/koreanCaptions.ts');
const {render}=compile('server/editor/render.ts');
const captions=[{start:0,end:1.2,text:'잠깐만요',source:'screen'},{start:1.2,end:15,text:'이렇게 되는 거였어?',source:'screen'}];
const korean=(patch={})=>({...defaultPlan(),duration:15,videoLayout:'single',captionStyle:'korean',aspectRatio:'9:16',originalVolume:1,headline:['첫 화면의 상황','이어지는 반응'],captions,...patch});
function production(clinic=false,duration=15){
 const title=clinic?'한의원 쇼츠 09 시험':'31화 시험 (하찮은 오리 일상)';
 const episode={...korean({duration,captions:captions.map(c=>({...c,end:Math.min(c.end,duration)}))}),title:`[에피소드 ${clinic?9:31}] ${title}`,scenario:'검사용 상황',korean:'해설: 없음\n화면 자막: 0~15초 이 원문은 구조화 타임라인으로 대체',thumbnail:'공개 제목',caption:'게시 설명'};
 const plan={workflow:'kling4',duration,aspectRatio:'9:16',title,location:'검사용 장소',scenario:episode.scenario,instagramCaption:'게시 설명',hashtags:['검사','오리','일상','애니메이션','유머'],continuity:'Reference continuity.',videoPrompt:`Keep the original ${duration}-second story and its keyframes.`,keyframes:[0,duration/2,duration].map((time,i)=>({time,title:'주요장면 '+i,imageTitle:'검사 '+i,imagePrompt:'Exact image state at '+time,locationId:'room',backgroundAsset:'none',referencePlan:{background:null,props:[]}}))};
 return {format:'orihani-production',version:1,revision:clinic?'clinic-korean-test':'main-korean-test',episodes:[{number:clinic?9:31,characterId:'deoki',episode,plan}]};
}

test('authored main and clinic packages carry mandatory headlines and exact timeline through images, history and editor',()=>{
 for(const duration of [12,15]) for(const clinic of [false,true]) for(const preset of [undefined,'balanced','wide']){
  const raw=production(clinic,duration);if(preset)raw.episodes[0].episode.koreanTitlePreset=preset;
  const pack=readProductionPackage(JSON.stringify(raw)),entry=pack.episodes[0];
  const item=preparedHistory(entry,pack.revision),images=Object.fromEntries(entry.plan.keyframes.map(f=>[f.imageTitle,'data:image/png;base64,AAAA']));
  const restored=readPackage(makePackage(item,images)),edit=importEpisode(editorEpisode(restored.item));
  validatePlan(edit);assert.deepEqual(edit.headline,raw.episodes[0].episode.headline);assert.deepEqual(edit.captions,raw.episodes[0].episode.captions);assert.equal(edit.duration,duration);assert.deepEqual(restored.images,images);
  assert.equal(edit.koreanTitlePreset,preset);
  assert.equal(edit.narration,'');assert.equal(edit.originalVolume,1);assert.equal(edit.videoLayout,'single');assert.equal(edit.captionStyle,'korean');
  assert.equal(isClinicEpisode(readWeeklyInput(JSON.stringify(raw))[0]),clinic);
  assert.equal(restored.item.result,item.result,'author prompts are never rewritten');
 }
 const raw=production(true);for(const key of ['headline','captions']){const broken=structuredClone(raw);delete broken.episodes[0].episode[key];assert.throws(()=>readProductionPackage(JSON.stringify(broken)),/제목|자막/);}
 assert.throws(()=>readWeeklySources([JSON.stringify(production(true)),JSON.stringify({...production(true),revision:'duplicate'})]),/한의원 쇼츠 회차/);
});

test('new Korean preset rejects missing text, changed length/ratio, voice and incorrect caption times while old presets remain readable',()=>{
 validatePlan(korean());
 validatePlan(korean({duration:12,captions:[{start:0,end:12,text:'끝까지'}]}));
 assert.throws(()=>validatePlan(korean({duration:12})),/자막/);
 assert.throws(()=>validatePlan({...defaultPlan(),duration:12,videoLayout:'legacy-clips'}),/영상 한 개/);
 for(const patch of [{koreanTitlePreset:'unknown'},{captions:[]},{headline:['','제목']},{headline:['줄\n바꿈','제목']},{duration:30},{aspectRatio:'16:9'},{originalVolume:.2},{narration:'읽지 마세요'},{captions:[{start:0,end:15.1,text:'끝'}]}])assert.throws(()=>validatePlan(korean(patch)));
 assert.equal(defaultPlan().captionStyle,undefined);
 const old={duration:15,title:'기존',scenario:'기존 원고',korean:'해설: 없음',thumbnail:'기존',caption:''};
 assert.equal(importEpisode(old).captionStyle,undefined);
 validatePlan({...defaultPlan(),duration:5,videoLayout:'single',captionStyle:'screen',aspectRatio:'16:9',originalVolume:1});
 const draft={id:'head-only',plan:korean({captions:[],headline:['보관할 제목','둘째 줄']}),original:'',videos:[],voice:'',style:''};
 assert.equal(hasDraftContent(draft),true);
 const done={...draft,plan:korean(),result:new Blob(['old result'])};done.resultKey=resultKey(done);assert.equal(resultIsCurrent(done),true);
 assert.equal(resultIsCurrent({...done,plan:{...done.plan,headline:['바뀐 제목','둘째 줄']}}),false);
});

test('real libass calibration and transparent preview match approved geometry, colors and single-line sizing',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ori-korean-layout-'));
 try{
  const generated=await generateKoreanCaptions(korean(),dir,true);
  assert.equal(generated.layout.titleTopInkY,1920-generated.layout.maximumCaptionBottomInkY);
  assert.equal(generated.layout.titleY[1]-generated.layout.titleY[0],107);
  assert.equal(generated.layout.horizontalCenter,540);
  assert.ok(generated.layout.titleTopInkY>=295&&generated.layout.titleTopInkY<=320);
  const ass=fs.readFileSync(generated.ass,'utf8');
  assert.match(ass,/카페24 써라운드/);assert.match(ass,/&H006AD9FF/);assert.match(ass,/\\pos\(540,1535\)/);assert.match(ass,/\\pos\(540,1746\)/);
  assert.ok(!ass.includes('Kyobo'));assert.equal(generated.overlays.length,3);
  const geometry=JSON.parse(execFileSync(process.env.EDITOR_PYTHON_PATH||'python3',['-c',`from PIL import Image\nimport json,sys\nims=[Image.open(p).convert('RGBA') for p in sys.argv[1:]]\nprint(json.dumps([{'corner':im.getpixel((0,0))[3],'bbox':im.getchannel('A').getbbox(),'alpha':im.getextrema()[3]} for im in ims]))`,...generated.overlays.map(o=>o.path)],{encoding:'utf8'}));
  assert.ok(geometry.every(g=>g.corner===0&&g.alpha[1]>0),'preview is transparent with visible text');
  assert.ok(geometry[0].bbox[1]<400&&geometry[0].bbox[3]>1746,'persistent title and brand share a static layer');
  assert.ok(geometry[1].bbox[1]>=1535&&geometry[1].bbox[3]<1700,'timed caption layer is separate');
  const long=await generateKoreanCaptions(korean({headline:['이 제목은 화면 한 줄에 맞추려고 줄여야 하는 문구','두 번째 제목']}),dir,false);
  assert.ok(long.layout.headlineFontSizes[0]<88);
  const hostile=await generateKoreanCaptions(korean({headline:['{\\pos(0,0)}','제목']}),dir,false);
  assert.ok(fs.readFileSync(hostile.ass,'utf8').includes('｛＼pos(0,0)｝'),'user text cannot inject ASS override tags');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('real Korean export keeps full 1080 portrait frame, source audio and length, with captions until the final frame',async()=>{
 for(const duration of [12,15]){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ori-korean-video-'));
 const plan=korean({duration,koreanTitlePreset:'wide',captions:captions.map(c=>({...c,end:Math.min(c.end,duration)}))});
 try{
  const input=path.join(dir,'source.mp4');
  execFileSync(process.env.FFMPEG_PATH||'ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i',`color=c=0x245b7d:s=1080x1920:r=5:d=${duration}`,'-f','lavfi','-i',`sine=frequency=440:sample_rate=48000:duration=${duration}`,'-c:v','libx264','-preset','ultrafast','-threads','2','-pix_fmt','yuv420p','-c:a','aac','-shortest',input]);
  const audio=file=>execFileSync(process.env.FFMPEG_PATH||'ffmpeg',['-v','error','-i',file,'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-'],{encoding:'utf8'}).trim();
  const output=await render(plan,[input],undefined,dir);
  assert.equal(audio(output),audio(input),'AAC source audio packets are copied without narration/mixing');
  const meta=JSON.parse(execFileSync(process.env.FFPROBE_PATH||'ffprobe',['-v','error','-show_streams','-show_format','-of','json',output],{encoding:'utf8'}));
  const v=meta.streams.find(s=>s.codec_type==='video');assert.equal(v.width,1080);assert.equal(v.height,1920);assert.ok(Math.abs(Number(meta.format.duration)-duration)<.05);
  execFileSync(process.env.FFMPEG_PATH||'ffmpeg',['-v','error','-y','-ss',String(duration-.2),'-i',output,'-frames:v','1',path.join(dir,'last.png')]);
  const pixel=JSON.parse(execFileSync(process.env.EDITOR_PYTHON_PATH||'python3',['-c',`from PIL import Image\nimport json,sys\nim=Image.open(sys.argv[1]).convert('RGB')\nregion=im.crop((80,1535,1000,1660)); count=sum(1 for r,g,b in region.getdata() if r>210 and g>210 and b>190)\nprint(json.dumps({'edge':im.getpixel((0,900)),'captionPixels':count}))`,path.join(dir,'last.png')],{encoding:'utf8'}));
  assert.ok(pixel.edge[2]>80,'original full frame has no inserted letterbox');assert.ok(pixel.captionPixels>100,'final caption remains visible');
  await assert.rejects(()=>render(plan,[input],'voice.wav',dir),/별도 음성/);
  const otherDuration=duration===12?15:12;
  await assert.rejects(()=>render({...plan,duration:otherDuration,captions:[{start:0,end:otherDuration,text:'끝까지'}]},[input],undefined,dir),new RegExp(`${otherDuration}초 원본`));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 }
});

test('wide headlines use the measured 90–95% width, shared size, separated lines and unchanged lower captions',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ori-korean-wide-'));
 try{
  for(const headline of [['밥 먹으려 하면','꼭 할 일이 생김'],['첫 화면의 상황','반응'],['아주 길어진 제목도 화면에 맞춰요','둘째 줄']]){
   const p=korean({koreanTitlePreset:'wide',headline});
   const generated=await generateKoreanCaptions(p,dir,true);
   const layout=generated.layout;
   assert.equal(layout.koreanTitlePreset,'wide');
   assert.equal(layout.headlineFontSizes[0],layout.headlineFontSizes[1]);
   assert.ok(Math.max(...layout.headlineInkWidths)>=972&&Math.max(...layout.headlineInkWidths)<=1026);
   const ass=fs.readFileSync(generated.ass,'utf8');
   assert.match(ass,/\\pos\(540,1535\)/);assert.match(ass,/\\pos\(540,1746\)/);
   const geometry=JSON.parse(execFileSync(process.env.EDITOR_PYTHON_PATH||'python3',['-c',`from PIL import Image\nimport json,sys\nim=Image.open(sys.argv[1]).convert('RGBA')\n# Static preview: inspect headline ink only, excluding the brand.\nink=im.crop((0,0,1080,1000)).convert('RGB').convert('L').point(lambda x:255 if x>90 else 0)\nrows=[y for y in range(1000) if ink.crop((0,y,1080,y+1)).getbbox()]\ngaps=[b-a for a,b in zip(rows,rows[1:]) if b-a>1]\nprint(json.dumps({'bbox':ink.getbbox(),'gap':max(gaps,default=0)}))`,generated.overlays[0].path],{encoding:'utf8'}));
   assert.ok(geometry.bbox[0]>20&&geometry.bbox[2]<1060,'title is not clipped at the frame edges');
   assert.ok(geometry.gap>=20,'separate title lines have visible space');
   assert.equal(geometry.bbox[1],layout.balancedOuterMarginPx);
  }
  const wide=await generateKoreanCaptions(korean({koreanTitlePreset:'wide'}),dir);
  const wideSize=wide.layout.headlineFontSizes[0];
  const old=await generateKoreanCaptions(korean(),dir);
  const oldText=fs.readFileSync(old.ass,'utf8');
  assert.ok(wideSize>old.layout.headlineFontSizes[0],'ordinary new titles grow, not just their container');
  const explicitOld=await generateKoreanCaptions(korean({koreanTitlePreset:'balanced'}),dir);
  assert.equal(fs.readFileSync(explicitOld.ass,'utf8'),oldText,'missing and balanced preserve the exact prior ASS');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
