
const DB_NAME = 'JurisControlDB_v1';
const DB_VERSION = 1;
const STORES = ['users', 'processos', 'calendario', 'documentos', 'versoes', 'modelos', 'emissores', 'leis', 'config'];

class DBHelper {
    private db: IDBDatabase | null = null;

    async init() {
        return new Promise<void>((resolve, reject) => {
            if (this.db) {
                resolve();
                return;
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject("Erro ao abrir o IndexedDB");
            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                STORES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const keyPath = storeName === 'config' ? 'key' : 'id';
                        db.createObjectStore(storeName, { keyPath });
                    }
                });
            };
        });
    }

    private getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
        if (!this.db) {
            throw new Error("Banco de dados não inicializado.");
        }
        return this.db.transaction(storeName, mode).objectStore(storeName);
    }

    async get<T,>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
        return new Promise((resolve, reject) => {
            const request = this.getStore(storeName, 'readonly').get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll<T,>(storeName: string): Promise<T[]> {
        return new Promise((resolve, reject) => {
            const request = this.getStore(storeName, 'readonly').getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName: string, item: any): Promise<IDBValidKey> {
        return new Promise((resolve, reject) => {
            const request = this.getStore(storeName, 'readwrite').put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName: string, key: IDBValidKey): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = this.getStore(storeName, 'readwrite').delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async clear(storeName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = this.getStore(storeName, 'readwrite').clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const dbHelper = new DBHelper();
