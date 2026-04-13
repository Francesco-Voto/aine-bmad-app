import { buildApp } from './app';

const PORT = process.env.PORT ?? '3000';
const DB_PATH = process.env.DB_PATH ?? './data/dev.db';

const app = buildApp({ dbPath: DB_PATH });

const start = async () => {
  try {
    await app.listen({ port: Number(PORT), host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

const shutdown = async () => {
  await app.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
