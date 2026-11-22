import { driveError, readText, WEEKLY_FOLDER } from './weekly';
import { parseScenarioReview } from '../../src/workflow/scenarioReviewData';

const fileName = '오리시트콤_시나리오_검토본.json';

export async function loadScenarioReview(
  key = process.env.WEEKLY_DRIVE_API_KEY || process.env.GEMINI_API_KEY,
  request = fetch,
) {
  if (!key) throw Error('서버의 Drive 연결 키 설정이 필요합니다.');
  const options = { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(25000), redirect: 'error' as const };
  const list = new URL('https://www.googleapis.com/drive/v3/files');
  list.search = new URLSearchParams({
    q: `'${WEEKLY_FOLDER}' in parents and trashed = false and name = '${fileName}' and mimeType = 'application/json'`,
    fields: 'incompleteSearch,files(id)', orderBy: 'modifiedTime desc', pageSize: '1',
  }).toString();
  const response = await request(list, options);
  if (!response.ok) throw driveError(response.status);
  const result = JSON.parse(await readText(response, 32000));
  if (result.incompleteSearch || !Array.isArray(result.files)) throw Error('Drive 검토본 목록을 확인하지 못했습니다.');
  if (!result.files.length) return null;
  const id = result.files[0]?.id;
  if (typeof id !== 'string' || !/^[\w-]{20,}$/.test(id)) throw Error('Drive 검토본 파일을 확인하지 못했습니다.');
  const source = await request(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, options);
  if (!source.ok) throw driveError(source.status);
  return parseScenarioReview(await readText(source, 1000000));
}
