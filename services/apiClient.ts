// Cliente da API institucional `/api/v1`. Única porta de acesso do frontend aos
// dados institucionais. Anexa o bearer token do Supabase Auth e traduz respostas
// application/problem+json em erros tipados.
import { getAccessToken } from './supabaseAuth';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail?: string,
    public problem?: unknown,
  ) {
    super(detail ?? title);
  }
}

interface RequestOptions {
  body?: unknown;
  idempotencyKey?: string;
  ifMatch?: number;
  signal?: AbortSignal;
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError(401, 'Não autenticado', 'Sessão institucional ausente ou expirada.');
  }

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
  if (opts.ifMatch != null) headers['If-Match'] = `"${opts.ifMatch}"`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const payload = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const p = payload as { title?: string; detail?: string } | undefined;
    throw new ApiError(res.status, p?.title ?? 'Erro', p?.detail, payload);
  }
  return payload as T;
}

// Gera uma chave de idempotência para operações de criação/movimentação.
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>('GET', path, { signal }),
  post: <T>(path: string, body: unknown, idempotencyKey?: string) =>
    request<T>('POST', path, { body, idempotencyKey }),
  patch: <T>(path: string, body: unknown, ifMatch?: number) =>
    request<T>('PATCH', path, { body, ifMatch }),
  postWithVersion: <T>(path: string, body: unknown, ifMatch: number, idempotencyKey?: string) =>
    request<T>('POST', path, { body, ifMatch, idempotencyKey }),
};
