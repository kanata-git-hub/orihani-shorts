import { useRef } from 'react';
import { Expand, X } from 'lucide-react';

/** A small, uncropped preview; the original remains available in a modal and downloads. */
export function ImagePreview({ src, alt }: { src: string; alt: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <div className="ori-image-preview">
    <button type="button" className="ori-image-preview-open" aria-label={`${alt} 크게 보기`}
      onClick={() => dialog.current?.showModal()}>
      <img src={src} alt={alt} referrerPolicy="no-referrer" />
      <span><Expand size={14} aria-hidden="true" />확대</span>
    </button>
    <dialog ref={dialog} className="ori-image-dialog" aria-label={`${alt} 확대`}
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="ori-image-dialog-content">
        <header><span>{alt}</span><button type="button" aria-label="확대 이미지 닫기" onClick={() => dialog.current?.close()}><X size={22} aria-hidden="true" /></button></header>
        <img src={src} alt={alt} referrerPolicy="no-referrer" />
      </div>
    </dialog>
  </div>;
}
