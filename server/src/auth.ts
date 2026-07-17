import { AppError } from './problem.js';
import type { ApiConfig } from './config.js';
import { getPool } from './db.js';

// Verificação de token institucional (bearer real).
// Fase 1: Supabase Auth. A verificação é feita NO SERVIDOR consultando o
// endpoint /auth/v1/user com o token do usuário. A arquitetura é compatível
// com evolução para OIDC/Keycloak/Entra ID: basta trocar `verifyBearerToken`
// por uma validação de JWT do provedor, mantendo o mesmo contrato de saída.

export interface AuthenticatedUser {
  institutionalUserId: string;
  authSubject: string;
  email: string | null;
  displayName: string;
}

interface SupabaseUser {
  id: string;
  email?: string | null;
}

async function verifyBearerToken(cfg: ApiConfig, token: string): Promise<SupabaseUser> {
  const res = await fetch(`${cfg.supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: cfg.supabaseAnonKey ?? '',
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new AppError(401, 'Token inválido', 'O token institucional é inválido ou expirou.');
  }
  if (!res.ok) {
    throw new AppError(502, 'Provedor de identidade indisponível', `status ${res.status}`);
  }
  const body = (await res.json()) as SupabaseUser;
  if (!body?.id) {
    throw new AppError(401, 'Token inválido', 'Resposta do provedor sem identidade.');
  }
  return body;
}

function extractBearer(headerValue: string | undefined): string {
  if (!headerValue || !headerValue.toLowerCase().startsWith('bearer ')) {
    throw new AppError(401, 'Não autenticado', 'Cabeçalho Authorization Bearer ausente.');
  }
  const token = headerValue.slice(7).trim();
  if (!token) {
    throw new AppError(401, 'Não autenticado', 'Token vazio.');
  }
  return token;
}

// Autentica a requisição e resolve o usuário institucional vinculado.
// Exige conta institucional ativa (users.is_active) e vínculo auth_subject.
// A resolução usa a função SECURITY DEFINER sigla_resolve_identity, pois ocorre
// antes de app.user_id estar definido para a RLS.
export async function authenticate(
  cfg: ApiConfig,
  authorizationHeader: string | undefined,
): Promise<AuthenticatedUser> {
  const token = extractBearer(authorizationHeader);
  const supaUser = await verifyBearerToken(cfg, token);

  const pool = getPool(cfg.databaseUrl);
  const { rows } = await pool.query<{ id: string; display_name: string; email: string | null }>(
    'SELECT id, display_name, email FROM sigla_resolve_identity($1)',
    [supaUser.id],
  );
  if (rows.length === 0) {
    throw new AppError(
      403,
      'Conta institucional ausente',
      'Autenticação válida, mas sem usuário institucional ativo vinculado a esta identidade.',
    );
  }
  return {
    institutionalUserId: rows[0].id,
    authSubject: supaUser.id,
    email: rows[0].email,
    displayName: rows[0].display_name,
  };
}
