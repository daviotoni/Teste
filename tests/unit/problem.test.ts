import { describe, it, expect } from 'vitest';
import { AppError, toProblem } from '../../server/src/problem';

describe('toProblem', () => {
  it('converte AppError preservando status e título', () => {
    const p = toProblem(new AppError(403, 'Acesso negado', 'sem permissão'));
    expect(p.status).toBe(403);
    expect(p.title).toBe('Acesso negado');
    expect(p.detail).toBe('sem permissão');
  });

  it('mapeia SQLSTATE de RLS/permite para 403', () => {
    expect(toProblem({ code: '42501', message: 'x' }).status).toBe(403);
  });

  it('mapeia conflito de concorrência (40001) para 409', () => {
    expect(toProblem({ code: '40001', message: 'x' }).status).toBe(409);
  });

  it('mapeia dados inválidos (22023) para 422', () => {
    expect(toProblem({ code: '22023', message: 'x' }).status).toBe(422);
  });

  it('mapeia não autenticado (28000) para 401', () => {
    expect(toProblem({ code: '28000', message: 'x' }).status).toBe(401);
  });

  it('erros desconhecidos viram 500', () => {
    expect(toProblem(new Error('boom')).status).toBe(500);
  });
});
