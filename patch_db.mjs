import fs from 'fs';
let code = fs.readFileSync('src/utils/db.ts', 'utf8');
code = code.replace(
  "  async delete(key: string) {",
  `  async clear() {
    const database = await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },

  async delete(key: string) {`
);
fs.writeFileSync('src/utils/db.ts', code);
