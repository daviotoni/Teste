import { type SupabaseClient } from '@supabase/supabase-js';

const DB_NAME = 'JurisControlDB_v1';
const DB_VERSION = 1;
const STORES = ['users', 'processos', 'calendario', 'documentos', 'versoes', 'modelos', 'emissores', 'leis', 'config'];

const TABLE_BY_STORE: Record<string, string> = {
    users: 'users',
    processos: 'processos',
    calendario: 'calendario',
    documentos: 'documentos',
    versoes: 'versoes',
    modelos: 'modelos',
    emissores: 'emissores',
    leis: 'leis',
    config: 'config',
};

type ConnectionMode = 'indexeddb' | 'supabase';

type ConnectionInfo = {
    mode: ConnectionMode;
    isRemoteConfigured: boolean;
    message: string;
};

class DBHelper {
    private db: IDBDatabase | null = null;
    private supabase: SupabaseClient | null = null;
    private mode: ConnectionMode = 'indexeddb';
    private statusMessage = 'Modo legado local: não use para dados institucionais.';

    async init() {
        await this.initIndexedDB();
        this.initSupabase();
    }

    getConnectionInfo(): ConnectionInfo {
        return {
            mode: this.mode,
            isRemoteConfigured: !!this.supabase,
            message: this.statusMessage,
        };
    }

    private initSupabase() {
        // The legacy JSONB client must never connect to the normalized institutional schema.
        this.supabase = null;
        this.mode = 'indexeddb';
        this.statusMessage = 'Modo legado local. Dados institucionais exigem a API autenticada; a sincronização direta foi desativada.';
    }

    private async initIndexedDB() {
        return new Promise<void>((resolve, reject) => {
            if (this.db) {
                resolve();
                return;
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject('Erro ao abrir o IndexedDB');
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
            throw new Error('Banco de dados nao inicializado.');
        }
        return this.db.transaction(storeName, mode).objectStore(storeName);
    }

    private getTableName(storeName: string): string {
        const tableName = TABLE_BY_STORE[storeName];
        if (!tableName) {
            throw new Error(`Store desconhecida: ${storeName}`);
        }
        return tableName;
    }

    private getPrimaryKeyName(storeName: string): string {
        return storeName === 'config' ? 'key' : 'id';
    }

    private shouldUseSupabase(): boolean {
        return this.mode === 'supabase' && !!this.supabase;
    }

    async get<T,>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
        if (this.shouldUseSupabase()) {
            const tableName = this.getTableName(storeName);
            const primaryKey = this.getPrimaryKeyName(storeName);
            const { data, error } = await this.supabase!
                .from(tableName)
                .select('data')
                .eq(primaryKey, key)
                .maybeSingle();

            if (error) {
                console.warn('Erro ao buscar no Supabase. Usando banco local.', error);
                return this.getLocal<T>(storeName, key);
            }

            return data?.data as T | undefined;
        }

        return this.getLocal<T>(storeName, key);
    }

    async getAll<T,>(storeName: string): Promise<T[]> {
        if (this.shouldUseSupabase()) {
            const tableName = this.getTableName(storeName);
            const { data, error } = await this.supabase!
                .from(tableName)
                .select('data')
                .order('updated_at', { ascending: true });

            if (error) {
                console.warn('Erro ao listar no Supabase. Usando banco local.', error);
                return this.getAllLocal<T>(storeName);
            }

            return (data || []).map(row => row.data as T);
        }

        return this.getAllLocal<T>(storeName);
    }

    async put(storeName: string, item: any): Promise<IDBValidKey> {
        await this.putLocal(storeName, item);

        if (this.shouldUseSupabase()) {
            const tableName = this.getTableName(storeName);
            const primaryKey = this.getPrimaryKeyName(storeName);
            const key = item[primaryKey];

            if (key === undefined || key === null) {
                throw new Error(`Item sem chave primaria '${primaryKey}' para salvar em ${storeName}.`);
            }

            const { error } = await this.supabase!
                .from(tableName)
                .upsert({
                    [primaryKey]: key,
                    data: item,
                    updated_at: new Date().toISOString(),
                });

            if (error) {
                console.warn('Erro ao salvar no Supabase. O item ficou salvo localmente.', error);
            }
        }

        return item[this.getPrimaryKeyName(storeName)];
    }

    async delete(storeName: string, key: IDBValidKey): Promise<void> {
        await this.deleteLocal(storeName, key);

        if (this.shouldUseSupabase()) {
            const tableName = this.getTableName(storeName);
            const primaryKey = this.getPrimaryKeyName(storeName);
            const { error } = await this.supabase!
                .from(tableName)
                .delete()
                .eq(primaryKey, key);

            if (error) {
                console.warn('Erro ao excluir no Supabase. O item foi excluido apenas localmente.', error);
            }
        }
    }

    async clear(storeName: string): Promise<void> {
        await this.clearLocal(storeName);

        if (this.shouldUseSupabase()) {
            const tableName = this.getTableName(storeName);
            const primaryKey = this.getPrimaryKeyName(storeName);
            const { error } = await this.supabase!
                .from(tableName)
                .delete()
                .not(primaryKey, 'is', null);

            if (error) {
                console.warn('Erro ao limpar no Supabase. A limpeza ocorreu apenas localmente.', error);
            }
        }
    }

    async migrateLocalToRemote(): Promise<{ migrated: number; skipped: number }> {
        throw new Error('A migração direta do protótipo foi desativada. Use o futuro importador institucional auditável.');
    }

    private async getLocal<T,>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
        return new Promise((resolve, reject) => {
            const request = this.getStore(storeName, 'readonly').get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private async getAllLocal<T,>(storeName: string): Promise<T[]> {
        return new Promise((resolve, reject) => {
            const request = this.getStore(storeName, 'readonly').getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private async putLocal(storeName: string, item: any): Promise<IDBValidKey> {
        return new Promise((resolve, reject) => {
            const request = this.getStore(storeName, 'readwrite').put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private async deleteLocal(storeName: string, key: IDBValidKey): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = this.getStore(storeName, 'readwrite').delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async clearLocal(storeName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = this.getStore(storeName, 'readwrite').clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const dbHelper = new DBHelper();
