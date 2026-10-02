import { useEffect, useState } from 'react';
import { db, MEDIA_CHANGED } from '../utils/db';
import { isImageData, MAX_IMAGE_EDITS, MAX_IMAGE_ATTEMPTS, type ImageResult } from '../imageQuality';

type Report = { mode: string; createdAt: number; rows: ImageResult[] };
const labels = { pass: '자동 검수 통과', fail: '오류 발견 · 적용 보류', uncertain: '확인 필요 · 적용 보류', unavailable: '검수 실패 · 적용 보류' };
export function ImageChecks({ targetId, busy, onCheck }: { targetId: string | null; busy?: boolean;
  onCheck?: (title: string, candidate: string, repair: boolean) => void }) {
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
  return <details className="ori-prompt-comparison" open>
    <summary>이미지 검수·비교 결과</summary>
    <p>검수·수정 지시는 Flash, 그림 수정은 Flash Image를 사용합니다. 직전 그림에서 지적된 부분만 최대 {MAX_IMAGE_EDITS}회 수정하고 통과하면 바로 멈춥니다. 검수도 틀릴 수 있어 최종 그림을 확인해주세요.</p>
    <button type="button" onClick={download}>이미지 검수 결과 JSON 저장</button>
    {Object.entries(reports).map(([title, report]) => <section key={title} aria-label={`${title} 이미지 검수`}>
      <h3>{title} · {report.mode === 'comparison' ? '동일 입력 모델 비교' : '생성 이미지 검수'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {report.rows.map((row, i) => <div key={i}>
          <p><strong>{row.model === 'existing-image' ? '기존 그림 · 재검수' : row.model}</strong></p>
          {row.reviewModel && <p>검수: {row.reviewModel} · 수정 {row.repairCount ?? 0}/{row.maxRepairs ?? 1}회</p>}
          <p>{row.error || (row.review ? labels[row.review.status] : '검수 정보 없음')}</p>
          {isImageData(row.candidate) && <>
            <img src={row.candidate} alt={`${title} ${row.model} 생성 결과`} style={{ width: '100%', maxWidth: 320, height: 'auto' }} />
            <p><a href={row.candidate} download={`${title}-${row.model}.png`}>이 그림 다운로드</a></p>
            {onCheck && <details>
              <summary>이 그림 검수·수정</summary>
              <p>검수만 하면 Flash 1회 비용이 발생합니다. 검수·수정은 먼저 이 그림을 검수하고, 명확한 오류가 남으면 최대 {MAX_IMAGE_EDITS}회 부분 수정합니다. 통과 즉시 종료하며 최대 이미지 수정 {MAX_IMAGE_EDITS}회·검수 {MAX_IMAGE_ATTEMPTS}회 비용이 발생합니다. 통과한 그림만 장면에 적용합니다.</p>
              <button type="button" disabled={busy} onClick={() => onCheck(title, row.candidate!, false)}>이 그림 Flash로 검수</button>
              <button type="button" disabled={busy} onClick={() => onCheck(title, row.candidate!, true)}>Flash로 검수·최대 {MAX_IMAGE_EDITS}회 수정</button>
            </details>}
          </>}
          {row.review?.issues?.map((issue, j) => <p key={j}>{issue.evidence}</p>)}
          {row.review?.error && <p>{row.review.error}</p>}
          {row.repairError && <p>{row.repairError}</p>}
          {!!row.attempts?.length && <details><summary>검수·수정 과정</summary>
            {row.attempts.map((attempt, j) => <div key={j}>
              <p>{j === 0 ? '최초 그림' : `${j}차 수정`} · {labels[attempt.review.status]} · 검수 {attempt.reviewModel}</p>
              <p>{attempt.review.issues.map(issue => issue.evidence).join(' / ')}</p>
              {isImageData(attempt.candidate) && <img src={attempt.candidate} alt={`${title} ${j === 0 ? '최초 그림' : `${j}차 수정`}`} style={{width: '100%', maxWidth: 220}}/>}
            </div>)}
          </details>}
          <details><summary>호출 정보</summary><p style={{ overflowWrap: 'anywhere' }}>입력 SHA256: {row.inputHash}<br />생성: {((row.generationMs || 0) / 1000).toFixed(1)}초 / 검수: {((row.reviewMs || 0) / 1000).toFixed(1)}초<br />실제 응답 모델: {row.providerModel || row.model}</p></details>
        </div>)}
      </div>
    </section>)}
  </details>;
}
