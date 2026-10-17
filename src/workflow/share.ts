export function downloadFile(file:File) {
  const url=URL.createObjectURL(file),a=document.createElement('a');
  a.href=url;a.download=file.name;a.hidden=true;document.body.appendChild(a);
  try{a.click();}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
}
export async function shareFile(file:File) {
  if(navigator.canShare?.({files:[file]})) {
    try{await navigator.share({files:[file],title:file.name});return;}catch(e){if((e as Error).name==='AbortError')return;}
  }
  downloadFile(file);
}
export function imageFile(data:string,name:string):File {
  const match=data.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if(!match)throw Error('사진을 다시 불러와주세요.');
  const bytes=Uint8Array.from(atob(match[2]),s=>s.charCodeAt(0));
  return new File([bytes],name+'.'+({ 'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[match[1]]),{type:match[1]});
}

/** Human-readable image names shared by keyframe and legacy download controls. */
export function sceneImageName(title: string, sceneNumber: number, sourceTitle = ''): string {
  const raw = sourceTitle.trim() || title.trim();
  const marker = raw.match(/\[에피소드\s*(\d+)\]/);
  let clean = raw.replace(/\[에피소드\s*\d+\]\s*/g, '')
    .replace(/\s*\(하찮은 오리 일상\)\s*$/, '').trim();
  const bonus = clean.match(/^번외\s*(\d+)\s*(?:화)?\s*/);
  const main = clean.match(/^(\d+)\s*화\s*/);
  if (bonus) clean = '번외 ' + bonus[1].padStart(2, '0') + ' ' + clean.slice(bonus[0].length);
  else if (main) clean = Number(main[1]) + '화 ' + clean.slice(main[0].length);
  else if (marker) clean = Number(marker[1]) + '화 ' + clean;
  clean = clean.normalize('NFC').replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '').slice(0, 120).trim();
  return (clean || '오리쇼츠') + ' ' + String(Math.max(1, Math.trunc(sceneNumber))).padStart(2, '0');
}
