// Do not expose JSON parser exceptions (or an upstream HTML error page) to users.
export async function readApiResponse(response: Response, task: string): Promise<any> {
  const raw = await response.text();
  let data: any;
  try { data = raw.trim() ? JSON.parse(raw) : undefined; } catch { /* handled below */ }
  if (!response.ok) {
    if (response.status === 429) throw Error('요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.');
    throw Error(typeof data?.error === 'string' ? data.error : `${task} 응답을 받지 못했습니다. 잠시 후 다시 시도해주세요. (HTTP ${response.status})`);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error(`${task} 응답이 비었거나 불완전합니다. 잠시 후 다시 시도해주세요.`);
  return data;
}
