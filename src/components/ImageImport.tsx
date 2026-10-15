import { useState } from 'react';
import { importImage } from '../workflow/importImage';

export function ImageImport({ title, disabled, hasImage, onApply }: { title: string; disabled?: boolean; hasImage?: boolean; onApply: (title: string, image: string) => Promise<boolean> }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  return <div className="ori-image-import">
    <label className="ori-image-import-label">{busy ? '이미지 저장 중…' : hasImage ? '직접 만든 이미지로 바꾸기' : '직접 만든 이미지 가져오기'}
      <input aria-label={`${title} 이미지 가져오기`} disabled={disabled || busy} type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
        setBusy(true); setMessage('');
        try { const image = await importImage(file); if (!await onApply(title, image)) throw Error('이미지를 저장하지 못했습니다. 다시 시도해주세요.'); setMessage('이미지를 저장했습니다.'); }
        catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
      }}/>
    </label>
    <small>ChatGPT·Gemini 등에서 만든 PNG·JPG·WebP · 장당 8MB 이하</small>
    {message && <p role="status">{message}</p>}
  </div>;
}
