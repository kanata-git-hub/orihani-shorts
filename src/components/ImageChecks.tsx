import { useEffect, useState } from 'react';
import { db, MEDIA_CHANGED } from '../utils/db';
import { isImageData, type ImageResult } from '../imageQuality';

type Report = { mode: string; createdAt: number; rows: ImageResult[] };
const labels = { pass: '자동 검수 통과', fail: '오류 발견 · 적용 보류', uncertain: '확인 필요 · 적용 보류', unavailable: '검수 실패 · 적용 보류' };
export function ImageChecks({ targetId }: { targetId: string | null }) {
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
    <p>자동 검수도 오류를 놓칠 수 있습니다. 보류된 그림과 모델 비교 결과는 장면에 자동 적용하지 않습니다. 자동 재생성은 하지 않습니다.</p>
    <button type="button" onClick={download}>이미지 검수 결과 JSON 저장</button>
    {Object.entries(reports).map(([title, report]) => <section key={title} aria-label={`${title} 이미지 검수`}>
      <h3>{title} · {report.mode === 'comparison' ? '동일 입력 모델 비교' : '생성 이미지 검수'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {report.rows.map((row, i) => <div key={i}>
          <p><strong>{row.model}</strong></p>
          <p>{row.error || (row.review ? labels[row.review.status] : '검수 정보 없음')}</p>
          {isImageData(row.candidate) && <>
            <img src={row.candidate} alt={`${title} ${row.model} 생성 결과`} style={{ width: '100%', maxWidth: 320, height: 'auto' }} />
            <p><a href={row.candidate} download={`${title}-${row.model}.png`}>이 그림 다운로드</a></p>
          </>}
          {row.review?.issues?.map((issue, j) => <p key={j}>{issue.evidence}</p>)}
          {row.review?.error && <p>{row.review.error}</p>}
          <details><summary>호출 정보</summary><p style={{ overflowWrap: 'anywhere' }}>입력 SHA256: {row.inputHash}<br />생성: {((row.generationMs || 0) / 1000).toFixed(1)}초 / 검수: {((row.reviewMs || 0) / 1000).toFixed(1)}초<br />실제 응답 모델: {row.providerModel || row.model}</p></details>
        </div>)}
      </div>
    </section>)}
  </details>;
}
