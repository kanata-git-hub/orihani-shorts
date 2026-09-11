async function transact(mode:IDBTransactionMode,operation:(s:IDBObjectStore)=>IDBRequest):Promise<any>{
 const database=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('pov_director_db',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('media'))r.result.createObjectStore('media');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 try{return await new Promise((resolve,reject)=>{const tx=database.transaction('media',mode),r=operation(tx.objectStore('media'));tx.oncomplete=()=>resolve(r.result);tx.onerror=tx.onabort=()=>reject(tx.error||Error('사진을 저장하지 못했습니다. 브라우저 저장 공간을 확인해주세요.'));});}finally{database.close();}
}
export const db={get:(key:string)=>transact('readonly',s=>s.get(key)),set:(key:string,value:any)=>transact('readwrite',s=>s.put(value,key)),delete:(key:string)=>transact('readwrite',s=>s.delete(key)),clear:()=>transact('readwrite',s=>s.clear())};
