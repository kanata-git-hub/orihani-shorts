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
const file=(name,id,time='2026-11-06T01:00:00Z')=>({name,id:id+'_abcdefghijklmnopqrst',mimeType:'application/json',modifiedTime:time});
const main=file('[2026-11-01] 3D 오리 삼총사 릴스 개그 시리즈 주간 패키지.json','main');
const experiment=file('[2026-11-06] 오리 상상여행 실험작 제작안.json','experiment');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=','base64'),hash=createHash('sha256').update(png).digest('hex');
function pack(revision){
 const plan={workflow:'kling4',duration:30,title:revision,location:'synthetic room',scenario:'Synthetic movement.',instagramCaption:'Synthetic caption.',hashtags:['#a','#b','#c','#d','#e'],continuity:'Keep the synthetic prop.',videoPrompt:'Move the synthetic prop.',keyframes:[0,30].map((time,i)=>({time,title:'frame '+i,imageTitle:revision+'-'+i,imagePrompt:'Synthetic frame.',referencePlan:{background:null,props:[]}}))};
 return {format:'orihani-production',version:1,revision,episodes:[{number:1,characterId:'owonjang',episode:{duration:30,title:'[에피소드 1] '+revision,scenario:plan.scenario,korean:'',thumbnail:'',caption:plan.instagramCaption},plan,assets:Object.fromEntries(plan.keyframes.map((k,i)=>[k.imageTitle,{fileId:revision+'_image_'+i+'_abcdefghijklmnopq',sha256:hash}]))}]};
}
const mainRaw=JSON.stringify(pack('main')),experimentRaw=JSON.stringify(pack('experiment'));
function reader(files=[main,experiment],contents={[main.id]:mainRaw,[experiment.id]:experimentRaw},requested=[]){
 return createWeeklyReader({key:()=> 'test',fetch:async url=>{
  const u=new URL(url);if(u.pathname==='/drive/v3/files')return Response.json({files});
  const id=u.pathname.split('/').at(-1);requested.push(id);assert.ok(Object.hasOwn(contents,id));return new Response(contents[id]);
 }});
}
test('standalone experiment joins the current sources and survives a later weekly main',()=>{
 const clinic=file('[2026-11-01] 한의원 쇼츠 07-08 제작안.json','clinic');
 const reserve=file('[2026-10-25] 한의원 쇼츠 추가 03-04 제작안.json','reserve');
 const bonus=file('[2026-11-01] 번외 제작안.json','bonus');
 const current=[clinic,reserve,experiment,bonus,main];
 assert.deepEqual(weeklySources(current).map(f=>f.id),[main.id,clinic.id,reserve.id,bonus.id,experiment.id]);
 const next=file('[2026-11-08] 3D 오리 삼총사 릴스 개그 시리즈 주간 패키지.json','next');
 assert.deepEqual(weeklySources([...current,next]).map(f=>f.id),[next.id,reserve.id,experiment.id]);
});
test('experiment selection uses newest valid date, then modification time and stable ID',()=>{
 const older=file('[2026-11-05] 오리 상상여행 실험작 제작안.json','older','2026-11-07T01:00:00Z');
 const stale=file(experiment.name,'stale','2026-11-05T01:00:00Z');
 const tied=file(experiment.name,'z_tied');
 const ignored=[
  file('[2026-02-30] 오리 상상여행 실험작 제작안.json','badDate'),
  file('[2026-11-07] 오리 상상여행 실험작 제작안.orihani-work.json','work'),
  file('[2026-11-07] 오리 상상여행 실험작 검수기록.json','review'),
  file('[2026-11-07] 오리 상상여행 실험작 제작안.json.bak','backup'),
  file('[2026-11-07] 오리 상상여행 실험작 제작안.json 추가','suffix'),
  {...file('[2026-11-07] 오리 상상여행 실험작 제작안.json','mime'),mimeType:'image/png'},
  {...experiment,id:'invalid'},
 ];
 assert.deepEqual(weeklySources([older,stale,tied,...ignored,experiment,main]).map(f=>f.id),[main.id,experiment.id]);
 assert.deepEqual(weeklySources([experiment,main,...ignored,tied,stale,older]).map(f=>f.id),[main.id,experiment.id]);
});
test('standalone source consumes the existing eight-source bound',()=>{
 const additions=Array.from({length:MAX_WEEKLY_SOURCES-2},(_,i)=>file('[2026-11-01] 번외 추가 '+(i+1)+' 제작안.json','extra'+i));
 assert.equal(weeklySources([main,...additions,experiment]).length,MAX_WEEKLY_SOURCES);
 assert.throws(()=>weeklySources([main,...additions,experiment,file('[2026-11-01] 번외 제작안.json','bonus')]),/너무 많/);
});
test('reader exposes the experiment date and source revision without changing main metadata',async()=>{
 const result=await reader()();
 assert.equal(result.id,main.id);assert.equal(result.date,'2026-11-01');assert.equal(result.episodeCount,2);
 assert.deepEqual(result.sources.map(s=>[s.id,s.date,s.episodeCount]),[[main.id,'2026-11-01',1],[experiment.id,'2026-11-06',1]]);
 assert.deepEqual(readWeeklySources(result.sources.map(s=>s.text)).map(c=>[c.preparedRevision,c.prepared.number]),[['main',1],['experiment',1]]);
});
test('malformed newest experiment fails visibly without loading an older version',async()=>{
 const older=file('[2026-11-05] 오리 상상여행 실험작 제작안.json','older'),requested=[];
 await assert.rejects(reader([main,older,experiment],{[main.id]:mainRaw,[experiment.id]:'{}',[older.id]:experimentRaw},requested)(),/완성 제작안/);
 assert.ok(requested.includes(experiment.id));assert.ok(!requested.includes(older.id));
});
test('image lookup resolves the standalone revision despite a matching weekly episode number',async()=>{
 const catalog=await reader()(),requested=[];
 const load=createWeeklyImagesReader({key:()=> 'test',weekly:async()=>catalog,fetch:async url=>{
  const u=new URL(url);requested.push(u.pathname);
  if(u.pathname==='/drive/v3/files')return Response.json({files:[mainRaw,experimentRaw].flatMap(raw=>JSON.parse(raw).episodes.flatMap(e=>Object.values(e.assets).map(a=>({id:a.fileId,mimeType:'image/png',size:String(png.length)}))))});
  assert.ok(u.pathname.includes('/experiment_image_'));return new Response(png);
 }});
 const images=await load(1,'experiment');
 assert.deepEqual(Object.keys(images.images),['experiment-0','experiment-1']);assert.equal(requested.length,3);
 await assert.rejects(load(1,'other-experiment'),/갱신/);
});
