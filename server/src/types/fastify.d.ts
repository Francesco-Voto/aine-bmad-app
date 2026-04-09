import type Database from 'better-sqlite3';

import type { initDatabase } from '../db/database';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database;
    statements: ReturnType<typeof initDatabase>['statements'];
  }
}
