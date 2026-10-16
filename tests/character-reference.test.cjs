const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const compile=(rel,imports={})=>{const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(name=>name.endsWith('/authFetch')?{authFetch:(...args)=>fetch(...args)}:imports[name]||(name.startsWith('.')?compile(path.join(path.dirname(rel),name)+'.ts',imports):require(name)),m,m.exports);return m.exports;};
const policy=compile('src/characterReference.ts');
const backgrounds=compile('src/backgroundAssets.ts',{'./utils/extractors':compile('src/utils/extractors.ts')});
const episodeReference=compile('src/sceneReference.ts',{'./utils/extractors':compile('src/utils/extractors.ts'),'./characterReference':policy});
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const originals=Array.from({length:9},(_,i)=>({url:png,label:['오원장','소미','덕이'][Math.floor(i/3)]+' '+['Front','Side','Back'][i%3]}));
// Read the checked-in catalog and actual PNG bytes: the request must contain
// originals, not just filenames, shared placeholder images or the selected hero.
function realCatalog(){
 const source=fs.readFileSync(path.join(root,'src/constants.ts'),'utf8');
 const images=Object.fromEntries([...source.matchAll(/import (\w+) from '(\.\/[^']+\.png)'/g)].map(([,name,file])=>[name,file]));
 return [...source.matchAll(/\{ id: '([^']+)', name: '([^']+)', file: '([^']+)', img: \w+, imgs: \[([^\]]+)\]/g)].map(([,id,name,file,imgs])=>({id,name,file,imgs:imgs.split(',').map(x=>images[x.trim()])}));
}
test('real Gemini request attaches all three original views for Dr.O and Korean-only 소미 alongside 덕이',async()=>{
 const catalog=realCatalog();assert.equal(catalog.length,3);
 const requests=[],loaded=[],old=global.fetch;
 const {useMediaGeneration}=compile('src/hooks/useMediaGeneration.ts',{
  react:{useRef:v=>({current:v})},'../constants':{CHARACTERS:catalog},
  '../utils/db':{db:{get:async()=>({images:{}}),setImageChecks:async()=>{}}},
 });
 const hook=useMediaGeneration(()=>{},async()=>{},'record',()=>{},{},()=>{},{},'deoki');
 try{
  global.fetch=async(url,options)=>{
   if(url==='/api/generate-image'){requests.push(JSON.parse(options.body));return Response.json({result:png,review:{status:'pass',issues:[]}});}
   loaded.push(url);return new Response(fs.readFileSync(path.join(root,'src',url)),{headers:{'Content-Type':'image/png'}});
  };
  for(const [prompt,ids] of [['Deok-i sits beside Dr.O.',['owonjang','deoki']],['덕이와 소미가 나란히 앉아 있다.',['nurse','deoki']],['Dr. O, Somi and Deoki.',['owonjang','nurse','deoki']]]){
   loaded.length=0;assert.equal(await hook.handleGenerateImage('frame',prompt,0,[]),true);
   const expected=catalog.filter(c=>ids.includes(c.id)).flatMap(c=>c.imgs);
   assert.deepEqual(loaded,expected);
   const parts=requests.at(-1).parts;
   assert.deepEqual(parts.filter(p=>p.inlineData).map(p=>p.inlineData.data),expected.map(file=>fs.readFileSync(path.join(root,'src',file)).toString('base64')));
   assert.equal(parts.filter(p=>p.text?.startsWith('[ORIGINAL CHARACTER DESIGN SHEET:')).length,ids.length*3);
   assert.match(parts.at(-1).text,/Do not add eyelids/);
  }
  // A failed secondary character view must stop before any provider request.
  const count=requests.length;
  global.fetch=async url=>url===catalog[0].imgs[1]?new Response('missing',{status:404}):new Response(Buffer.from(png.split(',')[1],'base64'),{headers:{'Content-Type':'image/png'}});
  assert.equal(await hook.handleGenerateImage('frame','Deok-i and Dr.O',0,[]),false);
  assert.equal(requests.length,count);
  await assert.rejects(policy.loadCharacterReferences('소미',[{...catalog[1],imgs:catalog[1].imgs.slice(0,2)}],'nurse'),/원본 3장/);
 }finally{global.fetch=old;}
});
test('name aliases share identity rules without matching unrelated word fragments',()=>{
 for(const name of ['오원장','오 원장','O-wonjang','O Wonjang','Owonjang','Dr.O','Dr. O','Dr O','DrO','Doctor O'])assert.deepEqual(policy.characterIdsInText(name),['owonjang']);
 for(const name of ['소미','간호사','Somi','nurse'])assert.deepEqual(policy.characterIdsInText(name),['nurse']);
 for(const name of ['덕이','Deok-i','Deok i','Deoki','Deok‑i'])assert.deepEqual(policy.characterIdsInText(name),['deoki']);
 assert.deepEqual(policy.characterIdsInText('drop SOMIthing deokindle'),[]);
 assert.match(policy.characterReferencePolicy(['Dr.O']),/O-wonjang: pale/);
 assert.match(policy.characterReferencePolicy(['소미']),/smooth head with no invented hair/);
});
test('all nine design sheets survive the previous-scene reference and override conflicting hand instructions',()=>{
 const parts=policy.buildReferenceParts([...originals,{url:png,role:'scene'}],'Copy the previous yellow feathered fingers exactly.');
 assert.equal(parts.filter(p=>p.inlineData).length,10);
 assert.equal(parts.filter(p=>p.text?.startsWith('[ORIGINAL CHARACTER DESIGN SHEET:')).length,9);
 assert.match(parts.at(-1).text,/HIGHEST VISUAL PRIORITY/);assert.match(parts.at(-1).text,/O-wonjang: pale warm cream/);assert.match(parts.at(-1).text,/Somi: pale cream/);assert.match(parts.at(-1).text,/Deok-i: keep his own ORIGINAL yellow/);
 assert.match(parts[18].text,/NOT a character design reference/);assert.match(parts.at(-1).text,/No added fingers/);
 assert.throws(()=>policy.buildReferenceParts([{url:png,role:'scene'}],'x'),/원본/);
 assert.throws(()=>policy.buildReferenceParts(Array.from({length:15},()=>originals[0]),'x'),/14장/);
});
test('one character does not receive another character\'s color rule',()=>{
 const text=policy.buildReferenceParts(originals.slice(0,3),'x').at(-1).text;
 assert.match(text,/O-wonjang: pale/);assert.doesNotMatch(text,/Somi:|Deok-i:/);
});
test('failed and non-image reference downloads stop before generation',async()=>{
 const old=global.fetch;
 try{global.fetch=async()=>new Response('missing',{status:404});await assert.rejects(policy.loadReferenceImage('/missing.png'),/원본 사진/);
 global.fetch=async()=>new Response('<html>login</html>',{headers:{'Content-Type':'text/html'}});await assert.rejects(policy.loadReferenceImage('/bad.png'),/올바른 사진/);
 global.fetch=async()=>new Response(Buffer.from(png.split(',')[1],'base64'),{headers:{'Content-Type':'image/png'}});assert.equal(await policy.loadReferenceImage('/ok.png'),png);
 assert.throws(()=>policy.referenceData('data:text/html;base64,AAAA'),/참조 사진/);
 }finally{global.fetch=old;}
});
if(fs.existsSync(path.join(root,'src/hooks/useMediaGeneration.ts')))test('meme generator sends named originals with a lower-priority previous scene and stops on missing assets',async()=>{
 const calls=[],toasts=[];const old=global.fetch;
 const {handleGenerateImage}=compile('src/hooks/useMediaGeneration.ts',{'react':{useRef:v=>({current:v})},'../utils/db':{db:{setImageChecks:async()=>{},get:async()=>({images:{first:png}})}},'../constants':{CHARACTERS:[{id:'owonjang',name:'오원장',file:'오원장.png',imgs:['front.png','side.png','back.png']}]},'../characterReference':policy,'../backgroundAssets':backgrounds,'../sceneReference':episodeReference}).useMediaGeneration(msg=>toasts.push(msg),async()=>{},'record',()=>{},{},()=>{}, {},'owonjang');
 try{global.fetch=async(url,options)=>{calls.push(url);return url==='/api/generate-image'?(calls.push(JSON.parse(options.body)),Response.json({result:png,review:{status:'pass',issues:[]}})):new Response(Buffer.from(png.split(',')[1],'base64'),{headers:{'Content-Type':'image/png'}});};
 assert.equal(await handleGenerateImage('second','O-wonjang holding toothpaste',1,[{title:'first',prompt:'old'}]),true);
 const request=calls.find(x=>typeof x==='object');assert.equal(request.parts.filter(p=>p.inlineData).length,4);assert.match(request.parts.at(-1).text,/O-wonjang: pale warm cream/);
 calls.length=0;global.fetch=async url=>{calls.push(url);return new Response('missing',{status:404});};assert.equal(await handleGenerateImage('third','O-wonjang',0,[]),false);assert.ok(!calls.includes('/api/generate-image'));assert.ok(toasts.length);
 }finally{global.fetch=old;}
});
if(fs.existsSync(path.join(root,'src/services/thumbnail/geminiService.ts')))test('marketing generation forwards every original and the final identity policy to Gemini',async()=>{
 let request;const service=compile('src/services/thumbnail/geminiService.ts',{'../geminiClient':{getGeminiClient:()=>({models:{generateContent:async r=>{request=r;return {candidates:[{content:{parts:[{inlineData:{data:png.split(',')[1]}}]}}]};}}})},'../../characterReference':policy});
 // The existing request timeout is unrelated to this immediate mocked response.
 const originalTimeout=global.setTimeout;global.setTimeout=(fn,ms,...args)=>{const t=originalTimeout(fn,ms,...args);if(ms===180000)t.unref();return t;};
 try{assert.equal(await service.generateImage({model:'gemini-3.1-flash-image',prompt:'Draw yellow fingers',referenceImages:[...originals,{url:png,role:'scene'}]}),png);assert.equal(request.contents.parts.filter(p=>p.inlineData).length,10);assert.match(request.contents.parts.at(-1).text,/O-wonjang: pale warm cream/);}finally{global.setTimeout=originalTimeout;}
});
