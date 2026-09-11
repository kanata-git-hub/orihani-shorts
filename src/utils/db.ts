export type MediaSummary = { imageTitles: string[] };
export const MEDIA_CHANGED = 'orihani-media-summary';
async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    let blocked = false;
    const r = indexedDB.open('pov_director_db', 2);
    r.onupgradeneeded = () => {
      for (const name of ['media', 'summaries']) if (!r.result.objectStoreNames.contains(name)) r.result.createObjectStore(name);
    };
    r.onsuccess = () => { if (blocked) { r.result.close(); return; } r.result.onversionchange = () => r.result.close(); resolve(r.result); };
    r.onerror = () => reject(r.error);
    r.onblocked = () => { blocked = true; reject(Error('다른 탭의 오리쇼츠를 닫고 다시 열어주세요. 사진 저장소를 준비 중입니다.')); };
  });
}
async function mediaOperation(kind: 'get' | 'set' | 'delete' | 'clear', key?: string, value?: any): Promise<any> {
  const database = await openDB();
  let summary: MediaSummary | undefined;
  try { return await new Promise((resolve, reject) => {
    const tx = database.transaction(['media', 'summaries'], 'readwrite');
    const media = tx.objectStore('media'), index = tx.objectStore('summaries');
    let result: any;
    if (kind === 'clear') { media.clear(); index.clear(); }
    else if (kind === 'delete') { media.delete(key!); index.delete(key!); }
    else {
      const r = kind === 'get' ? media.get(key!) : media.put(value, key!);
      r.onsuccess = () => {
        result = kind === 'get' ? r.result : value;
        summary = { imageTitles: Object.keys(result?.images || {}).filter(name => !!result.images[name]) };
        index.put(summary, key!);
      };
    }
    tx.oncomplete = () => { window.dispatchEvent(new CustomEvent(MEDIA_CHANGED, { detail: { id: key, summary, clear: kind === 'clear' } })); resolve(result); };
    tx.onerror = tx.onabort = () => reject(tx.error || Error('사진을 저장하지 못했습니다. 브라우저 저장 공간을 확인해주세요.'));
  }); } finally { database.close(); }
}
async function summaries(): Promise<Record<string, MediaSummary>> {
  const database = await openDB();
  try { return await new Promise((resolve, reject) => {
    const tx = database.transaction('summaries', 'readonly'), s = tx.objectStore('summaries');
    const keys = s.getAllKeys(), values = s.getAll();
    tx.oncomplete = () => resolve(Object.fromEntries(keys.result.map((k, i) => [String(k), values.result[i]])));
    tx.onerror = tx.onabort = () => reject(tx.error);
  }); } finally { database.close(); }
}
export const db = { get: (key: string) => mediaOperation('get', key), set: (key: string, value: any) => mediaOperation('set', key, value), delete: (key: string) => mediaOperation('delete', key), clear: () => mediaOperation('clear'), summaries };
