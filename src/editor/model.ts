export type Caption = { start: number; end: number; text: string };
export type EditPlan = { duration: 5 | 15; title: string; narration: string; thumbnail: string; captions: Caption[]; originalVolume: number; voiceVolume: number; voiceSpeed: number };
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
}
// The original script remains available for comparison; no model rewrites it.
export function importEpisode(e: any): EditPlan {
  if (!e || ![5, 15].includes(e.duration) || typeof e.korean !== 'string' || e.korean.length > 20000) throw Error('에피소드 자료의 형식을 확인해주세요.');
  const p = defaultPlan(); p.duration = e.duration; p.title = String(e.title || '').slice(0, 300);
  const lines = e.korean.split('\n').map((s: string) => s.replace(/\*\*|__/g, '').replace(/^[\s*#-]+/, '').trim()).filter(Boolean);
  p.narration = lines.filter((s: string) => /나레이션|대사/.test(s)).map((s: string) => s.replace(/^.*?(?:나레이션|대사)\s*\]?\s*[:：]?\s*/, '')).join(' ');
  const timed = lines.map((s: string) => s.match(/^\[?\s*(\d+(?:\.\d+)?)\s*[~～–-]\s*(\d+(?:\.\d+)?)\s*초\]?\s*[:：]?\s*(.+)$/)).filter(Boolean);
  p.captions = timed.map((m: any) => ({ start: Number(m[1]), end: Math.min(Number(m[2]), p.duration), text: m[3] }));
  if (!p.captions.length) {
    const captions = lines.filter((s: string) => /화면 자막/.test(s)).map((s: string) => s.replace(/^.*?화면 자막\s*\]?\s*[:：]?\s*/, ''));
    const bounds = p.duration === 15 ? [0, 4, 8, 11, 15] : [0, 2, 5];
    if (captions.length === bounds.length - 1) p.captions = captions.map((text: string, i: number) => ({ start: bounds[i], end: bounds[i + 1], text }));
  }
  p.thumbnail = String(e.thumbnail || '').split('\n').filter(s => /[가-힣]/.test(s)).join('\n').replace(/^[\s*#-]+/, '').slice(0, 100);
  return p;
}
