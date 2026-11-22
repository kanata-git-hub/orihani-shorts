import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {createWeeklyReader,WEEKLY_FOLDER} from '../server/workflow/weekly.ts';
import {createWeeklyImagesReader} from '../server/workflow/weeklyImages.ts';
import {readProductionPackage,preparedHistory} from '../src/workflow/productionPackage.ts';
const folderURL='https://drive.google.com/embeddedfolderview?id='+WEEKLY_FOLDER;
const revision='2026-11-29-cafe-ep04-06-r4';
const productionId='1W2X96zTPAy_0norpXkf7zS0eSLCc0Mnb';
const official='[2026-11-29] 오리시트콤 4-6화 제작안.json';
const previousId='17MHX8LG1zl0qF6NEqzZ-znpxNlDVvhwk';
const hash=(b:any)=>createHash('sha256').update(b).digest('hex');
const bytes=new Map();
async function request(url:string) {
 for(let i=0;i<3;i++){
  try{const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Drive status '+r.status);return Buffer.from(await r.arrayBuffer())}
  catch(e){if(i===2)throw e;await new Promise(r=>setTimeout(r,1500));}
 }
 throw Error('unreachable');
}
async function file(id:string){
 if(!bytes.has(id))bytes.set(id,request('https://drive.usercontent.google.com/download?export=download&confirm=t&id='+encodeURIComponent(id)));
 return bytes.get(id);
}
const html=(await request(folderURL)).toString();
const rows=new Map([...html.matchAll(/class="flip-entry" id="entry-([\w-]+)"[\s\S]*?class="flip-entry-title">([^<]*)<\/div>/g)].map(r=>[r[1],r[2]]));
assert.equal(rows.get(productionId),official,'canonical release must be present in the live public folder');
const known=JSON.parse(await fs.readFile(new URL('./expected-sources.json',import.meta.url),'utf8'));
const files=known.map(f=>{const name=rows.get(f.id);assert.ok(name);assert.equal(name,f.id===productionId?official:f.name);return {...f,name};});
const raw=await file(productionId), pack=readProductionPackage(raw.toString());assert.equal(pack.revision,revision);
for(const ep of pack.episodes)for(const asset of Object.values(ep.assets!)){
 assert.ok(rows.has(asset.fileId),'frame is a direct member of the public production folder');
 const data=await file(asset.fileId);assert.equal(hash(data),asset.sha256);
 files.push({id:asset.fileId,name:rows.get(asset.fileId),mimeType:'image/png',size:String(data.length)});
}
const drive=async(input:any)=>{
 const u=new URL(input),id=u.pathname.split('/').at(-1)!;
 if(u.pathname==='/drive/v3/files')return Response.json({files});
 assert.ok(rows.has(id));return new Response(await file(id));
};
const weekly=createWeeklyReader({key:()=>'test-with-public-data',fetch:drive});
const images=createWeeklyImagesReader({key:()=>'test-with-public-data',weekly,fetch:drive});
const catalog=await weekly(true);assert.equal(catalog.id,productionId);assert.equal(catalog.episodeCount,19);
assert.ok(rows.has(previousId));const old=readProductionPackage((await file(previousId)).toString());
const oldItem=preparedHistory(old.episodes[0],old.revision);
const testDirectory=path.resolve('.release-browser');await fs.mkdir(testDirectory,{recursive:true});
await fs.writeFile(path.join(testDirectory,'auth.ts'),"export const auth={app:{options:{projectId:'release-browser'}},authStateReady:async()=>{},currentUser:{uid:'test-user',getIdToken:async()=>'test-scope'}};");
await fs.writeFile(path.join(testDirectory,'index.html'),'<!doctype html><html lang="ko"><meta charset="utf-8"><div id="root"></div><script type="module" src="/.release-browser/home.tsx"></script></html>');
await fs.writeFile(path.join(testDirectory,'home.tsx'),`
import React from 'react';import {createRoot} from 'react-dom/client';import App from '../src/pages/Home';import {bindAccount,accountKey} from '../src/accountSession';
bindAccount('release-browser','test-user');const key=accountKey('pov_director_history');if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify([await (await fetch('/qa-prior')).json()]));createRoot(document.getElementById('root')!).render(<App/>);`);
const apiHits:string[]=[];
const server=await createServer({configFile:false,esbuild:{jsx:'automatic'},server:{host:'127.0.0.1',port:4179,strictPort:true},plugins:[{name:'local-test-auth',enforce:'pre',resolveId(id){if(id.endsWith('/lib/firebase'))return path.join(testDirectory,'auth.ts');},configureServer(s){
 s.middlewares.use(async(req,res,next)=>{
  const u=new URL(req.url!,'http://localhost');if(u.pathname==='/qa-prior'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(oldItem));}
  if(!u.pathname.startsWith('/api/'))return next();
  try{
   assert.equal(req.headers.authorization,'Bearer test-scope');apiHits.push(u.pathname);
   const m=u.pathname.match(/^\/api\/editor\/weekly\/(\d+)\/images$/);
   const result=m?await images(Number(m[1]),u.searchParams.get('revision')!):u.pathname==='/api/editor/weekly'?await weekly(u.searchParams.has('refresh')):null;
   assert.ok(result,'Only production read APIs are allowed');res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));
  }catch(e){res.statusCode=500;res.end(JSON.stringify({error:String(e)}));}
 });
}}]});
await server.listen();const browser=await chromium.launch({headless:true});
try{
 const ctx=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});const page=await ctx.newPage();page.setDefaultTimeout(35000);
 page.on('pageerror',e=>console.error('pageerror',e.message));
 await page.route('**/*',route=>{const u=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
 await page.goto('http://127.0.0.1:4179/.release-browser/index.html');
 for(const ep of pack.episodes){
  const picker=page.getByRole('combobox',{name:'만들 에피소드'});await picker.waitFor();const options=picker.locator('option');await options.first().waitFor({state:'attached'});
  assert.equal(await options.count(),19);assert.deepEqual((await options.allTextContents()).slice(0,3),pack.episodes.map(v=>v.plan.title));assert.equal((await options.allTextContents()).filter(t=>t===ep.plan.title).length,1);
  await picker.selectOption({label:ep.plan.title});await page.getByRole('button',{name:'이 제작안으로 시작',exact:true}).click();
  const k=page.locator('.ori-kling4');await k.getByText('이미지 '+ep.plan.keyframes.length+'/'+ep.plan.keyframes.length+'장 준비',{exact:true}).waitFor({timeout:90000});
  for(const [i,f] of ep.plan.keyframes.entries()){
   await k.getByRole('group',{name:'주요장면 이미지'}).getByRole('button').nth(i).click();const visible=k.locator('.ori-image-preview-open img');
   const src=await visible.getAttribute('src');assert.equal(hash(Buffer.from(src!.split(',')[1],'base64')),ep.assets![f.imageTitle].sha256);
   assert.equal(await visible.getAttribute('alt'),f.title);
  }
  await k.getByText('콘티·장면별 시간',{exact:true}).click();assert.ok((await k.locator('.ori-weekly-outline p').innerText()).includes(ep.plan.scenario.slice(0,25)));
  await k.getByRole('button',{name:'전체 영상 프롬프트 복사',exact:true}).click();
  const copied=await page.evaluate(()=>navigator.clipboard.readText());assert.equal(copied,ep.plan.videoPrompt);
  await k.getByRole('button',{name:'완성 영상 편집하기',exact:true}).click();await page.getByRole('button',{name:'2. 자막',exact:true}).click();
  const txt=page.locator('.ori-editor textarea[maxlength="160"]');const values=await txt.evaluateAll(els=>els.map(x=>(x as HTMLTextAreaElement).value));
  assert.deepEqual(values,ep.episode.captions.map(c=>c.text));const times=await page.locator('.ori-caption-heading span').allTextContents();
  assert.deepEqual(times,ep.episode.captions.map(c=>c.start.toFixed(2)+'–'+c.end.toFixed(2)+'초'));
  console.log('Browser validated episode',ep.number,'edition',revision,'images',ep.plan.keyframes.length,'promptSHA256',hash(copied),'captions',values.length);
  await page.locator('.ori-desktop-nav').getByRole('button',{name:'15초 기획',exact:true}).click();
 }
 const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('pov_director_history:'+JSON.stringify(['release-browser','test-user']))!));
 assert.equal(history.length,4);assert.deepEqual(history.find(i=>i.id===oldItem.id),oldItem);assert.equal(apiHits.filter(x=>x.endsWith('/images')).length,3);
 console.log('19 choices, 16 existing episodes, independent older history and all three episode editor flows validated. Actual public source SHA256:',hash(raw));
}finally{await browser.close();await server.close();}
