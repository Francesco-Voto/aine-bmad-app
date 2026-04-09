import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              db: { type: 'string' },
            },
          },
          503: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              db: { type: 'string' },
            },
          },
        },
      },
    },
    async (_req, reply) => {
      try {
        app.db.prepare('SELECT 1').get();
        return reply.send({ status: 'ok', db: 'ok' });
      } catch {
        return reply.status(503).send({ status: 'error', db: 'error' });
      }
    }
  );
};
