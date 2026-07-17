import { randomUUID } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type pg from 'pg';
import type { ApiConfig } from './config.js';
import { authenticate, type AuthenticatedUser } from './auth.js';
import { withUserTx } from './db.js';
import { AppError } from './problem.js';
import { getIdempotent, saveIdempotent, scopedKey } from './idempotency.js';
import { parseExpectedVersion } from './httpHeaders.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveRequestId(header: unknown): string {
  return typeof header === 'string' && UUID_RE.test(header) ? header : randomUUID();
}

// Executa um handler autenticado dentro de uma transação com contexto RLS.
export async function withAuthed<T>(
  cfg: ApiConfig,
  req: FastifyRequest,
  fn: (client: pg.PoolClient, user: AuthenticatedUser) => Promise<T>,
): Promise<T> {
  const user = await authenticate(cfg, req.headers.authorization);
  const requestId = resolveRequestId(req.headers['x-request-id']);
  return withUserTx(
    cfg.databaseUrl,
    { institutionalUserId: user.institutionalUserId, requestId },
    (client) => fn(client, user),
  );
}

// Wrapper para operações de criação/movimentação com Idempotency-Key.
// Se a mesma chave já foi processada, devolve a resposta anterior sem reexecutar.
export async function withIdempotency(
  cfg: ApiConfig,
  req: FastifyRequest,
  reply: FastifyReply,
  fn: (client: pg.PoolClient, user: AuthenticatedUser) => Promise<{ status: number; body: unknown }>,
): Promise<void> {
  const idemKey = req.headers['idempotency-key'];
  let cacheKey: string | null = null;

  if (typeof idemKey === 'string' && idemKey.length > 0) {
    // Autentica para escopar a chave ao usuário antes de consultar o cache.
    const user = await authenticate(cfg, req.headers.authorization);
    cacheKey = scopedKey(user.institutionalUserId, req.method, req.url, idemKey);
    const cached = getIdempotent(cacheKey);
    if (cached) {
      reply.code(cached.status).header('Idempotency-Replayed', 'true').send(cached.body);
      return;
    }
  }

  const result = await withAuthed(cfg, req, fn);
  if (cacheKey) saveIdempotent(cacheKey, result.status, result.body);
  reply.code(result.status).send(result.body);
}

// Controle de concorrência otimista: lê a versão esperada de If-Match/X-Entity-Version.
export function expectedVersion(req: FastifyRequest): number | null {
  try {
    return parseExpectedVersion(req.headers as Record<string, unknown>);
  } catch {
    throw new AppError(422, 'Versão inválida', 'If-Match/X-Entity-Version deve ser inteiro positivo.');
  }
}
