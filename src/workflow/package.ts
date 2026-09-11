import { HistoryItem, SourceEpisode } from '../types';
import { extractClips, extractOverview } from '../utils/extractors';

export const MAX_PACKAGE_BYTES = 48 * 1024 * 1024;
const text = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
export function sourceEpisode(v: any): SourceEpisode {
  if (!v || ![5,15].includes(v.duration) || !text(v.korean,20000) || !text(v.scenario,40000) || !text(v.title,1000) || !text(v.thumbnail,3000) || !text(v.caption || '',5000)) throw Error('주간 대본의 형식을 확인해주세요.');
  return {duration:v.duration,title:v.title,korean:v.korean,scenario:v.scenario,thumbnail:v.thumbnail,caption:v.caption||''};
}
export function recordDuration(item: HistoryItem): 5|15 {
  if(item.duration!==undefined){if(item.duration!==5&&item.duration!==15)throw Error('5초 또는 15초 기획을 선택해주세요.');return item.duration;}
  const n=extractClips(item.result).length;
  if(n!==2&&n!==4)throw Error('2개 또는 4개 클립이 있는 기획을 선택해주세요.');
  return n===2?5:15;
}
export function editorEpisode(item: HistoryItem): SourceEpisode {
  const clips=extractClips(item.result),overview=extractOverview(item.result);
  const source=item.episode || {duration:recordDuration(item), title:overview.title||'이전 기획', korean:'', thumbnail:'', caption:'', scenario:overview.scenario||''};
  // Use explicit source narration only. A visual scenario is never guessed as narration.
  return {...source,scenario:source.scenario+'\n'+clips.map(c=>c.videoPrompt).join('\n')};
}
export function makePackage(item: HistoryItem, images: Record<string,string>) {
  const value={format:'orihani-work',version:1,item,images};
  return JSON.stringify(readPackage(JSON.stringify(value)));
}
export function readPackage(raw: string): {format:'orihani-work';version:1;item:HistoryItem;images:Record<string,string>} {
  if(raw.length>MAX_PACKAGE_BYTES)throw Error('작업 파일이 너무 큽니다. 48MB 이하 파일을 사용해주세요.');
  let v:any;try{v=JSON.parse(raw);}catch{throw Error('오리쇼츠에서 내보낸 작업 파일을 선택해주세요.');}
  const i=v?.item;
  if(v?.format!=='orihani-work'||v.version!==1||!i||!text(i.id,200)||!i.id||!Number.isFinite(i.timestamp)||!text(i.result,200000)||!['deoki','owonjang','nurse'].includes(i.characterId))throw Error('오리쇼츠 작업 파일의 내용이 올바르지 않습니다.');
  const duration=recordDuration(i);
  if(extractClips(i.result).length!==(duration===5?2:4))throw Error('영상 길이와 클립 수가 맞지 않습니다.');
  if(extractClips(i.result).some(c=>!text(c.imageTitle,500)||!c.imageTitle||!text(c.imagePrompt,30000)||!text(c.videoPrompt,30000)))throw Error('클립의 사진과 프롬프트 정보를 확인해주세요.');
  const overview=extractOverview(i.result),clips=extractClips(i.result);
  if(!text(overview.title,1000)||!text(overview.scenario,40000)||!text(overview.location,3000)||!text(overview.instagramCaption,5000)||!Array.isArray(overview.hashtags)||overview.hashtags.some((s:unknown)=>!text(s,500)))throw Error('기획의 제목과 본문 형식을 확인해주세요.');
  if(new Set(clips.map(c=>c.imageTitle)).size!==clips.length||clips.some(c=>['__proto__','constructor','prototype'].includes(c.imageTitle)||!text(c.title,1000)))throw Error('서로 다른 장면 이름이 필요합니다.');
  const item:HistoryItem={id:i.id,timestamp:i.timestamp,characterId:i.characterId,result:i.result,duration};
  if(i.episode)item.episode=sourceEpisode(i.episode);
  if(item.episode&&item.episode.duration!==duration)throw Error('대본과 기획의 영상 길이가 다릅니다.');
  if(i.editorKey!==undefined){if(!text(i.editorKey,200)||!i.editorKey)throw Error('편집 연결 정보를 확인해주세요.');item.editorKey=i.editorKey;}
  if(i.customPrompt!==undefined){if(!text(i.customPrompt,40000))throw Error('제작 방향이 너무 깁니다.');item.customPrompt=i.customPrompt;}
  const names=new Set(extractClips(item.result).map(c=>c.imageTitle));const images:Record<string,string>={};
  if(!v.images||typeof v.images!=='object'||Array.isArray(v.images))throw Error('사진 목록이 없습니다.');
  for(const [name,url] of Object.entries(v.images)) {
    if(!names.has(name)||['__proto__','constructor','prototype'].includes(name)||!text(url,16000000)||!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(url as string))throw Error('기획과 연결된 사진 형식을 확인해주세요.');
    images[name]=url as string;
  }
  return {format:'orihani-work',version:1,item,images};
}
export function importIdentity(item:HistoryItem, existing:HistoryItem[]):HistoryItem {
  const same=existing.find(h=>h.id===item.id);
  if(!same)return item;
  // Re-imports and changed copies get separate identities; never overwrite a local edit.
  return {...item,id:crypto.randomUUID(),editorKey:undefined};
}
