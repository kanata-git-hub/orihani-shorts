type ScriptRow = { start:number; end:number; label:string; text:string; kind:'dialogue'|'narration'|'screen' };

// Google Docs plain-text export puts the three table cells on separate lines.
// Also accept the same table pasted as TSV or saved as Markdown.
export function normalizeScriptTable(text:string):string {
 const cells=text.replace(/\r\n?/g,'\n').replace(/\*\*/g,'').split('\n').flatMap(line=>{
  const value=line.trim();
  if(/^\|?\s*:?-{3,}:?\s*\|/.test(value))return [];
  if(value.startsWith('|')&&value.endsWith('|')){
   const parts=value.slice(1,-1).split(/(?<!\\)\|/).map(s=>s.trim());
   return parts.length>=3?[parts[0],parts[1],parts.slice(2).join(' | ')]:parts;
  }
  return line.split('\t').map(s=>s.trim()).filter(Boolean);
 }).filter(Boolean);
 const header=cells.findIndex((s,i)=>s==='시점'&&cells[i+1]==='캐릭터'&&cells[i+2]==='내용');
 if(header<0)return text;
 const rows:ScriptRow[]=[];
 for(let i=header+3;i<cells.length;i+=3){
  const time=cells[i].match(/^\[?장면\s*\d+\s*\(\s*(\d+(?:\.\d+)?)\s*초?\s*[~～–—-]\s*(\d+(?:\.\d+)?)\s*초\s*\)\]?$/);
  const speaker=cells[i+1],content=cells[i+2];
  if(!time||!speaker||!content||Number(time[2])<=Number(time[1]))throw Error('대사 표의 시점·캐릭터·내용을 확인해주세요. 각 행에 장면 시간과 문구가 필요합니다.');
  const kind=/^(?:나레이션|내레이션|해설)$/.test(speaker)?'narration':/^(?:화면\s*(?:자막|문구)|자막|\(?무대사\)?)$/.test(speaker)?'screen':/^(?:(?:오원장|소미|덕이)\s*(?:대사)?|대사)$/.test(speaker)?'dialogue':undefined;
  if(!kind)throw Error(`대사 표의 화자 '${speaker}'를 확인해주세요. 등장인물·해설·화면 자막·무대사로 구분해주세요.`);
  const row:ScriptRow={start:Number(time[1]),end:Number(time[2]),label:kind==='narration'?'해설':kind==='screen'?'화면 문구':speaker.replace(/\s*대사$/,'')||'대사',text:content,kind};
  // A spoken line and its identical display caption are one caption. Retain the
  // dialogue source so automatic alignment still protects the original audio.
  const key=(s:string)=>s.replace(/^["“']|["”']$/g,'').trim();
  const mirror=rows.findIndex(r=>r.start===row.start&&r.end===row.end&&key(r.text)===key(row.text)&&r.kind!==row.kind&&r.kind!=='narration'&&row.kind!=='narration');
  if(mirror<0)rows.push(row);else if(row.kind==='dialogue')rows[mirror]=row;
 }
 if(!rows.length)throw Error('대사 표에 내용이 없습니다.');
 return [...cells.slice(0,header),...rows.map(r=>`[${r.start}~${r.end}초] ${r.label}: ${r.text}`)].join('\n');
}
