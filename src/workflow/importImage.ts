export const MAX_IMPORT_IMAGE_BYTES = 8 * 1024 * 1024;
export function imageMime(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  throw Error('PNG·JPG·WebP 이미지 파일을 선택해주세요.');
}
export async function importImage(file: File): Promise<string> {
  if (!file.size || file.size > MAX_IMPORT_IMAGE_BYTES) throw Error('이미지는 한 장당 8MB 이하로 넣어주세요.');
  const mime = imageMime(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  const blob = new Blob([file], { type: mime });
  const bitmap = await createImageBitmap(blob).catch(() => { throw Error('이미지 파일을 읽지 못했습니다. 원본을 다시 다운로드해주세요.'); });
  const valid = bitmap.width > 0 && bitmap.height > 0 && bitmap.width * bitmap.height <= 50000000;
  bitmap.close();
  if (!valid) throw Error('이미지 크기를 확인해주세요. 최대 5천만 화소입니다.');
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(Error('이미지를 읽지 못했습니다.')); reader.readAsDataURL(blob); });
}
