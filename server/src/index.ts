import { buildApp } from './app.js';
import { loadConfig, assertRuntimeConfig } from './config.js';
import { closePool } from './db.js';

async function main(): Promise<void> {
  const cfg = loadConfig();
  assertRuntimeConfig(cfg);
  const app = await buildApp(cfg);

  const shutdown = async (signal: string) => {
    app.log.info(`recebido ${signal}, encerrando...`);
    await app.close();
    await closePool();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: cfg.port, host: cfg.host });
}

main().catch((err) => {
  console.error('Falha ao iniciar a API:', err);
  process.exit(1);
});
