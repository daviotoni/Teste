import pg from 'pg';
import { AppError } from './problem.js';

// Pool único do processo. A API conecta com um papel SEM BYPASSRLS
// (recomendado: app_api) para que as políticas RLS sejam efetivamente aplicadas.
let pool: pg.Pool | null = null;

export function getPool(databaseUrl: string | undefined): pg.Pool {
  if (!databaseUrl) {
    throw new AppError(503, 'Banco indisponível', 'DATABASE_URL não configurada.');
  }
  if (!pool) {
    pool = new pg.Pool({ connectionString: databaseUrl, max: 10 });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export interface RequestContext {
  institutionalUserId: string;
  requestId: string;
}

// Executa `fn` dentro de uma transação com o contexto de identidade aplicado
// via SET LOCAL. Todas as consultas herdam app.user_id para a RLS.
export async function withUserTx<T>(
  databaseUrl: string | undefined,
  ctx: RequestContext,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool(databaseUrl).connect();
  try {
    await client.query('BEGIN');
    // set_config com is_local=true → escopo da transação (SET LOCAL).
    await client.query('SELECT set_config($1, $2, true), set_config($3, $4, true)', [
      'app.user_id',
      ctx.institutionalUserId,
      'app.request_id',
      ctx.requestId,
    ]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
