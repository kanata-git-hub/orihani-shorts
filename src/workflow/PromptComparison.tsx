import { useRef, useState } from 'react';
import { authFetch } from '../authFetch';
import { SourceEpisode } from '../types';
import { episodePrompt } from './weekly';

const MODELS = ['gemini-3.8-flash', 'gemini-3.1-pro-preview'] as const;
type Result = { title: string; model: string; comparison?: {
  model: string; providerModel?: string; inputHash: string; elapsedMs: number;
  usage?: Record<string, unknown>; raw: string; compiled?: unknown;
  validationError?: string; modelCalls: number; automaticRepair: boolean;
}; error?: string };

export function PromptComparison({ episodes }: { episodes: SourceEpisode[] }) {
  const [busy, setBusy] = useState(false), [results, setResults] = useState<Result[]>([]);
  const [message, setMessage] = useState('');
  const running = useRef(false), sources = useRef<SourceEpisode[]>([]);
  async function run() {
    if (running.current || !episodes.length) return;
    running.current = true; setBusy(true); setResults([]); setMessage('같은 대본으로 두 모델을 비교하고 있습니다.');
    sources.current = structuredClone(episodes.slice(0, 3));
    const rows: Result[] = [];
    try {
      // One attempt per model and episode. Show failures; do not silently retry.
      for (const sourceEpisode of sources.current) {
        const pair = await Promise.all(MODELS.map(async model => {
          try {
            const response = await authFetch('/api/generate', { method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ duration: `${sourceEpisode.duration}s`,
                customPrompt: episodePrompt(sourceEpisode), sourceEpisode, comparisonModel: model }),
            });
            const data = await response.json();
            if (!response.ok || !data.comparison) throw Error(data.error || '비교 결과를 받지 못했습니다.');
            return { title: sourceEpisode.title, model, comparison: data.comparison } as Result;
          } catch (error) { return { title: sourceEpisode.title, model, error: (error as Error).message }; }
        }));
        rows.push(...pair); setResults([...rows]);
        setMessage(`${rows.length}/${sources.current.length * 2}개 호출 결과 확인`);
      }
      setMessage('비교가 끝났습니다. 아래 결과는 자동 재수정 없는 첫 응답입니다. 형식 통과는 내용 정확도 점수가 아닙니다.');
    } finally { running.current = false; setBusy(false); }
  }
  function download() {
    const blob = new Blob([JSON.stringify({ sourceEpisodes: sources.current, results }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'duck-prompt-model-comparison.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <details className="ori-prompt-comparison">
    <summary>프롬프트 모델 비교</summary>
    <p>현재 대본의 최대 3편을 Gemini 3.8 Flash와 3.1 Pro에 똑같이 보냅니다. 편당 2회 텍스트 API 비용이 발생합니다. 이미지·영상 생성과 기존 기록 변경은 없습니다.</p>
    <button disabled={busy || !episodes.length} onClick={() => void run()}>{busy ? '두 모델 비교 중…' : `${Math.min(3, episodes.length)}편 두 모델 비교 실행`}</button>
    <p role="status" aria-live="polite">{message}</p>
    {results.length > 0 && <button disabled={busy} onClick={download}>비교 결과 JSON 저장</button>}
    {results.map(row => <details key={`${row.title}-${row.model}`}>
      <summary>{row.title} · {row.model} · {row.error ? '호출 실패' : `${(row.comparison!.elapsedMs / 1000).toFixed(1)}초 · ${row.comparison!.validationError ? '형식 오류' : '형식 통과'}`}</summary>
      {row.error ? <p>{row.error}</p> : <>
        <p>입력 확인: {row.comparison!.inputHash}</p>
        <p>{row.comparison!.validationError}</p>
        <pre aria-label={`${row.title} ${row.model} 비교 결과`} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: '40rem', overflow: 'auto' }}>{JSON.stringify(row.comparison, null, 2)}</pre>
      </>}
    </details>)}
  </details>;
}
