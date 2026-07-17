// Armazenamento de chaves de idempotência para operações de criação/movimentação.
// Implementação em memória com TTL — suficiente para um único processo de API.
// LIMITAÇÃO: em produção com múltiplas instâncias, trocar por um store
// compartilhado (tabela dedicada ou Redis). Documentado no README.
interface StoredResponse {
  status: number;
  body: unknown;
  expiresAt: number;
}

const store = new Map<string, StoredResponse>();
const TTL_MS = 24 * 60 * 60 * 1000;

export function getIdempotent(key: string): StoredResponse | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry;
}

export function saveIdempotent(key: string, status: number, body: unknown): void {
  store.set(key, { status, body, expiresAt: Date.now() + TTL_MS });
}

export function scopedKey(userId: string, method: string, path: string, key: string): string {
  return `${userId}:${method}:${path}:${key}`;
}
