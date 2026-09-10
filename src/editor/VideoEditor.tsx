import { useEffect, useRef, useState } from 'react';
import { auth } from '../lib/firebase';
import { defaultPlan, EditPlan, importEpisode, validatePlan } from './model';
import { editorStore } from './storage';
import './editor.css';

type Draft = { id: string; plan: EditPlan; original: string; voice: string; style: string; voiceBlob?: Blob; voiceKey?: string; videos: (File | null)[]; result?: Blob; resultKey?: string };
const fresh = (): Draft => ({ id: crypto.randomUUID(), plan: defaultPlan(), original: '', voice: 'Zubenelgenubi', style: '털털하고 편안한 남성 말투. 과장하지 않고 짧은 농담을 담백하게 말한다.', videos: [] });
const voiceKey = (d: Draft) => JSON.stringify([d.plan.narration, d.voice, d.style, d.plan.duration]);
const resultKey = (d: Draft) => JSON.stringify([d.plan, d.voiceKey, d.videos.map(f => f && [f.name, f.size, f.lastModified])]);
function useURL(blob?: Blob) {
  const [url, setURL] = useState('');
  useEffect(() => { if (!blob) { setURL(''); return; } const value = URL.createObjectURL(blob); setURL(value); return () => URL.revokeObjectURL(value); }, [blob]); return url;
}
async function request(url: string, body: FormData | object) {
  const user = auth.currentUser; if (!user) throw Error('먼저 로그인해주세요.');
  const headers: Record<string, string> = { Authorization: `Bearer ${await user.getIdToken()}` };
  if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch('/api/editor/' + url, { method: 'POST', headers, body: body instanceof FormData ? body : JSON.stringify(body) });
  if (!res.ok) { const error = await res.json().catch(() => ({})); throw Error(error.error || `서버 응답 오류 (${res.status})`); }
  return res.blob();
}

export function VideoEditor({ visible, open }: { visible: boolean; open: () => void }) {
  const [d, setD] = useState<Draft>(fresh); const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<{ id: string; title: string }[]>([]);
  const [busy, setBusy] = useState(false); const busyRef = useRef(false);
  const [message, setMessage] = useState('Kling에서 받은 영상을 넣고, 나레이션을 확인해주세요.');
  const [consent, setConsent] = useState(false); const [raw, setRaw] = useState('');
  const [audioLength, setAudioLength] = useState(0);
  const audioURL = useURL(d.voiceBlob); const resultURL = useURL(d.result);
  const currentRef = useRef(d); currentRef.current = d;
  const openRef = useRef(open); openRef.current = open;
  const saveQueue = useRef(Promise.resolve());
  useEffect(() => {
    let mounted = true;
    (async () => { const list = await editorStore<{ id: string; title: string }[]>('list') || []; const id = await editorStore<string>('current'); const draft = id ? await editorStore<Draft>(id) : undefined; if (mounted) { setSaved(list); if (draft) setD(draft); setReady(true); } })().catch(() => { if (mounted) { setMessage('저장된 편집을 읽지 못했습니다. 브라우저 저장 공간을 확인해주세요.'); setReady(true); } });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const snapshot = d;
    saveQueue.current = saveQueue.current.catch(() => {}).then(async () => {
      await editorStore(snapshot.id, snapshot);
      const list = await editorStore<{ id: string; title: string }[]>('list') || [];
      const next = [{ id: snapshot.id, title: snapshot.plan.title || '제목 없는 편집' }, ...list.filter(x => x.id !== snapshot.id)];
      await editorStore('list', next); await editorStore('current', snapshot.id); setSaved(next);
    }).catch(() => setMessage('자동 저장에 실패했습니다. 완성 파일을 다운로드하고 브라우저 저장 공간을 확인해주세요.'));
  }, [d, ready]);
  useEffect(() => { setConsent(false); }, [d.plan.narration, d.voice, d.style, d.plan.duration]);
  useEffect(() => {
    const handler = (event: Event) => {
      if (!ready || busyRef.current) return;
      try {
        const payload = (event as CustomEvent).detail;
        if (payload?.version !== 1 || typeof payload.key !== 'string' || payload.key.length > 200) return;
        const plan = importEpisode(payload.episode);
        const id = 'episode-' + payload.key;
        busyRef.current = true; setBusy(true);
        (async () => {
          await saveQueue.current;
          const existing = await editorStore<Draft>(id);
          setD(existing || { ...fresh(), id, plan, original: payload.episode.korean });
          setMessage('에피소드 대본을 가져왔습니다. Kling 영상 파일을 넣어주세요. 자막 시각과 숫자 발음을 확인해주세요.');
          openRef.current(); document.documentElement.dataset.oriEditorImported = payload.key;
        })().catch(e => setMessage(e.message)).finally(() => { busyRef.current = false; setBusy(false); });
      } catch (e) { setMessage(e instanceof Error ? e.message : '대본 가져오기 실패'); }
    };
    window.addEventListener('orihani-editor-import', handler);
    document.documentElement.dataset.oriEditorReady = ready ? '1' : '0';
    return () => { window.removeEventListener('orihani-editor-import', handler); delete document.documentElement.dataset.oriEditorReady; };
  }, [ready]);
  const change = (patch: Partial<EditPlan>) => setD(v => ({ ...v, plan: { ...v.plan, ...patch } }));
  const run = async (fn: () => Promise<void>) => {
    if (busyRef.current) return; busyRef.current = true; setBusy(true);
    try { await fn(); } catch (e) { setMessage(e instanceof Error ? e.message : '작업 실패'); } finally { busyRef.current = false; setBusy(false); }
  };
  const voiceCurrent = !!d.voiceBlob && d.voiceKey === voiceKey(d);
  const finishedCurrent = !!d.result && d.resultKey === resultKey(d) && voiceCurrent;
  const lengths = d.plan.duration === 5 ? [5] : [4, 4, 3, 4];
  const createVoice = () => run(async () => {
    if (!consent) throw Error('나레이션과 생성 비용 확인란을 체크해주세요.');
    if (!d.plan.narration.trim()) throw Error('읽을 나레이션을 입력해주세요.');
    setMessage('나레이션 생성 중입니다. 완료될 때까지 이 창을 열어두세요.');
    const blob = await request('voice', { text: d.plan.narration, voice: d.voice, style: d.style, duration: d.plan.duration });
    setD(v => ({ ...v, voiceBlob: blob, voiceKey: voiceKey(v) })); setMessage('음성을 만들었습니다. 미리듣기로 발음과 속도를 확인해주세요.');
  });
  const makeVideo = () => run(async () => {
    validatePlan(d.plan);
    if (!voiceCurrent) throw Error('현재 대본에 맞는 음성을 먼저 만들어주세요.');
    if (d.videos.filter(Boolean).length !== lengths.length) throw Error('각 칸에 Kling 영상 파일을 넣어주세요.');
    if (audioLength / d.plan.voiceSpeed > d.plan.duration + 0.05) throw Error('음성이 영상보다 깁니다. 대본이나 속도를 조절해주세요.');
    const size = d.videos.reduce((n, f) => n + (f?.size || 0), d.voiceBlob.size);
    if (size > 27.8 * 1024 * 1024) throw Error('파일 합계가 28MB를 넘습니다. Kling에서 1080p 영상으로 다운로드해주세요.');
    const body = new FormData(); body.append('plan', JSON.stringify(d.plan));
    d.videos.forEach(f => body.append('videos', f)); body.append('voice', d.voiceBlob, 'narration.wav');
    setMessage('영상·음성·자막을 합치는 중입니다. 완료될 때까지 이 창을 열어두세요.');
    const blob = await request('render', body); setD(v => ({ ...v, result: blob, resultKey: resultKey(v) }));
    setMessage('완성되었습니다. 아래 영상에서 소리와 자막을 확인하고 다운로드해주세요.');
  });
  return <section className="ori-editor" hidden={!visible}>
    <div className="ori-editor-inner">
      <header><div><p className="ori-eyebrow">마지막 편집, 한 곳에서</p><h2>영상 편집</h2><p>영상 넣기 → 나레이션 미리듣기 → 자막과 함께 완성</p></div></header>
      <p role="status" aria-live="polite" className="ori-status">{message}</p>
      <fieldset disabled={busy || !ready}>
        <div className="ori-row"><label>편집할 콘텐츠<select value={d.id} onChange={e => { const id = e.target.value; run(async () => { await saveQueue.current; const loaded = await editorStore<Draft>(id); if (loaded) setD(loaded); }); }}><option value={d.id}>{d.plan.title || '새 편집'}</option>{saved.filter(x => x.id !== d.id).map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></label><button onClick={() => { setD(fresh()); setMessage('새 영상과 대본을 넣어주세요.'); }}>새 편집</button></div>
        <label>콘텐츠 이름<input value={d.plan.title} maxLength={300} onChange={e => change({ title: e.target.value })} placeholder="이번 밈 제목" /></label>
        <article><h3>1. Kling 영상 넣기</h3><div className="ori-row"><button aria-pressed={d.plan.duration === 5} disabled={d.plan.duration === 5} onClick={() => { change({ duration: 5, captions: [] }); setD(v => ({ ...v, videos: [] })); }}>5초 · 영상 한 개</button><button aria-pressed={d.plan.duration === 15} disabled={d.plan.duration === 15} onClick={() => { change({ duration: 15, captions: [] }); setD(v => ({ ...v, videos: [] })); }}>15초 · 영상 네 개</button></div>
          <div className="ori-files">{lengths.map((length, i) => <label key={`${d.id}-${d.plan.duration}-${i}`} className="ori-file">{i + 1}번 영상 · {length}초<input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={e => { const f = e.target.files?.[0]; if (f) setD(v => ({ ...v, videos: Array.from({ length: lengths.length }, (_, n) => n === i ? f : v.videos[n] || null) })); }} /><span>{d.videos[i]?.name || '파일을 선택해주세요'}</span></label>)}</div>
        </article>
        <article><h3>2. 나레이션</h3><p>한국어만 읽습니다. 숫자는 원하는 발음으로 적어주세요. 예: 1% → 일 퍼센트</p>
          <label>읽을 대본<textarea rows={3} maxLength={1200} value={d.plan.narration} onChange={e => change({ narration: e.target.value })} /></label>
          {/\d/.test(d.plan.narration) && <p className="ori-note">숫자가 있습니다. 한글 발음으로 바꾸면 읽는 방법을 확실하게 정할 수 있습니다.</p>}
          <div className="ori-row"><label>목소리<select value={d.voice} onChange={e => setD(v => ({ ...v, voice: e.target.value }))}><option value="Zubenelgenubi">편안한 말투 · Zubenelgenubi</option><option value="Achird">친근한 말투 · Achird</option><option value="Algenib">거친 음색 · Algenib</option><option value="Kore">단단한 말투 · Kore</option><option value="Puck">발랄한 말투 · Puck</option></select></label></div>
          <details><summary>읽는 느낌 조절</summary><textarea value={d.style} maxLength={500} onChange={e => setD(v => ({ ...v, style: e.target.value }))} /><p>VLLO의 ‘털털한 정국’과 동일한 목소리는 아닙니다. 미리듣기로 골라주세요.</p></details>
          <label className="ori-check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />대본을 확인했습니다. 음성 생성 시 Gemini 비용이 발생합니다.</label>
          <button className="ori-primary" disabled={!consent || voiceCurrent} onClick={createVoice}>{voiceCurrent ? '현재 대본의 음성이 준비됨' : '나레이션 만들기'}</button>
          {audioURL && <div className="ori-audio"><audio controls src={audioURL} onLoadedMetadata={e => setAudioLength(e.currentTarget.duration)} /><a href={audioURL} download="나레이션.wav">음성 다운로드</a>{!voiceCurrent && <p>대본 또는 목소리가 바뀌었습니다. 음성을 다시 만들어주세요.</p>}</div>}
          <div className="ori-row"><label>음성 속도<input type="range" min="0.8" max="1.25" step="0.05" value={d.plan.voiceSpeed} onChange={e => change({ voiceSpeed: +e.target.value })} />{d.plan.voiceSpeed}배 · 적용 길이 {audioLength ? (audioLength / d.plan.voiceSpeed).toFixed(1) : '—'}초</label><label>Kling 원래 소리<select value={d.plan.originalVolume} onChange={e => change({ originalVolume: +e.target.value })}><option value={0.2}>작게 유지 · 20%</option><option value={1}>그대로 유지 · 100%</option><option value={0}>끄기</option></select></label></div>
        </article>
        <article><h3>3. 자막과 첫 화면 문구</h3><p>자막은 화면 아래쪽 25% 위치에 표시됩니다. 대본에서 가져온 시각을 사용하며, 음성 인식으로 자동 정렬하지는 않습니다.</p>
          {d.plan.captions.map((c, i) => <div className="ori-caption" key={i}><label>시작(초)<input type="number" min="0" max={d.plan.duration} step="0.1" value={c.start} onChange={e => change({ captions: d.plan.captions.map((r, n) => n === i ? { ...r, start: +e.target.value } : r) })} /></label><label>끝(초)<input type="number" min="0" max={d.plan.duration} step="0.1" value={c.end} onChange={e => change({ captions: d.plan.captions.map((r, n) => n === i ? { ...r, end: +e.target.value } : r) })} /></label><label>자막<textarea rows={2} maxLength={160} value={c.text} onChange={e => change({ captions: d.plan.captions.map((r, n) => n === i ? { ...r, text: e.target.value } : r) })} /></label><button onClick={() => change({ captions: d.plan.captions.filter((_, n) => n !== i) })}>삭제</button></div>)}
          <button disabled={d.plan.captions.length >= 30} onClick={() => { const start = d.plan.captions.at(-1)?.end || 0; if (start < d.plan.duration) change({ captions: [...d.plan.captions, { start, end: d.plan.duration, text: '' }] }); }}>자막 추가</button>
          <label>처음 0~1초에 표시할 문구<textarea rows={2} maxLength={100} value={d.plan.thumbnail} onChange={e => change({ thumbnail: e.target.value })} placeholder="화면 위쪽 25% 위치에 표시합니다" /></label>
          <details><summary>원본 대본 확인 / 직접 가져오기</summary>{d.original && <pre>{d.original}</pre>}<textarea rows={6} value={raw} onChange={e => setRaw(e.target.value)} placeholder="한글 나레이션 및 자막 부분을 붙여넣으세요" /><button onClick={() => { try { const p = importEpisode({ duration: d.plan.duration, korean: raw, title: d.plan.title, thumbnail: d.plan.thumbnail }); setD(v => ({ ...v, plan: { ...v.plan, narration: p.narration, captions: p.captions }, original: raw })); setMessage('대본을 가져왔습니다. 나레이션과 자막 시각을 확인해주세요.'); } catch (e) { setMessage(e.message); } }}>대본에서 나레이션·자막 가져오기</button></details>
        </article>
        <button className="ori-primary ori-finish" disabled={!voiceCurrent} onClick={makeVideo}>{busy ? '처리 중…' : '음성·자막 넣고 영상 완성'}</button>
      </fieldset>
      {resultURL && <article><h3>{finishedCurrent ? '완성 영상' : '이전 설정의 완성 영상'}</h3>{!finishedCurrent && <p>설정이 바뀌었습니다. 현재 설정으로 다시 완성해주세요.</p>}<video className="ori-result" controls playsInline src={resultURL} /><a className="ori-download" href={resultURL} download={`${d.plan.title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80) || '오리쇼츠'}.mp4`}>완성 MP4 다운로드</a></article>}
    </div>
  </section>;
}
