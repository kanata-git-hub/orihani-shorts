import { useEffect, useRef, useState } from 'react';
import { EditPlan, validatePlan } from './model';

type Overlay = { start: number; end?: number; dataUrl: string; kind: 'caption' | 'brand' };
type PreviewResult = { key: string; overlays: Overlay[] };

export function ClinicCaptionPreview({ plan, file, loadPreview, onBusy }: {
  plan: EditPlan;
  file?: File | null;
  loadPreview: (plan: EditPlan) => Promise<unknown>;
  onBusy: (value: boolean) => void;
}) {
  const [url, setURL] = useState('');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ratio, setRatio] = useState('9 / 16');
  const [preview, setPreview] = useState<PreviewResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const requestId = useRef(0);
  const animation = useRef<number | undefined>(undefined);
  const key = JSON.stringify([plan.captionStyle, plan.duration, plan.captions, plan.clinicBrandStart]);
  const current = preview?.key === key;
  useEffect(() => {
    setTime(0); setDuration(0);
    if (!file) { setURL(''); return; }
    const value = URL.createObjectURL(file); setURL(value);
    return () => URL.revokeObjectURL(value);
  }, [file]);
  useEffect(() => () => {
    requestId.current += 1;
    if (animation.current !== undefined) cancelAnimationFrame(animation.current);
    onBusy(false);
  }, [onBusy]);
  const stop = () => {
    if (animation.current !== undefined) cancelAnimationFrame(animation.current);
    animation.current = undefined;
    if (video.current) setTime(video.current.currentTime);
  };
  const tick = () => {
    if (!video.current || video.current.paused || video.current.ended) return;
    setTime(video.current.currentTime);
    animation.current = requestAnimationFrame(tick);
  };
  const prepare = async () => {
    const id = ++requestId.current;
    try {
      validatePlan(plan);
      setLoading(true); onBusy(true); setError('');
      const data = await loadPreview(plan) as { overlays?: Overlay[] };
      if (!Array.isArray(data.overlays) || data.overlays.some(o =>
        !Number.isFinite(o.start) || o.start < 0 ||
        (o.end !== undefined && (!Number.isFinite(o.end) || o.end <= o.start)) ||
        !['caption', 'brand'].includes(o.kind) ||
        typeof o.dataUrl !== 'string' || !o.dataUrl.startsWith('data:image/png;base64,')
      )) throw Error('자막 미리보기를 불러오지 못했습니다.');
      if (id === requestId.current) setPreview({ key, overlays: data.overlays });
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : '자막 미리보기에 실패했습니다.');
    } finally {
      if (id === requestId.current) { setLoading(false); onBusy(false); }
    }
  };
  const overlays = current && preview ? preview.overlays.filter(o => {
    const end = o.kind === 'caption' && o.end === plan.duration && duration ? duration : o.end;
    return time >= o.start && (end === undefined || time < end);
  }) : [];
  return <div className="ori-clinic-preview">
    <div className="ori-row"><strong>영상에 자막 미리보기</strong><button disabled={!file || loading} onClick={prepare}>{loading ? '미리보기 준비 중…' : current ? '미리보기 새로고침' : '자막 미리보기'}</button></div>
    {!file && <p>먼저 완성 영상 한 개를 넣어주세요.</p>}
    {error && <p className="ori-note" role="alert">{error}</p>}
    {preview && !current && <p className="ori-note">문구나 시간이 바뀌었습니다. 미리보기를 새로고침해주세요.</p>}
    {url && <>
      <div className="ori-clinic-preview-frame" style={{ aspectRatio: ratio }}>
        <video ref={video} controls playsInline preload="metadata" src={url}
          onLoadedMetadata={e => {
            const v = e.currentTarget;
            setDuration(v.duration);
            if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth + ' / ' + v.videoHeight);
          }}
          onPlay={() => { stop(); tick(); }}
          onPause={stop} onEnded={stop}
          onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
          onSeeked={e => setTime(e.currentTarget.currentTime)} />
        {overlays.map((o, i) => <img key={o.kind + '-' + i} src={o.dataUrl} alt="" aria-hidden="true" draggable={false} />)}
      </div>
      <p className="ori-preview-time">현재 {time.toFixed(2)}초 / 원본 {Number.isFinite(duration) ? duration.toFixed(3) : '—'}초</p>
    </>}
    <p>완성본과 같은 글꼴·테두리로 확인합니다. 영상을 재생하면서 아래 자막 시간을 맞춰주세요.</p>
  </div>;
}
