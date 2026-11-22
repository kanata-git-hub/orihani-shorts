import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import type { ScenarioReviewData } from './scenarioReviewData';

function Notes({ title, notes }: { title: string; notes?: string | string[] }) {
  if (!notes?.length) return null;
  return <div><h4>{title}</h4>{Array.isArray(notes)
    ? <ul>{notes.map((note, index) => <li key={index}>{note}</li>)}</ul> : <p>{notes}</p>}</div>;
}

export function ScenarioReview() {
  const [open, setOpen] = useState(false), [refresh, setRefresh] = useState(0);
  const [review, setReview] = useState<ScenarioReviewData | null>(null);
  const [message, setMessage] = useState(''), [loading, setLoading] = useState(false);
  const [number, setNumber] = useState(0);
  useEffect(() => {
    if (!open) return;
    let current = true;
    const controller = new AbortController();
    const read = async () => {
      setLoading(true); setMessage('');
      try {
        const user = auth.currentUser;
        if (!user) throw Error('로그인 후 검토본을 확인할 수 있습니다.');
        const response = await fetch('/api/editor/scenario-review', {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]),
        });
        const data = await response.json();
        if (!response.ok) throw Error(data.error || '검토본을 읽지 못했습니다.');
        if (current) {
          setReview(data.review);
          setNumber(old => data.review?.episodes.some(ep => ep.number === old) ? old : data.review?.episodes[0]?.number ?? 0);
          setMessage(data.review ? '' : '등록된 검토본이 없습니다.');
        }
      } catch (error) {
        if (current) {
          setReview(null);
          setMessage(error instanceof Error && error.name !== 'TimeoutError' ? error.message : '검토본 확인이 지연되고 있습니다.');
        }
      } finally { if (current) setLoading(false); }
    };
    void read();
    return () => { current = false; controller.abort(); };
  }, [open, refresh]);
  const ep = review?.episodes.find(item => item.number === number);
  return <details className="ori-workflow ori-weekly ori-scenario-review w-full max-w-2xl mb-4 shrink-0"
    onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>시나리오·제작자료 검토</summary>
    {open && <>
      <div className="ori-weekly-heading"><span>사용자 확정 대기</span>
        <button type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)}>새로고침</button></div>
      {(message || loading) && <p role="status">{loading ? '검토본을 읽고 있습니다…' : message}</p>}
      {ep && !loading && <article>
        <label className="ori-episode-select"><span className="sr-only">검토할 회차</span>
          <select value={number} onChange={event => setNumber(Number(event.target.value))}>
            {review.episodes.map(item => <option key={item.number} value={item.number}>{item.number}화 · {item.title}</option>)}
          </select></label>
        <p>{ep.summary}</p>
        <span className="ori-episode-meta">{ep.duration}초 · {ep.scenarioRevision}</span>
        {ep.keyShot && <div><h4>핵심 장면</h4><p>{ep.keyShot}</p></div>}
        <h4>컷별 시나리오</h4>
        <ol>{ep.cuts.map(cut => <li key={cut.start}>
          <strong>{cut.start}–{cut.end}초</strong><p>{cut.action}</p>
          {cut.subtitle && <p>자막 · {cut.subtitle}</p>}
          {cut.frame && <details><summary>화면 지시</summary><p>{cut.frame}</p></details>}
        </li>)}</ol>
        <Notes title="소품·연속성" notes={ep.props}/><Notes title="편집 메모" notes={ep.editNotes}/>
        {ep.klingPrompt && <details><summary>Kling 영상 지시문</summary><p>{ep.klingPrompt}</p></details>}
        {(ep.reviewUrl || review.reviewUrl) && <a className="ori-workflow-link" href={ep.reviewUrl || review.reviewUrl}
          target="_blank" rel="noopener noreferrer">{ep.reviewLabel || review.reviewLabel || '전체 검토본 열기'}</a>}
      </article>}
    </>}
  </details>;
}
