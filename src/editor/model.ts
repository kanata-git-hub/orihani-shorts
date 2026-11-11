import type { VoiceSegment } from './speech';
import { cleanVideoText } from './text';
import { normalizeScriptTable, isCaptionPlaceholder } from './script';
export type Caption = { start: number; end: number; text: string; source?: 'narration' | 'dialogue' | 'screen'; review?: string };
export type EditPlan = { duration: 5 | 12 | 15 | 30; videoLayout?: 'single' | 'legacy-clips'; captionStyle?: 'clinic' | 'legacy' | 'screen' | 'korean'; koreanTitlePreset?: 'balanced' | 'wide'; headline?: [string, string]; aspectRatio?: '9:16' | '16:9'; clinicBrandStart?: number; title: string; narration: string; thumbnail: string; captions: Caption[]; originalVolume: number; voiceVolume: number; voiceSpeed: number; voiceSegments?: VoiceSegment[]; dialogueRanges?: {start:number;end:number}[]; importWarning?: string };
// A missing style is legacy so saved drafts keep their original behavior.
export const isKoreanPlan = (p: EditPlan) => p.captionStyle === 'korean';
export const isClinicPlan = (p: EditPlan) => p.captionStyle === 'clinic';
// Manual screen captions use the supplied sound and timings; no paid speech step.
export const isDirectPlan = (p: EditPlan) => isClinicPlan(p) || isKoreanPlan(p) || p.captionStyle === 'screen';
export const defaultPlan = (): EditPlan => ({ duration: 5, title: '', narration: '', thumbnail: '', captions: [], originalVolume: 0.2, voiceVolume: 1, voiceSpeed: 1 });
export function cleanPlanText(p: EditPlan): EditPlan {
  return { ...p, ...(p.headline ? { headline: p.headline.map(t => cleanVideoText(t).replace(/\s+/g, ' ').trim()) as [string, string] } : {}), title: cleanVideoText(p.title), narration: cleanVideoText(p.narration), thumbnail: cleanVideoText(p.thumbnail), captions: p.captions.map(c => ({ ...c, text: cleanVideoText(c.text) })).filter((c, i) => !isCaptionPlaceholder(c.text) && (c.text || !p.captions[i].text.trim())) };
}
export function validatePlan(p: EditPlan) {
  if (!p || ![5, 12, 15, 30].includes(p.duration)) throw Error('영상 길이를 확인해주세요.');
  if (p.videoLayout !== undefined && !['single','legacy-clips'].includes(p.videoLayout)) throw Error('영상 입력 방식을 확인해주세요.');
  if (p.captionStyle !== undefined && !['clinic','legacy','screen','korean'].includes(p.captionStyle)) throw Error('자막 스타일을 확인해주세요.');
  if (p.koreanTitlePreset !== undefined && (!isKoreanPlan(p) || !['balanced','wide'].includes(p.koreanTitlePreset))) throw Error('한국판 제목 크기를 확인해주세요.');
  if (p.aspectRatio !== undefined && !['9:16','16:9'].includes(p.aspectRatio)) throw Error('화면 비율을 확인해주세요.');
  if (isClinicPlan(p) && p.aspectRatio === '16:9') throw Error('한의원 쇼츠 자막은 세로 9:16 영상에 사용해주세요.');
  if (isDirectPlan(p) && (p.videoLayout !== 'single' || (typeof p.narration === 'string' && p.narration.trim()) || p.voiceSegments?.length)) throw Error(`${isClinicPlan(p) ? '한의원' : '화면'} 자막은 완성 영상 한 개에 넣습니다. 해설 음성이 필요하면 기존 편집을 선택해주세요.`);
  if (isKoreanPlan(p)) {
    if (![12, 15].includes(p.duration) || p.aspectRatio !== '9:16') throw Error('한국판은 12초 또는 15초 · 세로 9:16 · 1080×1920으로 제작해주세요.');
    if (!Array.isArray(p.headline) || p.headline.length !== 2 || p.headline.some(t => typeof t !== 'string' || !t.trim() || t.length > 80 || /[\r\n]/.test(t))) throw Error('영상에 계속 표시할 제목 두 줄을 입력해주세요.');
    if (!Array.isArray(p.captions) || !p.captions.length) throw Error('한국판에는 문구와 시간이 정해진 화면 자막이 필요합니다.');
    if (p.originalVolume !== 1) throw Error('한국판은 원본 음량 100%를 유지합니다.');
  }
  if (p.captionStyle === 'screen' && p.originalVolume !== 1) throw Error('화면 자막 모드는 원본 음량 100%를 유지합니다.');
  if (p.clinicBrandStart !== undefined && (!isClinicPlan(p) || !Number.isFinite(p.clinicBrandStart) || p.clinicBrandStart < 0 || p.clinicBrandStart >= p.duration + 0.5)) throw Error('하단 한의원명 시작 시간을 확인해주세요.');
  if([12,30].includes(p.duration)&&p.videoLayout==='legacy-clips')throw Error(`${p.duration}초는 전체 영상 한 개를 넣어주세요.`);
  if (typeof p.thumbnail !== 'string' || p.thumbnail.length > 100 || typeof p.title !== 'string' || p.title.length > 300) throw Error('제목 문구가 너무 깁니다.');
  if (!Array.isArray(p.captions) || p.captions.length > 30) throw Error('자막은 30개까지 가능합니다.');
  let last = 0;
  for (const c of p.captions) {
    if (!Number.isFinite(c.start) || !Number.isFinite(c.end) || c.start < last || c.end <= c.start || c.end > p.duration + (isDirectPlan(p) && !isKoreanPlan(p) ? 0.5 : 0) || typeof c.text !== 'string' || !c.text.trim() || c.text.length > 160) throw Error('자막의 시작·끝 시간과 문구를 확인해주세요. 자막 시간은 겹칠 수 없습니다.');
    last = c.end;
  }
  for (const k of ['originalVolume', 'voiceVolume'] as const) if (!Number.isFinite(p[k]) || p[k] < 0 || p[k] > 1) throw Error('음량은 0~100%로 설정해주세요.');
  if (!Number.isFinite(p.voiceSpeed) || p.voiceSpeed < 0.8 || p.voiceSpeed > 1.25) throw Error('음성 속도는 0.8~1.25배로 설정해주세요.');
  if(typeof p.narration!=='string'||p.narration.length>1200)throw Error('해설 대본은 1,200자까지 가능합니다.');
  if((p.voiceSegments!==undefined&&!Array.isArray(p.voiceSegments))||(p.dialogueRanges!==undefined&&!Array.isArray(p.dialogueRanges)))throw Error('음성 구간 형식을 확인해주세요.');
  for(const s of p.voiceSegments || []) if(!Number.isFinite(s.sourceStart)||!Number.isFinite(s.sourceEnd)||!Number.isFinite(s.start)||s.sourceStart<0||s.sourceEnd<=s.sourceStart||s.sourceEnd>60||s.start<0||s.start+(s.sourceEnd-s.sourceStart)/p.voiceSpeed>p.duration+0.05) throw Error('해설 배치 시간을 확인해주세요.');
  if((p.voiceSegments?.length||0)>60||(p.dialogueRanges?.length||0)>100)throw Error('음성 구간이 너무 많습니다.');
  for(const s of p.dialogueRanges||[])if(!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||s.end>p.duration+0.05)throw Error('대사 시간을 확인해주세요.');
  let sourceEnd=0,timelineEnd=0;
  for(const s of p.voiceSegments||[]) {
    const end=s.start+(s.sourceEnd-s.sourceStart)/p.voiceSpeed;
    if(s.sourceStart<sourceEnd-0.001||s.start<timelineEnd-0.001||(p.dialogueRanges||[]).some(r=>s.start<r.end-0.001&&end>r.start+0.001))throw Error('해설이 다른 해설 또는 등장인물 대사와 겹칩니다. 자동 싱크를 다시 확인해주세요.');
    sourceEnd=s.sourceEnd;timelineEnd=end;
  }
}
// Read explicit narration sections only; character dialogue never becomes TTS input.
export function importEpisode(e: any): EditPlan {
  if (!e || ![5, 12, 15, 30].includes(e.duration) || typeof e.korean !== 'string' || e.korean.length > 20000) throw Error('에피소드 자료의 형식을 확인해주세요.');
  const p=defaultPlan();p.duration=e.duration;if(e.videoLayout!==undefined)p.videoLayout=e.videoLayout;p.title=String(e.title||'').slice(0,300);
  if(e.captionStyle!==undefined&&!['clinic','legacy','screen','korean'].includes(e.captionStyle))throw Error('자막 스타일을 확인해주세요.');
  if(e.captionStyle!==undefined)p.captionStyle=e.captionStyle;
  if(e.koreanTitlePreset!==undefined){if(e.captionStyle!=='korean'||!['balanced','wide'].includes(e.koreanTitlePreset))throw Error('한국판 제목 크기를 확인해주세요.');p.koreanTitlePreset=e.koreanTitlePreset;}
  if(e.headline!==undefined){if(!Array.isArray(e.headline)||e.headline.length!==2||e.headline.some((t:unknown)=>typeof t!=='string'||t.length>80))throw Error('상시 제목 두 줄을 확인해주세요.');p.headline=[...e.headline] as [string,string];}
  if(e.aspectRatio!==undefined){if(!['9:16','16:9'].includes(e.aspectRatio))throw Error('화면 비율을 확인해주세요.');p.aspectRatio=e.aspectRatio;}
  if(e.originalVolume!==undefined){if(!Number.isFinite(e.originalVolume)||e.originalVolume<0||e.originalVolume>1)throw Error('원본 음량을 확인해주세요.');p.originalVolume=e.originalVolume;}
  if(isDirectPlan(p)){p.videoLayout='single';p.originalVolume=1;if(e.captionStyle==='clinic'&&e.clinicBrandStart!==undefined)p.clinicBrandStart=e.clinicBrandStart;}
  if(isClinicPlan(p)&&p.aspectRatio==='16:9')throw Error('한의원 쇼츠 자막은 세로 9:16 영상에 사용해주세요.');

  const lines=normalizeScriptTable(e.korean).split('\n').map((s:string)=>cleanVideoText(s.replace(/\*\*|__/g,'').replace(/^[\s*#-]+/,''))).filter(Boolean);
  const narration:string[]=[], pending:{text:string;start?:number;end?:number;source?:Caption['source']}[]=[], dialogue:string[]=[];
  let mode:''|'narration'|'caption'|'dialogue'|'screen'='', uncertain=false, noNarration=false;
  const unquote=(text:string)=>text.replace(/^["“']|["”']$/g,'').trim();
  const timing=(text:string)=>text.match(/^\[?\s*(\d+(?:\.\d+)?)\s*(?:초|s(?:ec(?:onds?)?)?)?\s*[~～–—-]\s*(\d+(?:\.\d+)?)\s*(?:초|s(?:ec(?:onds?)?)?)?\s*\]?\s*[:：]?\s*(.*)$/i);
  for(const line of lines) {
    let text=line, time=timing(text);if(time)text=time[3];
    const label=text.match(/^\[?((?:한글\s*)?(?:나레이션|내레이션|해설)|화면\s*자막|자막|화면\s*문구|대사|Dialog(?:ue)?|오원장|소미|덕이|눈이|Nooni)\]?\s*(?:[:：]\s*|$)(.*)$/i);
    if(label) {
      mode=/나레이션|내레이션|해설/.test(label[1])?'narration':/문구/.test(label[1])?'screen':/자막/.test(label[1])?'caption':'dialogue';
      text=label[2];if(!time){time=timing(text);if(time)text=time[3];}
    }
    // Unknown speaker/section labels end the preceding narration block.
    if(!label&&/^[^:：]{1,25}[:：]/.test(text)){if(mode==='narration')uncertain=true;mode='';}
    if(!text.trim())continue;
    if(mode==='narration') {
      if(/^[([（]?\s*(?:없음|없습니다|해당 없음|사용 안 함|none)(?:\s*[)）\]]|\s*\(|\s*$)/i.test(text)){noNarration=true;mode='';continue;}
      if(/(?:Dialog(?:ue)?|오원장|소미|덕이|눈이|Nooni)\s*[:：]/i.test(text)){uncertain=true;mode='';continue;}
      narration.push(unquote(text));if(label)mode='';continue;
    }
    if(mode==='dialogue')text=text.replace(/^[^:"“']{1,30}\s*[:：]\s*(?=["“'])/,'');
    if(time||mode==='caption'||mode==='dialogue'||mode==='screen')pending.push({text:unquote(text),...(time?{start:Number(time[1]),end:Number(time[2])}:{}),source:mode==='dialogue'?'dialogue':mode==='screen'?'screen':undefined});
    if(label)mode='';
  }
  p.narration=narration.join(' ');
  const bounds=p.duration===12||p.duration===30||p.videoLayout==='single'?[0,p.duration]:p.duration===15?[0,4,8,11,15]:[0,2,5];
  p.captions=pending.map((c,i)=>({text:c.text,source:isDirectPlan(p)?'screen':c.source||(p.narration?'narration':'dialogue'),start:c.start??(pending.length===bounds.length-1?bounds[i]:0),end:c.end??(pending.length===bounds.length-1?bounds[i+1]:p.duration),...(!c.start&&!c.end&&pending.length!==bounds.length-1?{review:isDirectPlan(p)?'영상을 보며 자막 시작·끝 시간을 확인해주세요.':'발화 시간을 자동으로 찾습니다.'}:{})}));
  if (e.captions !== undefined) {
    if (!Array.isArray(e.captions) || e.captions.length > 30 || e.captions.some((c:any) => !c || !Number.isFinite(c.start) || !Number.isFinite(c.end) || typeof c.text !== 'string' || c.text.length > 160)) throw Error('화면 자막 타임라인을 확인해주세요.');
    p.captions=e.captions.map((c:any)=>({start:c.start,end:c.end,text:c.text,source:'screen'}));
  }
  const scenario=String(e.scenario||'');
  for(const m of scenario.matchAll(/(?:Dialog(?:ue)?\s*[:：]\s*[^:"“'\n]{1,30}|오원장|소미|덕이|눈이|Nooni)\s*[:：]\s*["“']([^"”'\n]+)["”']/gi))dialogue.push(m[1]);
  const comparison=(text:string)=>text.replace(/[^가-힣a-z0-9]/gi,'').toLowerCase();
  for(const text of (e.captions !== undefined ? [] : dialogue))if(!p.captions.some(c=>comparison(c.text)===comparison(text)))p.captions.push({text,start:0,end:p.duration,source:'dialogue',review:'원본 영상에서 대사 시간을 자동으로 찾습니다.'});
  p.thumbnail=cleanVideoText(String(e.thumbnail||'').split('\n').map(s=>s.replace(/^[\s*#-]+/,'').replace(/\*\*/g,'')).join('\n')).slice(0,100);
  if(uncertain||(!p.narration&&!noNarration&&lines.some((s:string)=>/나레이션|내레이션|해설/.test(s))))p.importWarning='해설 표기를 확실히 구분하지 못한 부분이 있습니다. 읽을 대본에는 해설만 있는지 확인해주세요.';
  const cleaned=cleanPlanText(p);
  if(isKoreanPlan(cleaned))validatePlan(cleaned);
  return cleaned;
}
