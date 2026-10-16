import { preparedHistory, type PreparedEpisode } from './productionPackage';
import { makePackage, readPackage, MAX_PACKAGE_BYTES } from './package';

// Stage the selected episode before publishing any local history entry.
// Failed downloads must not leave a ready-looking work with missing images.
export async function prepareDriveWork(entry: PreparedEpisode, revision: string, request: (path: string, init?: RequestInit) => Promise<Response>) {
  const item = preparedHistory(entry, revision);
  if (!entry.assets) return {item, images: {} as Record<string,string>};
  const response = await request(`/api/editor/weekly/${entry.number}/images?revision=${encodeURIComponent(revision)}`, {signal: AbortSignal.timeout(65000)});
  if (Number(response.headers.get('content-length')) > MAX_PACKAGE_BYTES) throw Error('제작 이미지 응답이 너무 큽니다.');
  const raw = await response.text();
  if (raw.length > MAX_PACKAGE_BYTES) throw Error('제작 이미지 응답이 너무 큽니다.');
  let body: any; try { body = JSON.parse(raw); } catch { throw Error('Drive 이미지 응답을 읽지 못했습니다.'); }
  if (!response.ok) throw Error(body.error || 'Drive 이미지를 불러오지 못했습니다. 다시 시도해주세요.');
  if (body.number !== entry.number || body.revision !== revision || !body.images ||
    Object.keys(body.images).length !== Object.keys(entry.assets).length ||
    Object.keys(entry.assets).some(name => !body.images[name])) throw Error('제작안과 Drive 이미지가 일치하지 않습니다.');
  return readPackage(makePackage(item, body.images));
}
