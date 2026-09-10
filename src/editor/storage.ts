export async function editorStore<T>(key: string, value?: T): Promise<T | undefined> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open('orihani-video-editor', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('drafts');
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  });
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', value === undefined ? 'readonly' : 'readwrite');
    const s = tx.objectStore('drafts'); const r = value === undefined ? s.get(key) : s.put(value, key);
    tx.oncomplete = () => resolve(value === undefined ? r.result : value);
    tx.onerror = tx.onabort = () => reject(tx.error || Error('브라우저 저장 공간을 확인해주세요.'));
  }); } finally { db.close(); }
}
