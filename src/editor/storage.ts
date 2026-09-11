import type { Draft, DraftSummary } from './draft';
import { hasDraftContent, summarizeDraft } from './draft';

async function openEditorDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open('orihani-video-editor', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('drafts');
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  });
}
export async function editorStore<T>(key: string, value?: T): Promise<T | undefined> {
  const db = await openEditorDB();
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', value === undefined ? 'readonly' : 'readwrite');
    const s = tx.objectStore('drafts'); const r = value === undefined ? s.get(key) : s.put(value, key);
    tx.oncomplete = () => resolve(value === undefined ? r.result : value);
    tx.onerror = tx.onabort = () => reject(tx.error || Error('브라우저 저장 공간을 확인해주세요.'));
  }); } finally { db.close(); }
}

// Commit the Blob and its lightweight index together. Never scan saved video Blobs.
export async function persistDraft(d: Draft, updatedAt = Date.now()): Promise<DraftSummary[]> {
  if (!hasDraftContent(d)) return await editorStore<DraftSummary[]>('list') || [];
  const db = await openEditorDB();
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite'), s = tx.objectStore('drafts');
    let next: DraftSummary[];
    const request = s.get('list');
    request.onsuccess = () => {
      next = [summarizeDraft(d, updatedAt), ...(request.result || []).filter((x: DraftSummary) => x.id !== d.id)];
      s.put(d, d.id); s.put(next, 'list'); s.put(d.id, 'current');
    };
    tx.oncomplete = () => resolve(next);
    tx.onerror = tx.onabort = () => reject(tx.error || Error('편집 자동 저장에 실패했습니다.'));
  }); } finally { db.close(); }
}

// Coalesce pending changes to the same draft while a large video is being saved.
// Keep separate drafts queued so switching episodes cannot discard another edit.
export function draftWriter<T>(persist:(value:T)=>Promise<void>) {
  const pending=new Map<string,T>();let running:Promise<void>|undefined;
  const flush=():Promise<void>=>{
    if(running)return running;
    running=(async()=>{while(pending.size){const [id,value]=pending.entries().next().value!;pending.delete(id);try{await persist(value);}catch(error){if(!pending.has(id))pending.set(id,value);throw error;}}})().finally(()=>{running=undefined;});
    return running;
  };
  return {write:(id:string,value:T)=>{pending.set(id,value);return flush();},flush};
}
