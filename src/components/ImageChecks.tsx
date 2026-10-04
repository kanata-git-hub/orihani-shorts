import { useEffect, useState } from 'react';
import { Check, ChevronDown, Download, FileJson, RefreshCw, ScanLine, WandSparkles } from 'lucide-react';
import './image-checks.css';
import { db, MEDIA_CHANGED } from '../utils/db';
import { isImageData, MAX_IMAGE_EDITS, MAX_IMAGE_ATTEMPTS, MAX_REVIEW_RETRIES, type ImageResult } from '../imageQuality';

type Report = { mode: string; createdAt: number; rows: ImageResult[] };
const labels = { pass: '자동 검수 통과', fail: '오류 발견 · 적용 보류', uncertain: '확인 필요 · 적용 보류', unavailable: '그림 생성 완료 · 검수 미완료' };
export function ImageChecks({ targetId, busy, onCheck, onApply }: { targetId: string | null; busy?: boolean;
  onCheck?: (title: string, candidate: string, repair: boolean) => void;
  onApply?: (title: string, candidate: string) => void }) {
  const [reports, setReports] = useState<Record<string, Report>>({});
  useEffect(() => {
    let active = true;
    setReports({});
    const refresh = () => { if (targetId) void db.get(targetId).then(v => { if (active) setReports(v?.imageChecks || {}); }).catch(() => {}); };
    const changed = (e: Event) => { if ((e as CustomEvent).detail?.id === targetId) refresh(); };
    refresh(); window.addEventListener(MEDIA_CHANGED, changed);
    return () => { active = false; window.removeEventListener(MEDIA_CHANGED, changed); };
  }, [targetId]);
  if (!Object.keys(reports).length) return null;
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ targetId, reports }, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'duck-image-model-comparison.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <details className="ori-prompt-comparison ori-image-checks" open>
    <summary><span>이미지 검수·비교 결과</span><ChevronDown size={20} aria-hidden="true" /></summary>
    <p>검수·수정 지시는 Flash, 그림 수정은 Flash Image를 사용합니다. 직전 그림에서 지적된 부분만 최대 {MAX_IMAGE_EDITS}회 수정하고 통과하면 바로 멈춥니다. 빈 응답·응답 형식 오류는 그림을 유지하며 검수만 전체 작업에서 1회 재시도합니다. 검수가 끝나지 않아도 아래 그림을 다운로드하거나 직접 확인 후 사용할 수 있습니다.</p>
    <button className="ori-image-checks__button ori-image-checks__button--download" type="button" onClick={download}><FileJson size={18} aria-hidden="true" />이미지 검수 결과 JSON 저장</button>
    {Object.entries(reports).map(([title, report]) => <section className="ori-image-checks__scene" key={title} aria-label={`${title} 이미지 검수`}>
      <h3>{title} · {report.mode === 'comparison' ? '동일 입력 모델 비교' : '생성 이미지 검수'}</h3>
      <div className="ori-image-checks__grid">
        {report.rows.map((row, i) => <div className="ori-image-checks__card" key={i}>
          <p><strong>{row.model === 'existing-image' ? '기존 그림 · 재검수' : row.model}</strong></p>
          {row.reviewModel && <p>검수: {row.reviewModel} · 수정 {row.repairCount ?? 0}/{row.maxRepairs ?? MAX_IMAGE_EDITS}회</p>}
          <p className={`ori-image-checks__status ${row.review?.status === 'pass' ? 'ori-image-checks__status--pass' : ''}`}>{row.error || (row.review ? labels[row.review.status] : '검수 정보 없음')}</p>
          {isImageData(row.candidate) && <>
            <img src={row.candidate} alt={`${title} ${row.model} 생성 결과`} style={{ width: '100%', maxWidth: 320, height: 'auto' }} />
            {onApply && row.review?.status !== 'pass' && <p className="ori-image-checks__note">자동 검수 통과가 확인되지 않은 그림입니다. 직접 확인했다면 사용할 수 있습니다.</p>}
            <div className="ori-image-checks__actions">
              {onApply && <button className="ori-image-checks__button ori-image-checks__button--primary" type="button" disabled={busy} onClick={() => onApply(title, row.candidate!)}><Check size={20} aria-hidden="true" />{row.review?.status === 'pass' ? '이 그림 장면에 적용' : '직접 확인한 그림 사용'}</button>}
              {onCheck && row.review?.status === 'unavailable' && <button className="ori-image-checks__button" type="button" disabled={busy} onClick={() => onCheck(title, row.candidate!, false)}><RefreshCw size={18} aria-hidden="true" />그림 유지하고 검수만 재시도</button>}
              <a className="ori-image-checks__button ori-image-checks__button--download" href={row.candidate} download={`${title}-${row.model}.png`}><Download size={18} aria-hidden="true" />이 그림 다운로드</a>
            </div>
            {onCheck && <details>
              <summary><span>이 그림 검수·수정</span><ChevronDown size={18} aria-hidden="true" /></summary>
              <p>검수만 하면 Flash 1회, 응답 오류 재시도 시 최대 2회 비용이 발생합니다. 검수·수정은 먼저 이 그림을 검수하고, 명확한 오류가 남으면 최대 {MAX_IMAGE_EDITS}회 부분 수정합니다. 통과 즉시 종료하며 최대 이미지 수정 {MAX_IMAGE_EDITS}회·검수 {MAX_IMAGE_ATTEMPTS + MAX_REVIEW_RETRIES}회 비용이 발생합니다. 검수·수정에서 통과한 그림은 자동 적용합니다. 검수만 실행했거나 적용이 보류된 그림은 위 버튼으로 직접 적용할 수 있습니다.</p>
              <div className="ori-image-checks__actions"><button className="ori-image-checks__button" type="button" disabled={busy} onClick={() => onCheck(title, row.candidate!, false)}><ScanLine size={18} aria-hidden="true" />이 그림 Flash로 검수</button>
              <button className="ori-image-checks__button" type="button" disabled={busy} onClick={() => onCheck(title, row.candidate!, true)}><WandSparkles size={18} aria-hidden="true" />Flash로 검수·최대 {MAX_IMAGE_EDITS}회 수정</button></div>
            </details>}
          </>}
          {row.review?.issues?.map((issue, j) => <p key={j}>{issue.evidence}</p>)}
          {row.review?.error && <p>{row.review.error}</p>}
          {row.repairError && <p>{row.repairError}</p>}
          {!!row.attempts?.length && <details><summary><span>검수·수정 과정</span><ChevronDown size={18} aria-hidden="true" /></summary>
            {row.attempts.map((attempt, j) => <div key={j}>
              <p>{j === 0 ? '최초 그림' : `${j}차 수정`} · {labels[attempt.review.status]} · 검수 {attempt.reviewModel}</p>
              <p>{attempt.review.issues.map(issue => issue.evidence).join(' / ')}</p>
              {attempt.review.error && <p>{attempt.review.error}</p>}
              {isImageData(attempt.candidate) && <img src={attempt.candidate} alt={`${title} ${j === 0 ? '최초 그림' : `${j}차 수정`}`} style={{width: '100%', maxWidth: 220}}/>}
            </div>)}
          </details>}
          <details><summary><span>호출 정보</span><ChevronDown size={18} aria-hidden="true" /></summary><p style={{ overflowWrap: 'anywhere' }}>입력 SHA256: {row.inputHash}<br />생성: {((row.generationMs || 0) / 1000).toFixed(1)}초 / 검수: {((row.reviewMs || 0) / 1000).toFixed(1)}초<br />실제 응답 모델: {row.providerModel || row.model}</p>
            {row.attempts?.map((attempt, j) => attempt.reviewCalls?.map((call, k) => <p key={`${j}-${k}`}>그림 {j + 1} · 검수 {k + 1}: {call.code || '완료'} · 종료 사유: {call.finishReason || call.blockReason || '없음'} · 응답 {call.responseLength}자 · {(call.elapsedMs / 1000).toFixed(1)}초</p>))}
          </details>
        </div>)}
      </div>
    </section>)}
  </details>;
}
