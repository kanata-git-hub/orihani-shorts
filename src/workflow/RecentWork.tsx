import type { HistoryItem } from '../types';
import type { MediaSummary } from '../utils/db';
import { DraftSummary, draftProgress } from '../editor/draft';
import { recordDraftId, recordProgress } from './progress';
import { extractOverview } from '../utils/extractors';
import './workflow.css';

export type RecentTarget = { kind: 'history' | 'editor'; id: string };
export function readRecentTarget(): RecentTarget | undefined {
  try { const v = JSON.parse(localStorage.getItem('orihani-recent-work') || 'null'); if (v && ['history','editor'].includes(v.kind) && typeof v.id === 'string') return v; } catch { /* optional preference */ }
}
export function RecentWork({history,drafts,media,recent,onHistory,onEditor}:{history:HistoryItem[];drafts:DraftSummary[];media:Record<string,MediaSummary>;recent?:RecentTarget;onHistory:(item:HistoryItem)=>void;onEditor:(id:string)=>void}) {
  let item = recent?.kind === 'history' ? history.find(h => h.id === recent.id) : undefined;
  let draft = recent?.kind === 'editor' ? drafts.find(d => d.id === recent.id) : undefined;
  if (!item && !draft) {
    const newest = drafts.filter(d=>d.version===1).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0];
    if (newest && (!history[0] || (newest.updatedAt||0) > history[0].timestamp)) draft = newest;
    else item = history[0];
    if (!item && !draft) draft = drafts[0];
  }
  if (!item && !draft) return null;
  const linked = item ? drafts.find(d=>d.id===recordDraftId(item!)) : undefined;
  const progress = item ? recordProgress(item,media[item.id],linked) : draftProgress(draft);
  return <section className="ori-workflow ori-recent" aria-label="최근 작업 이어하기">
    <p className="ori-workflow-label">최근 작업 이어하기</p>
    <h2>{item ? extractOverview(item.result).title || '저장된 기획' : draft!.title}</h2>
    <p>{progress.label}</p>
    <button className="ori-workflow-primary" onClick={()=>item ? linked ? onEditor(linked.id) : onHistory(item) : onEditor(draft!.id)}>{progress.action}</button>
    <p className="ori-local-note">같은 기기·같은 브라우저의 기록입니다. 다른 기기와 자동 동기화되지 않습니다.</p>
  </section>;
}
