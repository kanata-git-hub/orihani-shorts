import { createHash } from 'node:crypto';
import { readProductionPackage } from '../../src/workflow/productionPackage';
import { imageMime, MAX_IMPORT_IMAGE_BYTES } from '../../src/workflow/importImage';
import { latestWeekly, WEEKLY_FOLDER, type LatestWeekly } from './weekly';

const MAX_EPISODE_BYTES = 24 * 1024 * 1024;
type DriveImage = {id: string; mimeType: string; size: string; trashed?: boolean};
async function boundedBytes(response: Response, limit: number): Promise<Buffer> {
  if (!response.ok) throw Error(`Drive 이미지를 읽지 못했습니다(${response.status}).`);
  if (Number(response.headers.get('content-length')) > limit) throw Error('Drive 이미지가 너무 큽니다.');
  const reader = response.body?.getReader();
  if (!reader) throw Error('Drive에서 빈 이미지가 반환되었습니다.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const {done,value} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > limit) throw Error('Drive 이미지가 너무 큽니다.');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  if (!size) throw Error('Drive 이미지가 비어 있습니다.');
  return Buffer.concat(chunks);
}

// Read only images named by the current package and located in its fixed folder.
// Client URLs/IDs and redirects are not accepted; server keys stay on Google API.
export function createWeeklyImagesReader(options: {key: () => string | undefined; weekly: () => Promise<LatestWeekly>; fetch?: typeof fetch}) {
  const request = options.fetch || fetch;
  return async (number: number, revision: string) => {
    if (!Number.isInteger(number) || number < 1 || !revision || revision.length > 200) throw Error('제작안 회차와 버전을 확인해주세요.');
    const latest = await options.weekly();
    const packs = (latest.sources || [latest]).filter(s => s.text.trim().startsWith('{')).map(s => readProductionPackage(s.text));
    const matches = packs.filter(p => p.revision === revision);
    if (!matches.length) throw Error('제작안이 갱신되었습니다. 최신 제작안을 다시 확인해주세요.');
    const entries = matches.flatMap(p => p.episodes.filter(e => e.number === number));
    if (entries.length > 1) throw Error('제작안 회차와 버전이 중복됩니다. 최신 제작안을 확인해주세요.');
    const entry = entries[0];
    if (!entry?.assets) throw Error('이 제작안에는 Drive 이미지가 연결되어 있지 않습니다.');
    const key = options.key(); if (!key) throw Error('서버의 Drive 연결 키 설정이 필요합니다.');
    const init = {headers: {'x-goog-api-key': key}, signal: AbortSignal.timeout(60000), redirect: 'error' as const};
    // Public files.get metadata need not expose parents. Prove membership with
    // the same fixed-folder query used by the working production-package picker.
    const files = new Map<string, DriveImage>(); let pageToken: string | undefined;
    for (let page = 0; page < 10; page++) {
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.search = new URLSearchParams({q: `'${WEEKLY_FOLDER}' in parents and trashed = false`, pageSize: '1000',
        fields: 'nextPageToken,incompleteSearch,files(id,mimeType,size,trashed)', ...(pageToken ? {pageToken} : {})}).toString();
      const listing = JSON.parse((await boundedBytes(await request(url, init), 2500000)).toString('utf8'));
      if (!Array.isArray(listing.files) || listing.incompleteSearch) throw Error('Drive 이미지 목록이 완전하지 않습니다. 다시 시도해주세요.');
      for (const file of listing.files) {
        if (typeof file?.id !== 'string' || files.has(file.id)) throw Error('Drive 이미지 목록을 확인하지 못했습니다.');
        files.set(file.id, file);
      }
      pageToken = listing.nextPageToken;
      if (!pageToken) break;
      if (typeof pageToken !== 'string' || page === 9) throw Error('Drive 이미지 목록이 너무 길어 확인하지 못했습니다.');
    }
    // Validate every selected file before downloading any image bytes.
    let expectedTotal = 0;
    for (const asset of Object.values(entry.assets)) {
      const meta = files.get(asset.fileId);
      if (!meta || meta.trashed) throw Error('제작안에 연결된 이미지가 Drive 제작안 폴더에 없습니다.');
      if (!['image/png','image/jpeg','image/webp'].includes(meta.mimeType)) throw Error('제작안 이미지의 파일 형식을 확인해주세요.');
      const size = Number(meta.size); expectedTotal += size;
      if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_IMPORT_IMAGE_BYTES || expectedTotal > MAX_EPISODE_BYTES) throw Error('Drive 이미지 용량을 확인해주세요.');
    }
    const images: Record<string,string> = {}; let total = 0;
    for (const [name, asset] of Object.entries(entry.assets)) {
      const fileUrl = `https://www.googleapis.com/drive/v3/files/${asset.fileId}`;
      const meta = files.get(asset.fileId)!;
      const size = Number(meta.size);
      const bytes = await boundedBytes(await request(fileUrl + '?alt=media', init), Math.min(MAX_IMPORT_IMAGE_BYTES, MAX_EPISODE_BYTES - total));
      if (bytes.length !== size || imageMime(bytes) !== meta.mimeType || createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw Error('Drive 이미지가 제작안의 원본과 다릅니다.');
      total += bytes.length;
      images[name] = `data:${meta.mimeType};base64,${bytes.toString('base64')}`;
    }
    return {number,revision,images};
  };
}

export const latestWeeklyImages = createWeeklyImagesReader({key: () => process.env.WEEKLY_DRIVE_API_KEY || process.env.GEMINI_API_KEY, weekly: latestWeekly});
