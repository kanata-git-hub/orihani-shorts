import { useEffect, useId, useMemo, useState } from 'react';
import { downloadFile } from '../workflow/share';
import { renderThumbnail, thumbnailDimensions, type ThumbnailAspectRatio } from './render';
import { validateThumbnailSettings, type ThumbnailSettings } from './settings';
import './thumbnail.css';

export type { ThumbnailSettings } from './settings';

type RenderRequest = {
  imageSrc: string;
  title: string;
  showTitle: boolean;
  position: 'top' | 'bottom';
  aspectRatio: ThumbnailAspectRatio;
  retry: number;
};
type Preview = { request: RenderRequest; url?: string; blob?: Blob; error?: string };

function useThumbnailPreview(request: RenderRequest) {
  const [preview, setPreview] = useState<Preview>();
  useEffect(() => {
    let cancelled = false, objectURL: string | undefined;
    const timer = setTimeout(() => {
      renderThumbnail(request.imageSrc, request, request.aspectRatio).then(result => {
        if (cancelled) return;
        objectURL = URL.createObjectURL(result.blob);
        setPreview({ request, blob: result.blob, url: objectURL });
      }).catch(cause => {
        if (!cancelled) setPreview({ request, error: cause instanceof Error ? cause.message : '썸네일을 만들지 못했습니다.' });
      });
    }, request.showTitle ? 150 : 0);
    return () => {
      cancelled = true; clearTimeout(timer);
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [request]);
  // Compare during render as well as in the effect: an old JPEG is never exportable
  // in the render immediately following a title, position, image, or ratio change.
  return preview?.request === request ? { ...preview, pending: false } : { pending: true, url: undefined, blob: undefined, error: undefined };
}

function fileBase(value: string): string {
  return value.normalize('NFC').replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, 100).replace(/[. ]+$/, '') || '오리쇼츠';
}

export function ThumbnailEditor({ imageSrc, initialSettings, aspectRatio, filenameBase, disabled = false, onSave, onClose }: {
  imageSrc: string;
  initialSettings: ThumbnailSettings;
  aspectRatio: ThumbnailAspectRatio;
  filenameBase: string;
  disabled?: boolean;
  onSave: (settings: ThumbnailSettings) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ThumbnailSettings>(() => ({ ...initialSettings }));
  const [retry, setRetry] = useState(0);
  const [actionError, setActionError] = useState('');
  const [saved, setSaved] = useState(false);
  const titleId = useId(), helpId = useId(), headingId = useId();
  const titledRequest = useMemo<RenderRequest>(() => ({ imageSrc, title: draft.title, showTitle: true, position: draft.position, aspectRatio, retry }), [imageSrc, draft.title, draft.position, aspectRatio, retry]);
  const cleanRequest = useMemo<RenderRequest>(() => ({ imageSrc, title: '', showTitle: false, position: 'top', aspectRatio, retry }), [imageSrc, aspectRatio, retry]);
  const titled = useThumbnailPreview(titledRequest), clean = useThumbnailPreview(cleanRequest);
  const active = draft.showTitle ? titled : clean;
  const dimensions = thumbnailDimensions(aspectRatio);
  let settingsError = '';
  try { validateThumbnailSettings(draft, [initialSettings.imageTitle]); }
  catch (cause) { settingsError = cause instanceof Error ? cause.message : '썸네일 설정을 확인해주세요.'; }
  const patch = (value: Partial<ThumbnailSettings>) => { setDraft(previous => ({ ...previous, ...value })); setActionError(''); setSaved(false); };
  const download = (blob: Blob | undefined, variant: 'title' | 'clean') => {
    if (!blob || disabled) return;
    try {
      downloadFile(new File([blob], `${fileBase(filenameBase)}_썸네일_${variant === 'title' ? '제목' : '글자없음'}.jpg`, { type: 'image/jpeg' }));
      setActionError('');
    } catch { setActionError('썸네일을 다운로드하지 못했습니다. 다시 시도해주세요.'); }
  };
  const save = () => {
    if (disabled || active.pending || !active.blob) return;
    try {
      const settings = validateThumbnailSettings(draft, [initialSettings.imageTitle]);
      if (settings) { onSave(settings); setSaved(true); setActionError(''); }
    } catch (cause) { setSaved(false); setActionError(cause instanceof Error ? cause.message : '썸네일 설정을 저장하지 못했습니다.'); }
  };

  return <section className="ori-thumbnail-editor" aria-labelledby={headingId}>
    <div className="ori-thumbnail-heading">
      <div><p className="ori-thumbnail-eyebrow">선택한 주요 장면으로</p><h4 id={headingId}>썸네일 전용 편집</h4></div>
      <button type="button" onClick={onClose} disabled={disabled} aria-label="썸네일 편집 닫기">닫기</button>
    </div>
    <p className="ori-thumbnail-note">원본 주요 장면은 그대로 두고, 별도의 썸네일 JPG를 만듭니다.</p>
    <div className="ori-thumbnail-layout">
      <div className="ori-thumbnail-controls">
        <fieldset disabled={disabled}>
          <legend>썸네일 문구</legend>
          <div className="ori-thumbnail-options" aria-label="썸네일 제목 표시">
            <button type="button" aria-pressed={draft.showTitle} onClick={() => patch({ showTitle: true })}>제목 포함</button>
            <button type="button" aria-pressed={!draft.showTitle} onClick={() => patch({ showTitle: false })}>글자 없이</button>
          </div>
          <label htmlFor={titleId}>짧은 제목</label>
          <textarea id={titleId} rows={2} value={draft.title} aria-describedby={helpId}
            aria-invalid={Boolean(settingsError)} placeholder="공개 제목을 짧게 적어주세요"
            onChange={event => patch({ title: event.target.value })} />
          <div className="ori-thumbnail-input-note" id={helpId}><span>최대 두 줄 · 대사 자막과 별도</span><span>{Array.from(draft.title).length}/80자</span></div>
          <div className="ori-thumbnail-position-label">제목 위치</div>
          <div className="ori-thumbnail-options" aria-label="썸네일 제목 위치">
            <button type="button" aria-pressed={draft.position === 'top'} onClick={() => patch({ position: 'top' })}>위쪽</button>
            <button type="button" aria-pressed={draft.position === 'bottom'} onClick={() => patch({ position: 'bottom' })}>아래쪽</button>
          </div>
          <p className="ori-thumbnail-tip">얼굴과 중요한 장면을 가리지 않는 위치를 골라주세요. 글자가 길면 두 줄로 맞추며, 너무 길면 다운로드 전에 알려드립니다.</p>
        </fieldset>
        {settingsError && <p className="ori-thumbnail-error" role="alert">{settingsError}</p>}
      </div>
      <figure className="ori-thumbnail-preview">
        <div className={'ori-thumbnail-frame ' + (aspectRatio === '16:9' ? 'ori-thumbnail-landscape' : 'ori-thumbnail-portrait')}
          style={{ aspectRatio: aspectRatio.replace(':', ' / ') }} aria-busy={active.pending}>
          {active.url && <img src={active.url} alt={draft.showTitle ? `제목 포함 썸네일 미리보기: ${draft.title}` : '글자 없는 썸네일 미리보기'} />}
          {!active.url && <div className="ori-thumbnail-placeholder" role="status">{active.pending ? '썸네일 미리보기 만드는 중…' : '제목을 확인하거나 글자 없는 버전을 선택해주세요.'}</div>}
        </div>
        <figcaption>{draft.showTitle ? '제목 포함' : '글자 없음'} · {dimensions.width} × {dimensions.height} JPG<br />미리보기와 같은 파일을 다운로드합니다.</figcaption>
      </figure>
    </div>
    {(active.error && active.error !== settingsError) && <p className="ori-thumbnail-error" role="alert">{active.error}</p>}
    {active.error && <button type="button" className="ori-thumbnail-retry" disabled={disabled} onClick={() => setRetry(value => value + 1)}>미리보기 다시 만들기</button>}
    <div className="ori-thumbnail-downloads">
      <button type="button" className="ori-thumbnail-download-title" disabled={disabled || titled.pending || !titled.blob} onClick={() => download(titled.blob, 'title')}>제목 포함 JPG 다운로드</button>
      <button type="button" disabled={disabled || clean.pending || !clean.blob} onClick={() => download(clean.blob, 'clean')}>글자 없는 JPG 다운로드</button>
    </div>
    {actionError && <p className="ori-thumbnail-error" role="alert">{actionError}</p>}
    <div className="ori-thumbnail-save">
      <p>제목·위치·선택한 장면을 저장해 다음에도 이어서 편집할 수 있습니다.</p>
      <button type="button" disabled={disabled || Boolean(settingsError) || active.pending || !active.blob} onClick={save}>썸네일 설정 저장</button>
    </div>
    {saved && <p className="ori-thumbnail-save-success" role="status">썸네일 설정을 저장했습니다.</p>}
    <p className="ori-thumbnail-note">이미지 전체를 유지합니다. 화면 비율이 다르면 빈 공간이 생길 수 있습니다.</p>
  </section>;
}
