# Deferred Work

## Deferred from: code review of 1-3-crud-api-endpoints-tests-and-postman-contract-collection (2026-04-09)

- **fastify.d.ts non-optional `db`/`statements` (persists from 1-2)** — `FastifyInstance.db` and `FastifyInstance.statements` are typed as always-present but only decorated when DB init succeeds. CRUD handlers crash to `setErrorHandler` (now safely returns `{ message: 'Internal Server Error' }`) but TypeScript gives no warning at the call sites. Defer to story 1.4+ when DB resilience strategy is revisited. [server/src/types/fastify.d.ts:7]

## Deferred from: code review of 1-2-server-bootstrap-db-schema-and-health-endpoint (2026-04-09)

- **fastify.d.ts `db` declared non-optional** — `db: Database.Database` gives TypeScript a false guarantee; `buildApp()` only decorates `app.db` when DB init succeeds. CRUD routes in story 1.3 accessing `app.db` outside try/catch will be type-safe but can crash at runtime if DB init silently failed. [server/src/types/fastify.d.ts:7]

## Deferred from: code review of 1-1-monorepo-scaffold-and-shared-tooling (2026-04-09)

- **@vitest/coverage-v8 not installed** — `vitest.config.ts` declares `coverage.provider: 'v8'` but the package is absent from `client/devDependencies`. Running `vitest --coverage` will fail. Not blocking for story 1-1 (no coverage runs yet). [client/vitest.config.ts:12]
- **@types/better-sqlite3 missing** — No TypeScript types for `better-sqlite3` in `server/devDependencies`. `server/src/index.ts` is `export {}` so no error yet; will surface in story 1-2 when the library is first imported. [server/package.json devDependencies]
