// Run with: node --import tsx --test tests/sitcom-weekly.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {weeklySources,createWeeklyReader} from '../server/workflow/weekly.ts';

const file=(name,id,modifiedTime='2026-11-13T00:00:00Z')=>({name,id:id+'_abcdefghijklmnopqrst',mimeType:'application/json',modifiedTime});
const main=file('[2026-11-01] 3D 오리 삼총사 릴스 개그 시리즈 주간 패키지.json','main');
const clinic=file('[2026-11-01] 한의원 쇼츠 01-02 제작안.json','clinic');
const reserve3=file('[2026-11-01] 한의원 쇼츠 추가 03-04 제작안.json','reserve3');
const reserve5=file('[2026-11-01] 한의원 쇼츠 추가 05-06 제작안.json','reserve5');
const bonus=file('[2026-11-01] 번외 10 제작안.json','bonus');
const bonus11=file('[2026-11-01] 번외 추가 11 제작안.json','bonus11');
const bonus12=file('[2026-11-01] 번외 추가 12 제작안.json','bonus12');
const experiment=file('[2026-11-06] 오리 상상여행 실험작 제작안.json','experiment');
const sitcom=file('[2026-11-13] 오리시트콤 1-3화 제작안.json','sitcom');
const existing=[main,clinic,reserve3,reserve5,bonus,bonus11,bonus12,experiment];

test('new sitcom is prepended without replacing the legacy week or its bonuses',()=>{
 const previous=weeklySources(existing);
 const result=weeklySources([...existing,sitcom]);
 assert.deepEqual(result.map(f=>f.id),[sitcom.id,...previous.map(f=>f.id)]);
 assert.deepEqual(result.slice(1),previous);
 assert.equal(new Set(result.map(f=>f.id)).size,result.length);
 assert.ok(result.includes(bonus)&&result.includes(bonus11)&&result.includes(bonus12));
});

test('sitcom selection is newest date, then modified time, then stable id',()=>{
 const old=file('[2026-11-12] 오리시트콤 1-3화 제작안.json','old','2026-11-14T00:00:00Z');
 const earlier=file(sitcom.name,'earlier','2026-11-12T00:00:00Z');
 assert.equal(weeklySources([main,old,earlier,sitcom])[0].id,sitcom.id);
 const tie=file(sitcom.name,'aaaa',sitcom.modifiedTime);
 assert.equal(weeklySources([main,sitcom,tie])[0].id,tie.id);
 const next=file('[2026-11-20] 오리시트콤 4-6화 제작안.json','next');
 assert.equal(weeklySources([main,sitcom,next])[0].id,next.id);
});

test('archives, work exports, invalid dates and zero episode numbers stay excluded',()=>{
 const noise=[
  '[수정전_보관본] [2026-11-14] 오리시트콤 1-3화 제작안.json',
  '[2026-11-14] 오리시트콤 1-3화 제작안.orihani-work.json',
  '[2026-11-14] 오리시트콤 1-3화 제작안.json.bak',
  '[2026-11-31] 오리시트콤 1-3화 제작안.json',
  '[2026-11-14] 오리시트콤 0-3화 제작안.json',
  '[2026-11-14] 오리시트콤 1-0화 제작안.json',
 ].map((name,i)=>file(name,'noise'+i));
 noise.push({...file('[2026-11-14] 오리시트콤 4-6화 제작안.json','image'),mimeType:'image/png'});
 assert.deepEqual(weeklySources([...noise,main,sitcom]).map(f=>f.id),[sitcom.id,main.id]);
});

function pack(revision,numbers,prefix=revision){
 return JSON.stringify({format:'orihani-production',version:1,revision,episodes:numbers.map(number=>{
  const title=prefix+' '+number;
  const plan={workflow:'kling4',duration:5,title,location:'room',scenario:'Synthetic motion.',instagramCaption:'caption',hashtags:['#a','#b','#c','#d','#e'],continuity:'same prop',videoPrompt:'Move and settle.',keyframes:[0,5].map((time,i)=>({time,title:'frame '+i,imageTitle:revision+'-'+number+'-'+i,imagePrompt:'synthetic frame',referencePlan:{background:null,props:[]}}))};
  return {number,characterId:'owonjang',episode:{duration:5,title:'[에피소드 '+number+'] '+title,scenario:plan.scenario,korean:'',thumbnail:'',caption:'caption'},plan};
 })});
}

test('Drive reader returns all 16 choices with independent dates and revisions',async()=>{
 const payloads=new Map([
  [main.id,pack('legacy',[28,29,30])],
  [clinic.id,pack('clinic',[1,2],'한의원 쇼츠')],
  [reserve3.id,pack('clinic34',[3,4],'한의원 쇼츠')],
  [reserve5.id,pack('clinic56',[5,6],'한의원 쇼츠')],
  [bonus.id,pack('bonus10',[10],'번외')],
  [bonus11.id,pack('bonus11',[11],'번외')],
  [bonus12.id,pack('bonus12',[12],'번외')],
  [experiment.id,pack('experiment',[1])],
  [sitcom.id,pack('sitcom-v1.7',[1,2,3])],
 ]);
 const reader=createWeeklyReader({key:()=> 'test',fetch:async url=>{
  const u=new URL(url);
  if(u.pathname==='/drive/v3/files')return Response.json({files:[...existing,sitcom]});
  const raw=payloads.get(u.pathname.split('/').at(-1));assert.ok(raw,'only selected source IDs are read');return new Response(raw);
 }});
 const result=await reader();
 assert.equal(result.episodeCount,16);
 assert.equal(result.id,sitcom.id);
 assert.equal(result.date,'2026-11-13');
 assert.equal(result.sources[1].id,main.id);
 assert.equal(result.sources[1].date,'2026-11-01');
 assert.deepEqual(result.sources.map(s=>s.id),[sitcom.id,...existing.map(f=>f.id)]);
 assert.deepEqual(JSON.parse(result.sources[0].text).episodes.map(e=>e.number),[1,2,3]);
 assert.equal(JSON.parse(result.sources[0].text).revision,'sitcom-v1.7');
 assert.equal(JSON.parse(result.sources[1].text).revision,'legacy');
});

test('a newer native Google Doc sitcom replaces the old sitcom while retaining legacy choices',()=>{
 const doc={...file('[2026-11-16] 오리시트콤 1화 제작안.json','nativeSnow'),mimeType:'application/vnd.google-apps.document'};
 const old=file('[2026-11-15] 오리시트콤 1-3화 제작안.json','old-v4');
 const previous=weeklySources(existing);
 const result=weeklySources([...existing,old,doc]);
 assert.deepEqual(result.map(f=>f.id),[doc.id,...previous.map(f=>f.id)]);
 assert.ok(!result.some(f=>f.id===old.id));
 const ignored={...doc,id:'unpublished_abcdefghijklmnopqrst',name:'[작업중] '+doc.name};
 assert.deepEqual(weeklySources([...existing,old,ignored]).map(f=>f.id),[old.id,...previous.map(f=>f.id)]);
});

test('native 30-second sitcom JSON is exported and parsed without reading the withdrawn source',async()=>{
 const doc={...file('[2026-11-16] 오리시트콤 1화 제작안.json','nativeSnow'),mimeType:'application/vnd.google-apps.document'};
 const old=file('[2026-11-15] 오리시트콤 1-3화 제작안.json','old-v4');
 const draft=JSON.parse(pack('snow-doc',[1]));
 const entry=draft.episodes[0];
 entry.episode={...entry.episode,duration:30,videoLayout:'single',captionStyle:'screen',aspectRatio:'9:16',originalVolume:1,captions:[{start:28,end:30,text:'와, 편하다.',source:'screen'}]};
 entry.plan.duration=30;
 entry.plan.keyframes[1].time=30;
 const raw=JSON.stringify(draft),requests=[];
 const reader=createWeeklyReader({key:()=> 'test',fetch:async url=>{
  const u=new URL(url);requests.push(u);
  if(u.pathname==='/drive/v3/files')return Response.json({files:[main,old,doc]});
  if(u.pathname==='/drive/v3/files/'+doc.id+'/export'){
   assert.equal(u.searchParams.get('mimeType'),'text/plain');
   assert.equal(u.searchParams.has('alt'),false);
   return new Response('\uFEFF'+raw+'\n');
  }
  assert.equal(u.pathname,'/drive/v3/files/'+main.id);
  assert.equal(u.searchParams.get('alt'),'media');
  return new Response(pack('legacy',[28,29,30]));
 }});
 const result=await reader();
 assert.equal(result.id,doc.id);
 assert.equal(result.date,'2026-11-16');
 assert.equal(result.episodeCount,4);
 assert.deepEqual(result.sources.map(s=>s.id),[doc.id,main.id]);
 assert.deepEqual(JSON.parse(result.text),JSON.parse(raw));
 assert.equal(requests.length,3);
 assert.ok(requests.every(u=>!u.pathname.includes(old.id)));
});

test('new sitcom episodes are first while earlier active releases and other series keep their identities', () => {
 const next=file('[2026-11-29] 오리시트콤 4-6화 제작안.json','next');
 const oldSingle=file('[2026-11-12] 오리시트콤 2화 제작안.json','oldSingle');
 const oldRange=file('[2026-11-11] 오리시트콤 1-2화 제작안.json','oldRange');
 assert.deepEqual(weeklySources([...existing,sitcom,next,oldSingle,oldRange]).map(f=>f.id),
  [next,sitcom,...existing].map(f=>f.id));
 // A later partial release had intentionally withdrawn an overlapping bundle.
 const revisedSingle=file('[2026-11-18] 오리시트콤 1화 제작안.json','revisedSingle');
 assert.deepEqual(weeklySources([main,next,revisedSingle,sitcom,oldSingle]).map(f=>f.id),
  [next,revisedSingle,main].map(f=>f.id));
});

test('an open picker resolves the new revision of its own series when an episode is renamed', async () => {
 const {readWeeklySources,findWeeklyChoice}=await import('../src/workflow/productionPackage.ts');
 const urls=['https://drive.google.com/file/d/cafe/view','https://drive.google.com/file/d/clinic/view'];
 const clinic=pack('clinic',[4],'한의원 쇼츠');
 const old=readWeeklySources([pack('r2',[4,5,6]),clinic],urls);
 const current=readWeeklySources([pack('r4',[4,5,6]),clinic],urls);
 for(let index=0;index<3;index++){
  const fresh=current[findWeeklyChoice(current,old[index])];
  assert.equal(fresh.prepared.number,index+4);
  assert.equal(fresh.preparedRevision,'r4');
 }
 assert.equal(findWeeklyChoice(current,old[3]),3);
 assert.equal(findWeeklyChoice(current,{...old[0],weeklySourceUrl:'withdrawn',title:'withdrawn'}),-1);
});
