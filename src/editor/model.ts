import type { VoiceSegment } from './speech';
export type Caption = { start: number; end: number; text: string; source?: 'narration' | 'dialogue' | 'screen'; review?: string };
export type EditPlan = { duration: 5 | 15; title: string; narration: string; thumbnail: string; captions: Caption[]; originalVolume: number; voiceVolume: number; voiceSpeed: number; voiceSegments?: VoiceSegment[]; dialogueRanges?: {start:number;end:number}[]; importWarning?: string };
export const defaultPlan = (): EditPlan => ({ duration: 5, title: '', narration: '', thumbnail: '', captions: [], originalVolume: 0.2, voiceVolume: 1, voiceSpeed: 1 });
export function validatePlan(p: EditPlan) {
  if (!p || ![5, 15].includes(p.duration)) throw Error('영상 길이를 확인해주세요.');
  if (typeof p.thumbnail !== 'string' || p.thumbnail.length > 100 || typeof p.title !== 'string' || p.title.length > 300) throw Error('제목 문구가 너무 깁니다.');
  if (!Array.isArray(p.captions) || p.captions.length > 30) throw Error('자막은 30개까지 가능합니다.');
  let last = 0;
  for (const c of p.captions) {
    if (!Number.isFinite(c.start) || !Number.isFinite(c.end) || c.start < last || c.end <= c.start || c.end > p.duration || typeof c.text !== 'string' || !c.text.trim() || c.text.length > 160) throw Error('자막의 시작·끝 시간과 문구를 확인해주세요. 자막 시간은 겹칠 수 없습니다.');
    last = c.end;
  }
  for (const k of ['originalVolume', 'voiceVolume'] as const) if (!Number.isFinite(p[k]) || p[k] < 0 || p[k] > 1) throw Error('음량은 0~100%로 설정해주세요.');
  if (!Number.isFinite(p.voiceSpeed) || p.voiceSpeed < 0.8 || p.voiceSpeed > 1.25) throw Error('음성 속도는 0.8~1.25배로 설정해주세요.');
  for(const s of p.voiceSegments || []) if(!Number.isFinite(s.sourceStart)||!Number.isFinite(s.sourceEnd)||!Number.isFinite(s.start)||s.sourceStart<0||s.sourceEnd<=s.sourceStart||s.sourceEnd>60||s.start<0||s.start+(s.sourceEnd-s.sourceStart)/p.voiceSpeed>p.duration+0.05) throw Error('해설 배치 시간을 확인해주세요.');
  if((p.voiceSegments?.length||0)>60||(p.dialogueRanges?.length||0)>100)throw Error('음성 구간이 너무 많습니다.');
  for(const s of p.dialogueRanges||[])if(!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||s.end>p.duration+0.05)throw Error('대사 시간을 확인해주세요.');
}
// The original script remains available for comparison; no model rewrites it.
export function importEpisode(e: any): EditPlan {
  if (!e || ![5, 15].includes(e.duration) || typeof e.korean !== 'string' || e.korean.length > 20000) throw Error('에피소드 자료의 형식을 확인해주세요.');
  const p = defaultPlan(); p.duration = e.duration; p.title = String(e.title || '').slice(0, 300);
  const lines = e.korean.split('\n').map((s: string) => s.replace(/\*\*|__/g, '').replace(/^[\s*#-]+/, '').trim()).filter(Boolean);
  p.narration = lines.filter((s: string) => /^(?:\[[^\]]*\]\s*)?(?:한글\s*)?\[?(?:나레이션|내레이션|해설)\]?\s*[:：]/.test(s)).map((s: string) => s.replace(/^.*?\[?(?:나레이션|내레이션|해설)\]?\s*[:：]\s*/, '')).join(' ');
  const timed = lines.map((s: string) => s.match(/^\[?\s*(\d+(?:\.\d+)?)\s*[~～–-]\s*(\d+(?:\.\d+)?)\s*초\]?\s*[:：]?\s*(.+)$/)).filter(Boolean);
  p.captions = timed.map((m: any) => ({ start: Number(m[1]), end: Math.min(Number(m[2]), p.duration), text: m[3], source: /^(?:대사|오원장|소미|덕이|Dialog(?:ue)?)\s*[:：]/i.test(m[3])?'dialogue':'narration' }));
  if (!p.captions.length) {
    const captions = lines.filter((s: string) => /화면 자막/.test(s)).map((s: string) => s.replace(/^.*?화면 자막\s*\]?\s*[:：]?\s*/, ''));
    const bounds = p.duration === 15 ? [0, 4, 8, 11, 15] : [0, 2, 5];
    if (captions.length === bounds.length - 1) p.captions = captions.map((text: string, i: number) => ({ start: bounds[i], end: bounds[i + 1], text }));
  }
  p.thumbnail = String(e.thumbnail || '').split('\n').filter(s => /[가-힣]/.test(s)).join('\n').replace(/^[\s*#-]+/, '').slice(0, 100);
  const dialogue=[...String(e.scenario||'').matchAll(/(?:Dialog(?:ue)?\s*[:：]\s*)?(?:오원장|소미|덕이)\s*[:：]\s*["“']([^"”'\n]+)["”']/gi)].map(m=>m[1]);
  for(const line of lines){const m=line.match(/^(?:(?:대사|Dialog(?:ue)?)\s*[:：]\s*)?(?:오원장|소미|덕이)\s*[:：]\s*["“']?(.+?)["”']?$/i);if(m)dialogue.push(m[1]);}
  for(const text of [...new Set(dialogue)])if(!p.captions.some(c=>c.text.includes(text)))p.captions.push({text,start:0,end:p.duration,source:'dialogue',review:'원본 영상에서 대사 시간을 자동으로 찾습니다.'});
  p.captions=p.captions.map(c=>({...c,text:c.text.replace(/^(?:대사\s*[:：]\s*)?(?:오원장|소미|덕이)\s*[:：]\s*/, '').replace(/^["“]|["”]$/g,''),source:c.source||(p.narration?'narration':'dialogue')}));
  if(!p.narration&&lines.some(s=>/나레이션|내레이션|해설/.test(s)))p.importWarning='해설 표기를 확실히 구분하지 못했습니다. 읽을 대본에는 해설만 넣어주세요.';
  return p;
}
