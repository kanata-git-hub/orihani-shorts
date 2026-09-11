import { EditPlan, cleanPlanText } from './model';
import { spokenNumbers } from './speech';
import { clipLengths } from './media';
import { TEXT_POLICY_VERSION } from './text';

export type Draft = { id: string; plan: EditPlan; original: string; voice: string; style: string; voiceBlob?: Blob; voiceKey?: string; videos: (File | null)[]; result?: Blob; resultKey?: string; syncKey?: string; textBackup?: Pick<EditPlan, 'title' | 'narration' | 'thumbnail' | 'captions'> };
export type EditorStage = 'videos' | 'voice' | 'captions' | 'result';
export type DraftSummary = { id: string; title: string; updatedAt?: number; version?: 1; state?: EditorStage; videoCount?: number; requiredVideos?: number; hasResult?: boolean; textPolicy?: number };
const filesKey = (d: Draft) => d.videos.map(f => f && [f.name, f.size, f.lastModified]);
export const voiceKey = (d: Draft) => JSON.stringify([spokenNumbers(d.plan.narration), d.voice, d.style, d.plan.duration]);
export const syncKey = (d: Draft) => JSON.stringify([2, voiceKey(d), d.plan.voiceSpeed, d.plan.captions.map(c => [c.text, c.source]), filesKey(d)]);
export const resultKey = (d: Draft) => JSON.stringify([3, TEXT_POLICY_VERSION, d.plan, d.voiceKey, filesKey(d)]);
export const voiceIsCurrent = (d: Draft) => !d.plan.narration.trim() || (!!d.voiceBlob && d.voiceKey === voiceKey(d));
export const resultIsCurrent = (d: Draft) => !!d.result && d.resultKey === resultKey(d) && voiceIsCurrent(d) && d.syncKey === syncKey(d) && !d.plan.captions.some(c => c.review);
export const hasDraftContent = (d: Draft) => !!(d.original.trim() || d.plan.title.trim() || d.plan.narration.trim() || d.plan.thumbnail.trim() || d.plan.captions.length || d.videos.some(Boolean) || d.voiceBlob || d.result);
export function draftStage(d: Draft): EditorStage {
  if (clipLengths(d.plan.duration).some((_, i) => !d.videos[i])) return 'videos';
  if (resultIsCurrent(d)) return 'result';
  return voiceIsCurrent(d) && d.syncKey === syncKey(d) ? 'captions' : 'voice';
}
export function summarizeDraft(d: Draft, updatedAt = Date.now()): DraftSummary {
  return { id: d.id, title: d.plan.title || '제목 없는 편집', updatedAt, version: 1, state: draftStage(d), videoCount: d.videos.filter(Boolean).length, requiredVideos: clipLengths(d.plan.duration).length, hasResult: !!d.result, textPolicy: TEXT_POLICY_VERSION };
}
export function restoreDraft(d: Draft): Draft {
  const plan = cleanPlanText(d.plan);
  if (JSON.stringify(plan) === JSON.stringify(d.plan)) return d;
  const next = { ...d, plan, textBackup: d.textBackup || { title: d.plan.title, narration: d.plan.narration, thumbnail: d.plan.thumbnail, captions: d.plan.captions } };
  // Display-only cleanup keeps already verified timings without paid re-analysis.
  if (d.syncKey === syncKey(d) && plan.narration === d.plan.narration) next.syncKey = syncKey(next);
  return next;
}
export function draftProgress(s?: DraftSummary) {
  if (!s?.state || s.version !== 1) return { label: '저장된 편집 · 상태 확인 필요', action: '편집 이어하기' };
  if (s.state === 'result' && s.textPolicy === TEXT_POLICY_VERSION) return { label: '완성됨', action: '완성 영상 확인·저장' };
  if (s.state === 'videos') return { label: s.videoCount ? `영상 ${s.videoCount}/${s.requiredVideos}개 입력됨` : 'Kling 영상 대기', action: 'Kling 영상 넣기' };
  if (s.state === 'voice') return { label: '영상 입력됨', action: '음성·자막 준비' };
  return { label: s.hasResult ? '편집 중 · 이전 완성본 보관' : '편집 중', action: '편집 이어하기' };
}
