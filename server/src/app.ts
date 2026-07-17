import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { ApiConfig } from './config.js';
import { toProblem } from './problem.js';
import { registerMeRoutes } from './routes/me.js';
import { registerUnitRoutes } from './routes/units.js';
import { registerInboxRoutes } from './routes/inbox.js';
import { registerProcessRoutes } from './routes/processes.js';
import { registerDocumentRoutes } from './routes/documents.js';
import { registerTaskRoutes } from './routes/tasks.js';

export async function buildApp(cfg: ApiConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : { level: process.env.LOG_LEVEL ?? 'info' },
    genReqId: () => cryptoRandomId(),
  });

  await app.register(cors, { origin: cfg.corsOrigin, credentials: true });

  // Todas as respostas de erro em application/problem+json (RFC 9457).
  app.setErrorHandler((err, _req, reply) => {
    const problem = toProblem(err);
    if (problem.status >= 500) app.log.error(err);
    reply.code(problem.status).type('application/problem+json').send(problem);
  });

  app.setNotFoundHandler((req, reply) => {
    reply
      .code(404)
      .type('application/problem+json')
      .send({ type: 'about:blank', title: 'Rota não encontrada', status: 404, detail: req.url });
  });

  app.get('/api/v1/health', async () => ({ status: 'ok' }));

  registerMeRoutes(app, cfg);
  registerUnitRoutes(app, cfg);
  registerInboxRoutes(app, cfg);
  registerProcessRoutes(app, cfg);
  registerDocumentRoutes(app, cfg);
  registerTaskRoutes(app, cfg);

  return app;
}

function cryptoRandomId(): string {
  // Identificador de requisição opaco (não é o app.request_id, que é UUID).
  return Math.random().toString(36).slice(2, 12);
}
