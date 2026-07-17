import { defineConfig } from 'vitest/config';

// `test` roda a suíte unitária (sem banco). `test:integration` roda a suíte de
// integração, que exige DATABASE_URL apontando para um Postgres já migrado e com
// seeds aplicados (ver README). Sem DATABASE_URL, os testes de integração são
// pulados explicitamente — nunca fingimos que passaram.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: true,
  },
});
