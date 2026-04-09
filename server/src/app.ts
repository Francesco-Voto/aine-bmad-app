import Fastify from 'fastify';

import { initDatabase } from './db/database';
import { healthRoutes } from './routes/health';
import { todosRoutes } from './routes/todos';

export function buildApp(opts: { dbPath: string }) {
  const app = Fastify({ logger: true });

  let dbInit: ReturnType<typeof initDatabase> | null = null;
  try {
    dbInit = initDatabase(opts.dbPath);
  } catch (err) {
    app.log.warn({ err }, 'DB init failed — health endpoint will report db error');
  }

  if (dbInit) {
    app.decorate('db', dbInit.db);
    app.decorate('statements', dbInit.statements);
  }

  app.setErrorHandler((error, _req, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    const message = statusCode < 500 && error instanceof Error ? error.message : 'Internal Server Error';
    reply.status(statusCode).send({ message });
  });

  app.register(healthRoutes);
  app.register(todosRoutes, { prefix: '/api' });

  return app;
}
