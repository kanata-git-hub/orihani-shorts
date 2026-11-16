const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map();
function compile(rel){
  if(cache.has(rel))return cache.get(rel);
  const m={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true},
  }).outputText;
  new Function('require','module','exports',code)(name=>name.startsWith('.')
    ?compile(path.join(path.dirname(rel),name)+'.ts'):require(name),m,m.exports);
  cache.set(rel,m.exports);return m.exports;
}
const {validateThumbnailSettings,defaultThumbnailTitle}=compile('src/thumbnail/settings.ts');
const {thumbnailDimensions,containImageRect,layoutThumbnailTitle,assertLocalThumbnailImage}=compile('src/thumbnail/render.ts');
const images=['첫 장면','마지막 장면'];
const settings=(patch={})=>({imageTitle:images[0],title:'딱 한 입만',showTitle:true,position:'top',...patch});
const measure=(text,fontSize)=>Array.from(text).reduce((width,ch)=>width+fontSize*(ch===' '?0.3:0.9),0);
const noWhitespace=text=>text.replace(/\s/g,'');

test('thumbnail settings are optional, explicit and tied to an existing image',()=>{
  assert.equal(validateThumbnailSettings(undefined,images),undefined);
  const value=settings();assert.deepEqual(validateThumbnailSettings(value,images),value);
  assert.deepEqual(validateThumbnailSettings(settings({showTitle:false,title:'',position:'bottom'}),images),settings({showTitle:false,title:'',position:'bottom'}));
  assert.throws(()=>validateThumbnailSettings(settings(),[]));
  for(const value of [null,[],true,'title',{},settings({imageTitle:'다른 장면'}),settings({imageTitle:4}),settings({showTitle:'true'}),settings({position:'middle'}),settings({title:7}),{...settings(),caption:'spoken dialogue'}]){
    assert.throws(()=>validateThumbnailSettings(value,images));
  }
});

test('thumbnail text limits reject loss of meaning instead of truncating it',()=>{
  const eighty='가'.repeat(80);
  assert.equal(validateThumbnailSettings(settings({title:eighty}),images).title,eighty);
  assert.equal(validateThumbnailSettings(settings({title:'😀'.repeat(80)}),images).title,'😀'.repeat(80));
  const multiline='여기서 기다려\n딱 한 입만';
  assert.equal(validateThumbnailSettings(settings({title:multiline}),images).title,multiline);
  for(const title of ['가'.repeat(81),'😀'.repeat(81),'첫 줄\n둘째 줄\n셋째 줄','  ','한\u0000입','한\t입','한\u202e입']){
    assert.throws(()=>validateThumbnailSettings(settings({title}),images));
  }
  for(const title of ['가'.repeat(81),'첫 줄\n둘째 줄\n셋째 줄','한\u0000입']){
    assert.throws(()=>validateThumbnailSettings(settings({title,showTitle:false}),images));
  }
});

test('default title removes episode metadata but does not invent or clip a headline',()=>{
  assert.equal(defaultThumbnailTitle('[에피소드 12] 12화 딱 한 입만 (하찮은 오리 일상)'),'딱 한 입만');
  assert.equal(defaultThumbnailTitle('번외 03화 여기서 기다려'),'여기서 기다려');
  assert.equal(defaultThumbnailTitle('  이미 정한 제목  '),'이미 정한 제목');
  assert.equal(defaultThumbnailTitle('제12화라는 가게'),'제12화라는 가게');
  assert.equal(defaultThumbnailTitle('가'.repeat(81)),'');
  assert.equal(defaultThumbnailTitle('첫 줄\n둘째 줄\n셋째 줄'),'');
  assert.equal(defaultThumbnailTitle(''),'');
});

test('both output ratios retain the whole source image with centered letterboxing',()=>{
  assert.deepEqual(thumbnailDimensions('9:16'),{width:1080,height:1920});
  assert.deepEqual(thumbnailDimensions('16:9'),{width:1920,height:1080});
  for(const target of [thumbnailDimensions('9:16'),thumbnailDimensions('16:9')]){
    for(const [imageWidth,imageHeight] of [[1080,1920],[1920,1080],[1000,1000],[4032,3024]]){
      const rect=containImageRect(imageWidth,imageHeight,target.width,target.height);
      assert.ok(rect.x>=0&&rect.y>=0,'source must never extend beyond the output frame');
      assert.ok(rect.x+rect.width<=target.width+1e-6);
      assert.ok(rect.y+rect.height<=target.height+1e-6);
      assert.ok(Math.abs(rect.width/rect.height-imageWidth/imageHeight)<1e-10,'source proportions must remain unchanged');
      assert.ok(Math.abs(rect.x*2+rect.width-target.width)<1e-6);
      assert.ok(Math.abs(rect.y*2+rect.height-target.height)<1e-6);
      assert.ok(Math.abs(rect.width-target.width)<1e-6||Math.abs(rect.height-target.height)<1e-6,'contain should use all available width or height');
    }
  }
  for(const input of [[0,100,1080,1920],[100,-1,1080,1920],[Infinity,100,1080,1920],[100,100,NaN,1920]]){
    assert.throws(()=>containImageRect(...input));
  }
});

test('Korean title layout preserves manual lines and autowraps without losing characters',()=>{
  for(const aspect of ['9:16','16:9']){
    const {width,height}=thumbnailDimensions(aspect);
    for(const position of ['top','bottom']){
      for(const title of ['딱 한 입만','여기서 기다려\n딱 한 입만','오늘은 정말 아무것도 하기 싫은 날']){
        const layout=layoutThumbnailTitle(title,width,height,position,measure);
        assert.ok(layout.lines.length>=1&&layout.lines.length<=2);
        assert.equal(noWhitespace(layout.lines.join('')),noWhitespace(title));
        if(title.includes('\n'))assert.deepEqual(layout.lines,title.split('\n'));
        assert.ok(layout.fontSize>=(aspect==='9:16'?72:64));
        assert.ok(layout.fontSize<=(aspect==='9:16'?132:112));
        assert.ok(layout.lines.every(line=>measure(line,layout.fontSize)+layout.strokeWidth*2<width),'text outline must fit with room for safe margins');
        assert.ok(layout.x>0&&layout.x<width);
        assert.ok(layout.y>0&&layout.y+layout.lines.length*layout.lineHeight<height);
        assert.ok(layout.gradientStart>=0&&layout.gradientEnd<=height);
        assert.ok(layout.gradientStart<=layout.y&&layout.gradientEnd>=layout.y+layout.lines.length*layout.lineHeight);
        assert.ok(layout.gradientEnd-layout.gradientStart<height/2,'gradient remains confined to the title area');
        assert.ok(position==='top'?layout.y<height/2:layout.y>height/2);
      }
    }
  }
});

test('text that cannot fit at the minimum readable font size fails rather than exporting clipped text',()=>{
  for(const aspect of ['9:16','16:9']){
    const {width,height}=thumbnailDimensions(aspect);
    assert.throws(()=>layoutThumbnailTitle('가'.repeat(80),width,height,'top',measure));
    assert.throws(()=>layoutThumbnailTitle('첫 줄\n둘째 줄\n셋째 줄',width,height,'top',measure));
    assert.throws(()=>layoutThumbnailTitle('  ',width,height,'top',measure));
    assert.throws(()=>layoutThumbnailTitle('한 글자',width,height,'top',()=>Infinity));
  }
});

test('thumbnail image input never permits remote requests or active SVG content',()=>{
  for(const source of ['data:image/png;base64,AAAA','data:image/jpeg;base64,AAAA','data:image/webp;base64,AAAA','blob:https://example.test/local-image-id','blob:null/local-image-id']){
    assert.doesNotThrow(()=>assertLocalThumbnailImage(source));
  }
  for(const source of ['https://example.test/photo.png','//example.test/photo.png','/api/images/private','data:image/svg+xml;base64,AAAA','data:text/html;base64,AAAA','javascript:alert(1)','data:image/png;base64,not image data','blob:']){
    assert.throws(()=>assertLocalThumbnailImage(source));
  }
});
