import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
    private statusMessage = 'Usando banco local do navegador.';

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
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            this.mode = 'indexeddb';
            this.statusMessage = 'Banco central nao configurado. Os dados estao sendo salvos apenas neste navegador.';
            return;
        }

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        this.mode = 'supabase';
        this.statusMessage = 'Banco central Supabase configurado. Os dados serao sincronizados entre computadores.';
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
        if (!this.shouldUseSupabase()) {
            throw new Error('Configure o Supabase antes de migrar os dados locais.');
        }

        let migrated = 0;
        let skipped = 0;

        for (const storeName of STORES) {
            const items = await this.getAllLocal<any>(storeName);
            const tableName = this.getTableName(storeName);
            const primaryKey = this.getPrimaryKeyName(storeName);

            const rows = items
                .filter(item => item && item[primaryKey] !== undefined && item[primaryKey] !== null)
                .map(item => ({
                    [primaryKey]: item[primaryKey],
                    data: item,
                    updated_at: new Date().toISOString(),
                }));

            skipped += items.length - rows.length;

            if (rows.length === 0) {
                continue;
            }

            const { error } = await this.supabase!
                .from(tableName)
                .upsert(rows);

            if (error) {
                throw new Error(`Erro ao migrar ${storeName}: ${error.message}`);
            }

            migrated += rows.length;
        }

        return { migrated, skipped };
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
