import { describe, it, expect } from 'vitest';
import { buildApp } from '../../server/src/app';
import type { ApiConfig } from '../../server/src/config';

const cfg: ApiConfig = {
  port: 0,
  host: '127.0.0.1',
  databaseUrl: undefined,
  supabaseUrl: undefined,
  supabaseAnonKey: undefined,
  corsOrigin: '*',
};

describe('API — autenticação e erros padronizados', () => {
  it('rejeita requisição sem bearer token com 401 problem+json', async () => {
    const app = await buildApp(cfg);
    const res = await app.inject({ method: 'GET', url: '/api/v1/me' });
    expect(res.statusCode).toBe(401);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.json().status).toBe(401);
    await app.close();
  });

  it('rejeita header Authorization malformado com 401', async () => {
    const app = await buildApp(cfg);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/unit-inbox',
      headers: { authorization: 'Token abc' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('responde 404 em problem+json para rota desconhecida', async () => {
    const app = await buildApp(cfg);
    const res = await app.inject({ method: 'GET', url: '/api/v1/nao-existe' });
    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    await app.close();
  });

  it('expõe health check', async () => {
    const app = await buildApp(cfg);
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });
});
