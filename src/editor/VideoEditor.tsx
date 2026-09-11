import { useEffect, useRef, useState } from 'react';
import { auth } from '../lib/firebase';
import { defaultPlan, EditPlan, importEpisode, validatePlan } from './model';
import { editorStore, draftWriter, persistDraft } from './storage';
import { Draft, DraftSummary, EditorStage, voiceKey, syncKey, resultKey, voiceIsCurrent, resultIsCurrent, hasDraftContent, restoreDraft, draftStage, draftProgress, summarizeDraft } from './draft';
import { spokenNumbers, alignCaptions, scheduleNarration, placedWords, speechRanges, Word } from './speech';
import { clipLengths, validateMediaSizes, validateMediaDuration, mediaDuration } from './media';
import './editor.css';
import { shareFile } from '../workflow/share';

const fresh = (): Draft => ({ id: crypto.randomUUID(), plan: defaultPlan(), original: '', voice: 'Zubenelgenubi', style: '털털하고 편안한 남성 말투. 과장하지 않고 짧은 농담을 담백하게 말한다.', videos: [] });
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
async function analyze(blob:Blob,expectedDuration?:number):Promise<Word[]>{
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(n=>n.toString(16).padStart(2,'0')).join('');
  const key='transcribe-v1-'+hash,cached=await editorStore<Word[]>(key);if(cached)return cached;
  const form=new FormData();form.append('videos',blob,'audio-input');
  if(expectedDuration!==undefined)form.append('expectedDuration',String(expectedDuration));
  const result=JSON.parse(await (await request('transcribe',form)).text());
  if(!Array.isArray(result.words))throw Error('음성 분석 결과를 읽지 못했습니다.');
  await editorStore(key,result.words);return result.words;
}

export function VideoEditor({ visible, open, onIndex, onBusy, resumeId, onResumeHandled, onActive }: { visible: boolean; open: () => void; onIndex?: (list: DraftSummary[]) => void; onBusy?: (busy: boolean) => void; resumeId?: string; onResumeHandled?: () => void; onActive?: (id: string) => void }) {
  const [d, setD] = useState<Draft>(fresh); const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<DraftSummary[]>([]);
  const [stage, setStage] = useState<EditorStage>('videos');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [busy, setBusy] = useState(false); const busyRef = useRef(false);
  const [message, setMessage] = useState('Kling에서 받은 영상을 넣고, 나레이션을 확인해주세요.');
  const [consent, setConsent] = useState(false); const [raw, setRaw] = useState('');
  const [audioLength, setAudioLength] = useState(0);const audioRef=useRef<HTMLAudioElement>(null);
  useEffect(()=>{setAudioLength(0);},[d.voiceBlob]);
  useEffect(()=>{if(audioRef.current)audioRef.current.playbackRate=d.plan.voiceSpeed;},[d.plan.voiceSpeed]);
  const audioURL = useURL(d.voiceBlob); const resultURL = useURL(d.result);
  const currentRef = useRef(d); currentRef.current = d;
  const openRef = useRef(open); openRef.current = open;
  const activeRef = useRef(onActive); activeRef.current = onActive;
  const lastSaved = useRef<Draft | null>(null);
  const loadDraft = (draft: Draft) => {
    const restored = restoreDraft(draft);
    setD(restored); setStage(draftStage(restored)); setRaw(''); setConsent(false);
    setMessage(`저장된 편집을 복원했습니다. ${draftProgress(summarizeDraft(restored)).action}${restored !== draft ? ' · 깨질 수 있는 문자를 정리했습니다. 기존 원문과 완성 파일은 보관했습니다.' : ''}`);
  };
  const saver = useRef<ReturnType<typeof draftWriter<Draft>> | null>(null);
  if(!saver.current)saver.current=draftWriter<Draft>(async snapshot=>{
    try {
      setSaving(true); const next = await persistDraft(snapshot); setSaved(next); lastSaved.current = snapshot; setSaveError(false);
    } catch {setSaveError(true);setMessage('자동 저장에 실패했습니다. 이 화면을 닫지 말고 저장을 다시 시도해주세요.'); throw Error('저장하지 못해 편집 전환을 멈췄습니다.');}
    finally { setSaving(false); }
  });
  useEffect(() => {
    let mounted = true;
    (async () => {
      let list = await editorStore<DraftSummary[]>('list') || [];
      const id = await editorStore<string>('current'); const draft = id ? await editorStore<Draft>(id) : undefined;
      if (!mounted) return;
      if (draft && hasDraftContent(draft)) {
        const restored = restoreDraft(draft);
        // Migrate only the opened draft; never fetch every saved Blob for status.
        list = await persistDraft(restored, list.find(s => s.id === id)?.updatedAt || 0);
        if (!mounted) return;
        lastSaved.current = restored; loadDraft(restored);
      }
      setSaved(list); setReady(true);
    })().catch(() => { if (mounted) { setMessage('저장된 편집을 읽지 못했습니다. 브라우저 저장 공간을 확인한 뒤 새로고침해주세요. 기존 데이터를 덮어쓰지 않도록 편집을 잠시 잠갔습니다.'); } });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!ready || !hasDraftContent(d) || d === lastSaved.current) return;
    void saver.current!.write(d.id,d).catch(() => {});
  }, [d, ready]);
  useEffect(() => { onIndex?.(saved); }, [saved, onIndex]);
  useEffect(() => { onBusy?.(busy); }, [busy, onBusy]);
  useEffect(() => { if (visible && ready && hasDraftContent(d)) activeRef.current?.(d.id); }, [visible, ready, d.id, hasDraftContent(d)]);
  useEffect(() => {
    if (!visible || !ready || !resumeId || busyRef.current) return;
    void run(async () => { try { await saver.current!.flush(); const loaded = await editorStore<Draft>(resumeId); if (loaded) loadDraft(loaded); else setMessage('저장된 편집을 찾지 못했습니다. 편집 목록에서 확인해주세요.'); } finally { onResumeHandled?.(); } });
  }, [resumeId, ready, visible]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (busyRef.current || (hasDraftContent(currentRef.current) && currentRef.current !== lastSaved.current)) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, []);
  useEffect(() => { setConsent(false); }, [d.plan.narration, d.voice, d.style, d.plan.duration]);
  useEffect(() => {
    const handler = (event: Event) => {
      if (!ready || busyRef.current) return;
      try {
        const payload = (event as CustomEvent).detail;
        if (payload?.version !== 1 || typeof payload.key !== 'string' || payload.key.length > 200) return;
        const plan = importEpisode(payload.episode);
        if(!payload.episode.korean.trim())plan.importWarning='한글 나레이션·자막이 연결되지 않은 기록입니다. 원본 대본을 가져오거나 해설 없는 영상인지 확인해주세요.';
        const id = 'episode-' + payload.key;
        busyRef.current = true; setBusy(true);
        (async () => {
          await saver.current!.flush();
          const existing = await editorStore<Draft>(id);
          if (existing) loadDraft(existing);
          else { setD({ ...fresh(), id, plan, original: payload.episode.korean }); setStage('videos'); setRaw(''); setMessage('이 기록의 대본을 가져왔습니다. Kling 영상 파일을 넣어주세요.'); }
          openRef.current(); document.documentElement.dataset.oriEditorImported = payload.key;
        })().catch(e => setMessage(e.message)).finally(() => { busyRef.current = false; setBusy(false); });
      } catch (e) { setMessage(e instanceof Error ? e.message : '대본 가져오기 실패'); }
    };
    window.addEventListener('orihani-editor-import', handler);
    document.documentElement.dataset.oriEditorReady = ready ? '1' : '0';
    return () => { window.removeEventListener('orihani-editor-import', handler); delete document.documentElement.dataset.oriEditorReady; };
  }, [ready]);
  const change = (patch: Partial<EditPlan>) => setD(v => ({ ...v, plan: { ...v.plan, ...patch } }));
  const cleanText = () => setD(v => restoreDraft(v));
  const run = async (fn: () => Promise<void>) => {
    if (busyRef.current) return; busyRef.current = true; setBusy(true);
    try { await fn(); } catch (e) { setMessage(e instanceof Error ? e.message : '작업 실패'); } finally { busyRef.current = false; setBusy(false); }
  };
  const voiceCurrent = voiceIsCurrent(d);
  const syncCurrent = d.syncKey === syncKey(d);
  const finishedCurrent = resultIsCurrent(d);
  const lengths = clipLengths(d.plan.duration);
  const createVoice = () => run(async () => {
    const cleaned = restoreDraft(d); if (cleaned !== d) { setD(cleaned); throw Error('깨질 수 있는 문자를 정리했습니다. 대본을 확인한 뒤 다시 준비해주세요.'); }
    if (!consent) throw Error('음성 생성·분석 비용 확인란을 체크해주세요.');
    validateMediaSizes(d.videos,d.plan.duration,d.plan.narration.trim()?(d.voiceBlob?.size||0):0);
    setMessage('영상 길이와 파일을 확인 중입니다. 아직 유료 분석은 시작하지 않았습니다.');
    for(let i=0;i<lengths.length;i++)validateMediaDuration(await mediaDuration(d.videos[i]!,'video'),lengths[i],i);
    if(d.plan.importWarning)throw Error(d.plan.importWarning);
    if(/(?:Dialog(?:ue)?|오원장|소미|덕이)\s*[:：]/i.test(d.plan.narration))throw Error('읽을 대본에 등장인물 대사가 있습니다. 해설만 남겨주세요.');
    let working={...d};let originalWords:Word[]=[];let offset=0;
    for(let i=0;i<lengths.length;i++){setMessage(`Kling 대사 시간 확인 중 · ${i+1}/${lengths.length}`);const words=await analyze(d.videos[i]!,lengths[i]);originalWords.push(...words.map(w=>({...w,start:Math.min(offset+lengths[i],w.start+offset),end:Math.min(offset+lengths[i],w.end+offset)})).filter(w=>w.end>w.start));offset+=lengths[i];}
    let dialogue=d.plan.captions.filter(c=>c.source==='dialogue');
    const alignedDialogue=alignCaptions(dialogue,originalWords);
    const dialogueRanges=speechRanges(originalWords,d.plan.duration);
    // Preserve all speech, including unexpected Kling dialogue, instead of ducking it.
    if(d.plan.narration.trim()&&!voiceCurrent){setMessage('해설 나레이션 생성 중입니다. 등장인물 대사는 읽지 않습니다.');const blob=await request('voice',{text:spokenNumbers(d.plan.narration),voice:d.voice,style:d.style,duration:d.plan.duration});working={...working,voiceBlob:blob,voiceKey:voiceKey(d)};setD(working);}
    let narrationWords:Word[]=[];let voiceDuration:number|undefined;
    if(d.plan.narration.trim()){setMessage('해설 음성과 자막 시간을 연결하고 있습니다.');voiceDuration=await mediaDuration(working.voiceBlob!,'audio');narrationWords=await analyze(working.voiceBlob!);if(!narrationWords.length)throw Error('해설 음성에서 발화를 찾지 못했습니다.');}
    const segments=scheduleNarration(narrationWords,d.plan.duration,dialogueRanges,d.plan.voiceSpeed,voiceDuration);
    const onTimeline=placedWords(narrationWords,segments,d.plan.voiceSpeed);
    let narratorCaptions=d.plan.captions.filter(c=>!c.source||c.source==='narration');
    if(!narratorCaptions.length&&d.plan.narration.trim())narratorCaptions=d.plan.narration.split(/(?<=[.!?。])\s+|\n+/).filter(Boolean).map(text=>({text,start:0,end:d.plan.duration,source:'narration' as const}));
    const captions=[...alignCaptions(narratorCaptions,onTimeline),...alignedDialogue,...d.plan.captions.filter(c=>c.source==='screen')].sort((a,b)=>a.start-b.start);
    for(let i=1;i<captions.length;i++)if(captions[i].start<captions[i-1].end)captions[i].review='앞 자막과 겹칩니다. 시간을 확인해주세요.';
    working={...working,plan:{...working.plan,captions,voiceSegments:segments,dialogueRanges}};working.syncKey=syncKey(working);setD(working);
    setMessage(captions.some(c=>c.review)?'음성 준비 완료. 확인 표시가 있는 자막만 검토해주세요.':'음성과 자동 싱크가 준비되었습니다. 미리듣기 후 영상을 완성하세요.');
  });
  const makeVideo = () => run(async () => {
    const cleaned = restoreDraft(d); if (cleaned !== d) { setD(cleaned); throw Error('자막 문자를 정리했습니다. 문구를 확인한 뒤 다시 완성해주세요.'); }
    validatePlan(d.plan);
    if(!syncCurrent)throw Error('음성·자동 싱크 준비를 먼저 실행해주세요.');
    if(d.plan.captions.some(c=>c.review))throw Error('확인 표시가 있는 자막을 검토해주세요.');
    if (!voiceCurrent) throw Error('현재 대본에 맞는 음성을 먼저 만들어주세요.');
    if (d.videos.filter(Boolean).length !== lengths.length) throw Error('각 칸에 Kling 영상 파일을 넣어주세요.');
    if (d.plan.narration.trim() && !d.plan.voiceSegments?.length && audioLength / d.plan.voiceSpeed > d.plan.duration + 0.05) throw Error('음성이 영상보다 깁니다. 대본이나 속도를 조절해주세요.');
    validateMediaSizes(d.videos,d.plan.duration,d.plan.narration.trim()?(d.voiceBlob?.size||0):0);
    const body = new FormData(); body.append('plan', JSON.stringify(d.plan));
    d.videos.forEach(f => body.append('videos', f)); if(d.plan.narration.trim())body.append('voice', d.voiceBlob, 'narration.wav');
    setMessage('영상·음성·자막을 합치는 중입니다. 완료될 때까지 이 창을 열어두세요.');
    const blob = await request('render', body); setD(v => ({ ...v, result: blob, resultKey: resultKey(v) }));
    setStage('result');
    setMessage('완성되었습니다. 아래 영상에서 소리와 자막을 확인하고 다운로드해주세요.');
  });
  return <section className="ori-editor" hidden={!visible}>
    <div className="ori-editor-inner">
      <header><div><p className="ori-eyebrow">이 기기에 저장된 작업</p><h2>{d.plan.title || '영상 편집'}</h2><p>{hasDraftContent(d) ? draftProgress(summarizeDraft(d)).label : 'Kling 영상과 대본을 넣어 시작하세요.'}</p></div></header>
      <p role="status" aria-live="polite" className="ori-status">{message}</p>
      <p className="ori-save-status">{!ready ? '저장소 확인 중' : saving ? '이 기기에 저장 중… 저장이 끝난 뒤 닫아주세요.' : hasDraftContent(d) && d === lastSaved.current ? '이 브라우저에 저장됨 · 다른 기기와 자동 동기화되지 않습니다.' : hasDraftContent(d) ? '변경 내용을 저장 중입니다.' : '내용이 없는 새 편집은 저장하지 않습니다.'}</p>
      <fieldset disabled={busy || !ready}>
        {saveError&&<button onClick={()=>run(async()=>{await saver.current!.write(d.id,d);setMessage('이 브라우저에 저장했습니다.');})}>자동 저장 다시 시도</button>}
        <details className="ori-editor-manage"><summary>다른 편집 고르기 / 새 편집</summary><div className="ori-row"><label>편집할 콘텐츠<select value={d.id} onChange={e => { const id = e.target.value; run(async () => { await saver.current!.flush(); const loaded = await editorStore<Draft>(id); if (loaded) loadDraft(loaded); }); }}><option value={d.id}>{d.plan.title || '새 편집'}</option>{saved.filter(x => x.id !== d.id).map(x => <option key={x.id} value={x.id}>{x.title} · {draftProgress(x).label}</option>)}</select></label><button onClick={() => run(async () => { await saver.current!.flush(); setD(fresh()); setStage('videos'); setRaw(''); setConsent(false); setMessage('새 영상과 대본을 넣어주세요.'); })}>새 편집</button></div></details>
        <div className="ori-editor-steps" role="group" aria-label="편집 단계">{([['videos','1. 영상'],['voice','2. 음성'],['captions','3. 자막'],['result','4. 완성본']] as const).map(([value,label])=><button key={value} aria-pressed={stage===value} onClick={()=>setStage(value)}>{label}</button>)}</div>
        <article hidden={stage!=='videos'}><h3>1. Kling 영상 넣기</h3>
          <label>콘텐츠 이름<input value={d.plan.title} maxLength={300} onChange={e => change({ title: e.target.value })} onBlur={cleanText} placeholder="이번 밈 제목" /></label>
          <div className="ori-row"><button aria-pressed={d.plan.duration === 5} disabled={d.plan.duration === 5} onClick={() => { change({ duration: 5, captions: [], voiceSegments:undefined, dialogueRanges:undefined }); setD(v => ({ ...v, videos: [] })); }}>5초 · 영상 한 개</button><button aria-pressed={d.plan.duration === 15} disabled={d.plan.duration === 15} onClick={() => { change({ duration: 15, captions: [], voiceSegments:undefined, dialogueRanges:undefined }); setD(v => ({ ...v, videos: [] })); }}>15초 · 영상 네 개</button></div>
          <div className="ori-files">{lengths.map((length, i) => <label key={`${d.id}-${d.plan.duration}-${i}`} className="ori-file">{i + 1}번 영상 · {length}초<input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={e => { const f = e.target.files?.[0]; if (f) setD(v => ({ ...v, syncKey: undefined, resultKey: undefined, videos: Array.from({ length: lengths.length }, (_, n) => n === i ? f : v.videos[n] || null) })); }} /><span>{d.videos[i]?.name || '파일을 선택해주세요'}</span></label>)}</div>
        </article>
        <article hidden={stage!=='voice'}><h3>2. 해설 음성과 자동 싱크</h3><p>등장인물 대사는 Kling 원본 소리를 사용합니다. 아래에는 해설만 적으세요. 해설이 없는 영상은 비워두면 됩니다.</p>
          {d.plan.importWarning&&<p className="ori-note">{d.plan.importWarning}<button onClick={()=>change({importWarning:undefined})}>해설 구분 확인했음</button></p>}
          <label>읽을 대본<textarea rows={3} maxLength={1200} value={d.plan.narration} onChange={e => change({ narration: e.target.value })} onBlur={cleanText} /></label>
          {/\d/.test(d.plan.narration) && <p className="ori-note">자동으로 읽을 발음: {spokenNumbers(d.plan.narration)} · 자막 숫자는 유지됩니다.</p>}
          <details><summary>목소리·읽는 느낌 조절</summary><label>목소리<select value={d.voice} onChange={e => setD(v => ({ ...v, voice: e.target.value }))}><option value="Zubenelgenubi">편안한 말투 · Zubenelgenubi</option><option value="Achird">친근한 말투 · Achird</option><option value="Algenib">거친 음색 · Algenib</option><option value="Kore">단단한 말투 · Kore</option><option value="Puck">발랄한 말투 · Puck</option></select></label><label>읽는 느낌<textarea value={d.style} maxLength={500} onChange={e => setD(v => ({ ...v, style: e.target.value }))} /></label><p>VLLO의 ‘털털한 정국’과 동일한 목소리는 아닙니다. 미리듣기로 골라주세요.</p></details>
          <label className="ori-check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />해설과 대사를 확인했습니다. 음성 생성·분석 시 Gemini 비용이 발생합니다. 저장된 분석은 재사용합니다.</label>
          <button className="ori-primary" disabled={!consent || lengths.some((_,i)=>!d.videos[i]) || (voiceCurrent&&syncCurrent)} onClick={createVoice}>{voiceCurrent&&syncCurrent ? '음성·자동 싱크 준비 완료' : '음성·자동 싱크 준비'}</button>
          {audioURL && d.plan.narration.trim() && <div className="ori-audio"><audio ref={audioRef} controls src={audioURL} onLoadedMetadata={e => {setAudioLength(e.currentTarget.duration);e.currentTarget.playbackRate=d.plan.voiceSpeed;}} /><a href={audioURL} download="나레이션.wav">음성 다운로드</a>{!voiceCurrent && <p>대본 또는 목소리가 바뀌었습니다. 음성을 다시 만들어주세요.</p>}</div>}
          <details><summary>음성 속도·고급 음량</summary><div className="ori-row"><label>음성 속도<input type="range" min="0.8" max="1.25" step="0.05" value={d.plan.voiceSpeed} onChange={e => change({ voiceSpeed: +e.target.value })} />{d.plan.voiceSpeed}배 · 적용 길이 {audioLength ? (audioLength / d.plan.voiceSpeed).toFixed(1) : '—'}초</label><label>Kling 원래 소리<select value={d.plan.originalVolume} onChange={e => change({ originalVolume: +e.target.value })}><option value={0.2}>작게 유지 · 20%</option><option value={1}>그대로 유지 · 100%</option><option value={0}>끄기</option></select></label><label>해설 음량<input type="range" min="0" max="1" step="0.05" value={d.plan.voiceVolume} onChange={e=>change({voiceVolume:+e.target.value})}/>{Math.round(d.plan.voiceVolume*100)}%</label></div><p>등장인물 대사 구간은 원본 소리를 그대로 유지합니다.</p></details>
          <details><summary>원본 대본 확인 / 직접 가져오기</summary>{d.original && <pre>{d.original}</pre>}{d.textBackup&&<details><summary>문자 정리 전 편집 원문</summary><pre>{JSON.stringify(d.textBackup,null,2)}</pre></details>}<textarea aria-label="가져올 원본 대본" rows={6} value={raw} onChange={e=>setRaw(e.target.value)} placeholder="한글 나레이션 및 자막 부분을 붙여넣으세요"/><button onClick={()=>{try{const p=importEpisode({duration:d.plan.duration,korean:raw,title:d.plan.title,thumbnail:d.plan.thumbnail});setD(v=>({...v,plan:{...v.plan,narration:p.narration,captions:p.captions,importWarning:p.importWarning},original:raw}));setMessage('대본을 가져오고 깨질 수 있는 문자를 정리했습니다. 해설과 자막을 확인해주세요.');}catch(e){setMessage(e.message);}}}>대본에서 나레이션·자막 가져오기</button></details>
        </article>
        <article hidden={stage!=='captions'}><h3>3. 자막과 첫 화면 문구</h3><p>음성에서 찾은 발화 시간으로 자동 정렬합니다. 확인 표시가 있는 문장만 검토하세요. 등장인물 대사 구간의 원본 소리는 유지됩니다.</p><p className="ori-note">이모티콘과 지원되지 않는 장식 문자는 자동 정리합니다. 한글·영문·숫자·일반 문장부호는 유지합니다.</p>
          {d.plan.captions.map((c, i) => <div className="ori-caption-card" key={i}>
            <div className="ori-caption-heading"><strong>{i+1}. {c.source==='dialogue'?'등장인물 대사':c.source==='screen'?'화면 문구':'해설'}</strong><span>{c.start.toFixed(2)}–{c.end.toFixed(2)}초</span></div>
            <label>자막 {i+1}<textarea rows={2} maxLength={160} value={c.text} onChange={e=>change({captions:d.plan.captions.map((r,n)=>n===i?{...r,text:e.target.value}:r)})} onBlur={cleanText}/></label>
            {c.review&&<p className="ori-note">{c.review}<button onClick={()=>change({captions:d.plan.captions.map((r,n)=>n===i?{...r,review:undefined}:r)})}>이 자막 확인했음</button></p>}
            <details><summary>종류·시간 조절 / 삭제</summary><div className="ori-row">
              <label>자막 종류<select value={c.source||'narration'} onChange={e=>change({captions:d.plan.captions.map((r,n)=>n===i?{...r,source:e.target.value as any}:r)})}><option value="narration">해설</option><option value="dialogue">등장인물 대사</option><option value="screen">화면 문구 · 시간 유지</option></select></label>
              <label>시작(초)<input type="number" min="0" max={d.plan.duration} step="0.1" value={Number(c.start.toFixed(2))} onChange={e=>change({captions:d.plan.captions.map((r,n)=>n===i?{...r,start:+e.target.value}:r)})}/></label>
              <label>끝(초)<input type="number" min="0" max={d.plan.duration} step="0.1" value={Number(c.end.toFixed(2))} onChange={e=>change({captions:d.plan.captions.map((r,n)=>n===i?{...r,end:+e.target.value}:r)})}/></label>
              <button onClick={()=>change({captions:d.plan.captions.filter((_,n)=>n!==i)})}>자막 {i+1} 삭제</button>
            </div></details>
          </div>)}
          <button disabled={d.plan.captions.length >= 30} onClick={() => { const start = d.plan.captions.at(-1)?.end || 0; if (start < d.plan.duration) change({ captions: [...d.plan.captions, { start, end: d.plan.duration, text: '' }] }); }}>자막 추가</button>
          <label>처음 0~1초에 표시할 문구<textarea rows={2} maxLength={100} value={d.plan.thumbnail} onChange={e=>change({thumbnail:e.target.value})} onBlur={cleanText} placeholder="화면 위쪽 25% 위치에 표시합니다"/></label>
        </article>
        <div className="ori-step-next">
          {stage==='videos'&&<><p className="ori-next">{lengths.some((_,i)=>!d.videos[i])?'각 칸에 Kling 영상 파일을 넣어주세요.':'영상 입력 완료. 해설과 자막을 준비할 차례입니다.'}</p><button className="ori-primary ori-finish" disabled={lengths.some((_,i)=>!d.videos[i])} onClick={()=>setStage('voice')}>다음: 음성·자막 준비</button></>}
          {stage==='voice'&&voiceCurrent&&syncCurrent&&<button className="ori-primary ori-finish" onClick={()=>setStage('captions')}>미리듣기 확인 후 자막 확인하기</button>}
          {stage==='voice'&&lengths.some((_,i)=>!d.videos[i])&&<button onClick={()=>setStage('videos')}>먼저 Kling 영상 넣기</button>}
          {stage==='captions'&&<><p className="ori-next">{!syncCurrent?'음성·자동 싱크를 먼저 준비해주세요.':d.plan.captions.some(c=>c.review)?'확인 표시가 있는 자막을 검토해주세요.':'문구와 시간을 확인한 뒤 MP4를 만드세요.'}</p>{!syncCurrent&&<button onClick={()=>setStage('voice')}>음성·자동 싱크로 이동</button>}</>}
          {stage==='result'&&!resultURL&&<><p>아직 완성 영상이 없습니다.</p><button className="ori-primary" onClick={()=>setStage(draftStage(d))}>편집 이어하기</button></>}
        </div>
        {stage==='captions'&&<button className="ori-primary ori-finish" disabled={!voiceCurrent || !syncCurrent || d.plan.captions.some(c=>c.review) || lengths.some((_,i)=>!d.videos[i]) || finishedCurrent} onClick={makeVideo}>{busy?'처리 중…':finishedCurrent?'현재 설정으로 완성됨':'음성·자막 넣고 영상 완성'}</button>}
        {stage==='captions'&&finishedCurrent&&<button className="ori-primary ori-finish" onClick={()=>setStage('result')}>완성 영상 확인·저장</button>}
      </fieldset>
      {stage==='result'&&resultURL&&<article><h3>{finishedCurrent?'완성 영상':'이전 설정의 완성 영상'}</h3>{!finishedCurrent&&<p className="ori-note">현재 문구·설정의 결과가 아닙니다. 이전 파일은 보관되어 있으며, 문자 정리를 적용하려면 다시 완성해주세요.</p>}<video className="ori-result" controls playsInline src={resultURL}/><a className="ori-download" href={resultURL} download={`${finishedCurrent?'':'이전설정_'}${d.plan.title.replace(/[\\/:*?"<>|]/g,'').slice(0,80)||'오리쇼츠'}.mp4`}>{finishedCurrent?'완성 MP4 다운로드':'이전 설정 MP4 다운로드'}</a><button disabled={busy} className="ori-download" onClick={()=>run(async()=>{const name=(d.plan.title||'오리쇼츠').replace(/[\\/:*?"<>|]/g,'').slice(0,80);await shareFile(new File([d.result!],(finishedCurrent?'':'이전설정_')+name+'.mp4',{type:'video/mp4'}));})}>{finishedCurrent?'완성 영상 공유·저장':'이전 영상 공유·저장'}</button>{!finishedCurrent&&<button className="ori-primary ori-finish" onClick={()=>setStage(draftStage(d))}>현재 설정으로 편집 이어하기</button>}</article>}
    </div>
  </section>;
}
