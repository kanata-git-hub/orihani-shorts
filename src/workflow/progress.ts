import type { HistoryItem } from '../types';
import type { MediaSummary } from '../utils/db';
import { DraftSummary, draftProgress } from '../editor/draft';
import { extractClips } from '../utils/extractors';
import { recordDuration } from './package';

export const recordDraftId = (item: HistoryItem) => 'episode-' + (item.editorKey || 'history-' + item.id);
export function recordProgress(item: HistoryItem, media?: MediaSummary, draft?: DraftSummary) {
  if (draft?.id === recordDraftId(item)) return { ...draftProgress(draft), target: 'editor' as const };
  const clips = extractClips(item.result);
  let valid = false;
  try { valid = clips.length === (recordDuration(item) === 5 ? 2 : 4) && new Set(clips.map(c => c.imageTitle)).size === clips.length; } catch { /* legacy unknown */ }
  if (!media || !valid) return { label: '저장된 기획 · 진행 상태 확인 필요', action: '작업 확인하기', target: 'history' as const };
  const count = clips.filter(c => media.imageTitles.includes(c.imageTitle)).length;
  return count < clips.length
    ? { label: `사진 ${count}/${clips.length}장 준비됨`, action: `남은 사진 ${clips.length - count}장 만들기`, target: 'history' as const }
    : { label: '사진 준비됨', action: 'Kling 자료 확인', target: 'history' as const };
}
