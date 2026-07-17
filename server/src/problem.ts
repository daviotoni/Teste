// Erros padronizados em application/problem+json (RFC 9457).
export class AppError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail?: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(detail ?? title);
  }
}

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  [key: string]: unknown;
}

// Mapeia SQLSTATE das funções transacionais para status HTTP coerentes.
const PG_STATUS: Record<string, { status: number; title: string }> = {
  '28000': { status: 401, title: 'Não autenticado' },
  '42501': { status: 403, title: 'Acesso negado' },
  '40001': { status: 409, title: 'Conflito de concorrência' },
  '23505': { status: 409, title: 'Conflito de unicidade' },
  '23503': { status: 422, title: 'Referência inválida' },
  '23514': { status: 422, title: 'Violação de regra de integridade' },
  '22023': { status: 422, title: 'Dados inválidos' },
  'P0002': { status: 404, title: 'Recurso não encontrado' },
};

export function toProblem(err: unknown): Problem {
  if (err instanceof AppError) {
    return { type: 'about:blank', title: err.title, status: err.status, detail: err.detail, ...err.extra };
  }
  const code = (err as { code?: string })?.code;
  if (code && PG_STATUS[code]) {
    const mapped = PG_STATUS[code];
    return {
      type: 'about:blank',
      title: mapped.title,
      status: mapped.status,
      detail: (err as { message?: string }).message,
    };
  }
  return {
    type: 'about:blank',
    title: 'Erro interno',
    status: 500,
    detail: process.env.NODE_ENV === 'production' ? undefined : (err as Error)?.message,
  };
}
