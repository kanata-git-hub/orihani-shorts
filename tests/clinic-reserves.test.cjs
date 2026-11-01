const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
function compile(rel){
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(n=>n.startsWith('.')?compile(['.ts','.tsx'].map(ext=>path.join(path.dirname(rel),n)+ext).find(p=>fs.existsSync(path.join(root,p)))):require(n),m,m.exports);return m.exports;
}
const {weeklySources,createWeeklyReader}=compile('server/workflow/weekly.ts');
const {readWeeklySources,MAX_WEEKLY_SOURCES}=compile('src/workflow/productionPackage.ts');
const {createWeeklyImagesReader}=compile('server/workflow/weeklyImages.ts');
const {prepareDriveWork}=compile('src/workflow/preparedWork.ts');
const {editorEpisode}=compile('src/workflow/package.ts');
const {importEpisode,validatePlan}=compile('src/editor/model.ts');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=','base64'),hash=createHash('sha256').update(png).digest('hex');
function pack(revision,numbers,clinic=true){
 return {format:'orihani-production',version:1,revision,episodes:numbers.map(number=>{
  const title=clinic?`한의원 쇼츠 ${String(number).padStart(2,'0')} 시험`:`${number}화 시험 (하찮은 오리 일상)`;
  const plan={workflow:'kling4',duration:15,title,location:'test room',scenario:'Synthetic test state.',instagramCaption:'test copy',hashtags:['#a','#b','#c','#d','#e'],continuity:'same test prop',videoPrompt:'Synthetic movement, then stop. No speech.',keyframes:[0,7.5,15].map((time,i)=>({time,title:'frame '+i,imageTitle:revision+'-'+number+'-'+i,imagePrompt:'Synthetic frame '+i,referencePlan:{background:null,props:[]}}))};
  const episode={duration:15,title:`[에피소드 ${number}] ${title}`,scenario:plan.scenario,korean:'해설: 없음\n화면 자막: 0~15초 시험 자막',thumbnail:title,caption:plan.instagramCaption,...(clinic?{captionStyle:'clinic',videoLayout:'single',clinicBrandStart:11.5}:{})};
  return {number,characterId:'owonjang',episode,plan,assets:Object.fromEntries(plan.keyframes.map((k,i)=>[k.imageTitle,{fileId:revision+'_'+number+'_'+i+'_abcdefghijklmnopq',sha256:hash}]))};
 })};
}
const file=(date,label,id,time=date+'T01:00:00Z')=>({name:`[${date}] ${label} 제작안.json`,id:id+'_abcdefghijklmnopqrst',mimeType:'application/json',modifiedTime:time});
const main=date=>({...file(date,'unused','main'+date),name:`[${date}] 3D 오리 삼총사 릴스 개그 시리즈 주간 패키지.json`});
const current=file('2026-11-01','한의원 쇼츠 01-02','current');
const reserve34=file('2026-11-01','한의원 쇼츠 추가 03-04','reserve34');
const reserve56=file('2026-11-01','한의원 쇼츠 추가 05-06','reserve56');
const packs=[pack('main-test',[28,29,30],false),pack('clinic-current',[1,2]),pack('clinic-reserve34',[3,4]),pack('clinic-reserve56',[5,6])];
const files=[main('2026-11-01'),current,reserve34,reserve56];
function reader(list=files,values=packs){
 const valuesById=new Map(list.map((f,i)=>[f.id,typeof values[i]==='string'?values[i]:JSON.stringify(values[i])]));
 return createWeeklyReader({key:()=> 'test',fetch:async url=>{
  const u=new URL(url);if(u.pathname==='/drive/v3/files')return Response.json({files:list});
  const id=u.pathname.split('/').at(-1);assert.ok(valuesById.has(id));return new Response(valuesById.get(id));
 }});
}

test('explicit clinic reserves coexist with the current pair and remain when next week is published',()=>{
 assert.deepEqual(weeklySources(files.slice().reverse()).map(f=>f.id),files.map(f=>f.id));
 const next=main('2026-11-08'),nextClinic=file('2026-11-08','한의원 쇼츠 07-08','nextClinic');
 assert.deepEqual(weeklySources([...files,next,nextClinic]).map(f=>f.id),[next.id,nextClinic.id,reserve34.id,reserve56.id]);
 // Removing a reserve from the configured folder leaves other sources untouched.
 assert.deepEqual(weeklySources([files[0],current,reserve56]).map(f=>f.id),[files[0].id,current.id,reserve56.id]);
});

test('newest reserve wins per normalized range without reviving archives or ordinary old companions',()=>{
 const later=file('2026-11-02','한의원 쇼츠 추가 3 · 4','later');
 const amended=file('2026-11-02','한의원 쇼츠 추가 03-04','amended','2026-11-02T02:00:00Z');
 const oldModifiedLater={...reserve34,modifiedTime:'2026-11-08T03:00:00Z'};
 const noise=[file('2026-11-09','한의원 쇼츠 추가 09-10','future'),file('2026-11-01','한의원 쇼츠 11-12','oldOrdinary'),
  {...reserve56,id:'archive_abcdefghijklmnopqrst',name:reserve56.name.replace('.json',' 보관.json')},
  {...reserve56,id:'review_abcdefghijklmnopqrst',name:reserve56.name.replace('제작안','검수기록')},
  {...reserve56,id:'work_abcdefghijklmnopqrst',name:reserve56.name.replace('.json','.orihani-work.json')},
  file('2026-02-30','한의원 쇼츠 추가 13-14','invalidDate'),{...reserve56,id:'wrongtype_abcdefghijklmnopq',mimeType:'application/vnd.google-apps.document'}];
 assert.deepEqual(weeklySources([main('2026-11-08'),later,oldModifiedLater,amended,reserve56,...noise]).map(f=>f.id),[main('2026-11-08').id,amended.id,reserve56.id]);
});

test('exact current replacement retires its reserve while partial overlaps fail visibly',()=>{
 const next=main('2026-11-08'),replacement=file('2026-11-08','한의원 쇼츠 03-04','replacement');
 assert.deepEqual(weeklySources([next,replacement,reserve34,reserve56]).map(f=>f.id),[next.id,replacement.id,reserve56.id]);
 const later=main('2026-11-15'),laterClinic=file('2026-11-15','한의원 쇼츠 09-10','laterClinic');
 assert.deepEqual(weeklySources([next,replacement,reserve34,reserve56,later,laterClinic]).map(f=>f.id),[later.id,laterClinic.id,reserve56.id]);
 const explicitlyRenewed=file('2026-11-09','한의원 쇼츠 추가 03-04','renewed');
 assert.deepEqual(weeklySources([replacement,reserve34,reserve56,later,laterClinic,explicitlyRenewed]).map(f=>f.id),[later.id,laterClinic.id,explicitlyRenewed.id,reserve56.id]);
 assert.throws(()=>weeklySources([next,file('2026-11-08','한의원 쇼츠 04-05','overlap'),reserve34,reserve56]),/겹칩니다/);
 assert.throws(()=>weeklySources([next,reserve34,file('2026-11-01','한의원 쇼츠 추가 04-05','overlap')]),/겹칩니다/);
 for(const range of ['0','04-03','03-06','9007199254740992'])assert.throws(()=>weeklySources([next,file('2026-11-01','한의원 쇼츠 추가 '+range,'invalid')]),/회차 범위/);
});

test('four source files retain nine choices, source dates, exact prompts and independent revisions',async()=>{
 const catalog=await reader()(),choices=readWeeklySources(catalog.sources.map(s=>s.text));
 assert.equal(catalog.sources.length,4);assert.equal(catalog.episodeCount,9);
 assert.deepEqual(choices.map(c=>c.prepared.number),[28,29,30,1,2,3,4,5,6]);
 assert.equal(choices[8].preparedRevision,packs[3].revision);assert.equal(choices[8].title,'한의원 쇼츠 06 시험');
 assert.equal(choices[8].prepared.plan.videoPrompt,packs[3].episodes[1].plan.videoPrompt);
 const nextFiles=[main('2026-11-08'),file('2026-11-08','한의원 쇼츠 07-08','next'),reserve34,reserve56];
 const nextCatalog=await reader(nextFiles,[pack('next-main',[31,32,33],false),pack('next-clinic',[7,8]),packs[2],packs[3]])();
 assert.deepEqual(nextCatalog.sources.map(s=>s.date),['2026-11-08','2026-11-08','2026-11-01','2026-11-01']);
 assert.equal(nextCatalog.episodeCount,9);
});

test('malformed reserves, mislabeled ranges and duplicate clinic series numbers are not silently hidden',async()=>{
 await assert.rejects(reader(files,[packs[0],packs[1],'{}',packs[3]])(),/완성 제작안/);
 await assert.rejects(reader(files,[packs[0],packs[1],pack('wrong-range',[3,5]),packs[3]])(),/파일명의 회차 범위/);
 await assert.rejects(reader(files,[packs[0],packs[1],pack('wrong-style',[3,4],false),packs[3]])(),/파일명의 회차 범위/);
 const unnamed=file('2026-11-01','한의원 쇼츠','unnamed');
 await assert.rejects(reader([files[0],unnamed,reserve34],[packs[0],pack('unnamed-clinic',[3,4]),packs[2]])(),/한의원 쇼츠 회차가 중복/);
 // Main-series episode numbers may still match a clinic number.
 assert.equal(readWeeklySources([JSON.stringify(pack('main-number3',[3],false)),JSON.stringify(packs[2])]).length,3);
});

test('reserve source bounds remain enforced without raising the eight-file limit',()=>{
 const reserves=Array.from({length:MAX_WEEKLY_SOURCES},(_,i)=>file('2026-11-01','한의원 쇼츠 추가 '+String(i+1).padStart(2,'0'),'bound'+i));
 assert.equal(weeklySources([files[0],...reserves.slice(1)]).length,MAX_WEEKLY_SOURCES);
 assert.throws(()=>weeklySources([files[0],...reserves]),/너무 많/);
});

test('reserve selection downloads its own images and opens clinic editing without rewriting captions',async()=>{
 const catalog=await reader()(),requests=[];
 const load=createWeeklyImagesReader({key:()=> 'test',weekly:async()=>catalog,fetch:async url=>{
  const u=new URL(url);requests.push(u.pathname);
  if(u.pathname==='/drive/v3/files')return Response.json({files:packs.flatMap(p=>p.episodes.flatMap(e=>Object.values(e.assets).map(a=>({id:a.fileId,mimeType:'image/png',size:String(png.length)}))))});
  assert.ok(u.pathname.includes('/clinic-reserve56_6_'));return new Response(png);
 }});
 const entry=packs[3].episodes[1],images=await load(6,packs[3].revision);
 const work=await prepareDriveWork(entry,packs[3].revision,async url=>{assert.equal(url,'/api/editor/weekly/6/images?revision=clinic-reserve56');return Response.json(images);});
 assert.equal(Object.keys(work.images).length,3);assert.equal(requests.length,4);
 const edit=importEpisode(editorEpisode(work.item));validatePlan(edit);
 assert.equal(edit.title,'한의원 쇼츠 06 시험');assert.equal(edit.captionStyle,'clinic');assert.equal(edit.videoLayout,'single');assert.equal(edit.originalVolume,1);assert.equal(edit.clinicBrandStart,11.5);assert.equal(edit.narration,'');
 assert.deepEqual(edit.captions,[{start:0,end:15,text:'시험 자막',source:'screen'}]);
 assert.equal(JSON.parse(work.item.result).videoPrompt,entry.plan.videoPrompt);
 await assert.rejects(load(6,'old-reserve-revision'),/갱신/);
});
