# Story 1.3: CRUD API Endpoints, Tests & Postman Contract Collection

Status: done

## Story

As a developer,
I want all four CRUD REST endpoints fully implemented with server-side validation, integration tests passing, and a Postman collection documenting the API contract,
so that consumers have a verified, runnable source of truth for the API.

## Acceptance Criteria

1. **Given** the database has existing todos, **When** `GET /api/todos` is called, **Then** it returns `200 Todo[]` ordered by `created_at DESC` (newest first)
2. **Given** the database is empty, **When** `GET /api/todos` is called, **Then** it returns `200 []`
3. **Given** a valid `{ "text": "Buy milk" }` body, **When** `POST /api/todos` is called, **Then** it returns `201` with `{ id, text, completed: false, createdAt }` where `createdAt` is ISO 8601 and `completed` is a boolean
4. **Given** an empty string, whitespace-only, or missing `text` field, **When** `POST /api/todos` is called, **Then** it returns `400 { "message": "..." }`
5. **Given** a `text` field exceeding 500 characters, **When** `POST /api/todos` is called, **Then** it returns `400 { "message": "..." }`
6. **Given** an existing todo id and `{ "completed": true }`, **When** `PATCH /api/todos/:id` is called, **Then** it returns `200 Todo` with the updated `completed` value
7. **Given** a non-existent todo id, **When** `PATCH /api/todos/:id` is called, **Then** it returns `404 { "message": "..." }`
8. **Given** an existing todo id, **When** `DELETE /api/todos/:id` is called, **Then** it returns `204` with no body and the record is removed
9. **Given** a non-existent todo id, **When** `DELETE /api/todos/:id` is called, **Then** it returns `404 { "message": "..." }`
10. **Given** any 4xx or 5xx error condition, **When** the server responds, **Then** the response is always `{ "message": string }` — never a stack trace
11. **Given** all routes are implemented, **When** the Supertest integration suite runs (`npm test` in `server/`), **Then** all happy-path and error-case tests pass and the suite exits zero
12. **Given** `postman/todo-app.collection.json` exists in the monorepo root, **When** imported into Postman, **Then** it contains one folder per endpoint with requests and test scripts asserting status code, response shape, and error message format — validated via Postman MCP

## Tasks / Subtasks

- [x] Task 1: Create the todos route plugin `server/src/routes/todos.ts` (AC: 1–10)
  - [x] Create as a Fastify plugin — `export const todosRoutes: FastifyPluginAsync`
  - [x] Implement `GET /api/todos` — call `statements.selectAll.all()`, map DB rows to `Todo` response shape (convert `completed` INTEGER → boolean, `created_at` → `createdAt` ISO 8601 string)
  - [x] Implement `POST /api/todos` — trim `text`, validate non-empty and ≤ 500 chars, call `statements.insertOne.get(text)`, return 201 with `Todo` shape
  - [x] Implement `PATCH /api/todos/:id` — validate `id` param is integer, call `statements.updateCompleted.get(completed ? 1 : 0, id)`, return 404 if no row updated, 200 with `Todo` shape otherwise
  - [x] Implement `DELETE /api/todos/:id` — validate `id` param is integer, call `statements.deleteOne.run(id)`, return 404 if `changes === 0`, 204 No Content otherwise
  - [x] Add Fastify JSON Schema on all request bodies and route params (see Dev Notes)
  - [x] Add a global error handler in `app.ts` using `app.setErrorHandler` to ensure consistent `{ message }` shape on all unhandled errors — never expose stack traces

- [x] Task 2: Register todos routes in `app.ts` (AC: 1–10)
  - [x] Import `todosRoutes` and register under prefix `/api`: `app.register(todosRoutes, { prefix: '/api' })`
  - [x] Confirm the global error handler is set via `app.setErrorHandler` (may be added here or in the plugin)

- [x] Task 3: Write integration tests `server/src/routes/todos.test.ts` (AC: 11)
  - [x] Use `buildApp({ dbPath })` factory with a temp SQLite file (use `fs.mkdtempSync` + `os.tmpdir()` — same pattern as `health.test.ts`)
  - [x] Use `app.inject()` for all requests — no real port binding needed
  - [x] **`GET /api/todos` tests:**
    - [x] Empty DB → 200, body is `[]`
    - [x] After inserting two todos → 200, array of 2, newest first (`created_at DESC`)
    - [x] Response shape: each item has `id` (number), `text` (string), `completed` (boolean `false`), `createdAt` (ISO 8601 string)
  - [x] **`POST /api/todos` tests:**
    - [x] Valid body `{ text: "Buy milk" }` → 201, `Todo` shape returned
    - [x] Empty string `{ text: "" }` → 400 `{ message: string }`
    - [x] Whitespace-only `{ text: "   " }` → 400 `{ message: string }`
    - [x] Missing `text` field → 400 `{ message: string }`
    - [x] `text` of 501 chars → 400 `{ message: string }`
    - [x] `text` of exactly 500 chars → 201 (boundary: valid)
  - [x] **`PATCH /api/todos/:id` tests:**
    - [x] Existing id, `{ completed: true }` → 200, `Todo` with `completed: true`
    - [x] Existing id, `{ completed: false }` → 200, `Todo` with `completed: false`
    - [x] Non-existent id → 404 `{ message: string }`
  - [x] **`DELETE /api/todos/:id` tests:**
    - [x] Existing id → 204, no body
    - [x] Non-existent id → 404 `{ message: string }`
    - [x] After delete, `GET /api/todos` does not include the deleted item
  - [x] **Error shape tests:**
    - [x] All 4xx responses are `{ message: string }` — not Fastify's default validation object
  - [x] Tear down: `app.close()` and `fs.rmSync(tmpDir, { recursive: true })` in `afterAll`
  - [x] Run `npm run test --workspace=server` — must exit zero

- [x] Task 4: Create Postman collection `postman/todo-app.collection.json` (AC: 12)
  - [x] Create `postman/` directory at monorepo root
  - [x] Build a Postman Collection v2.1 JSON file with one folder per endpoint (see Dev Notes for schema shape)
  - [x] Each folder contains: at minimum one happy-path request and one error-case request
  - [x] Each request has a `Tests` script asserting: status code, response body shape, `Content-Type` header
  - [x] Use `{{baseUrl}}` Postman variable (default: `http://localhost:3000`) so the collection works in any environment
  - [x] Use Postman MCP (`mcp_postman_*` tools) to validate the collection can be imported and requests are well-formed

## Dev Notes

### Repo Context

- **Prerequisite:** Story 1.2 complete — `buildApp()`, `initDatabase()`, prepared statements, and `GET /health` all working; `npm run dev` exits 0.
- **Existing prepared statements** (from `server/src/db/database.ts` — do NOT re-declare):
  ```typescript
  statements.selectAll        // SELECT * FROM todos ORDER BY created_at DESC
  statements.insertOne        // INSERT INTO todos (text) VALUES (?) RETURNING *
  statements.updateCompleted  // UPDATE todos SET completed = ? WHERE id = ? RETURNING *
  statements.deleteOne        // DELETE FROM todos WHERE id = ?
  ```
- **`app.decorate('db', ...)` and `app.decorate('statements', ...)`** are set in `buildApp()` only when DB init succeeds — accessing `app.db` / `app.statements` inside route handlers is safe because routes won't register if DB init throws.
- **TypeScript type augmentation** already exists at `server/src/types/fastify.d.ts` — `FastifyInstance` has `db` and `statements`.

### DB Row → API Shape Mapping

The SQLite `todos` table stores `completed` as `INTEGER (0|1)` and `created_at` as `TEXT`. The API contract requires:
```typescript
// API response shape (from architecture.md)
{ id: number; text: string; completed: boolean; createdAt: string }
```

Map every row before sending:
```typescript
function toTodo(row: { id: number; text: string; completed: number; created_at: string }) {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed === 1,
    createdAt: row.created_at,   // already ISO 8601 from SQLite datetime('now')
  };
}
```

Define the `DbRow` type locally in `todos.ts` or extract to `server/src/types/db.ts`.

### Fastify JSON Schema — Request & Response

Use JSON Schema on all inputs. Fastify validates before reaching handlers and returns 400 automatically for schema violations. Supplement with manual application-level checks (e.g. whitespace trimming, 500-char limit) since JSON Schema `minLength: 1` won't catch `"   "`:

```typescript
// POST /api/todos — body schema
{
  body: {
    type: 'object',
    required: ['text'],
    properties: {
      text: { type: 'string', minLength: 1, maxLength: 500 },
    },
    additionalProperties: false,
  },
}
```

```typescript
// PATCH /api/todos/:id — params + body schema
{
  params: {
    type: 'object',
    properties: { id: { type: 'integer' } },
  },
  body: {
    type: 'object',
    required: ['completed'],
    properties: {
      completed: { type: 'boolean' },
    },
    additionalProperties: false,
  },
}
```

```typescript
// DELETE /api/todos/:id — params schema
{
  params: {
    type: 'object',
    properties: { id: { type: 'integer' } },
  },
}
```

**CRITICAL — Fastify default validation errors** return a shape like `{ statusCode, error, message }`, not `{ message }`. Override this in the global error handler to ensure AC 10:

```typescript
// In app.ts, after registering routes:
app.setErrorHandler((error, _req, reply) => {
  const statusCode = error.statusCode ?? 500;
  reply.status(statusCode).send({ message: error.message });
});
```

This normalises Fastify schema validation errors AND any unhandled route errors to `{ message: string }`.

### Route Handler Skeletons

```typescript
// GET /api/todos
app.get('/', async (_req, reply) => {
  const rows = app.statements.selectAll.all() as DbRow[];
  return reply.send(rows.map(toTodo));
});

// POST /api/todos
app.post('/', { schema: postSchema }, async (req, reply) => {
  const { text } = req.body as { text: string };
  const trimmed = text.trim();
  if (!trimmed) {
    return reply.status(400).send({ message: 'text must not be empty or whitespace-only' });
  }
  if (trimmed.length > 500) {
    return reply.status(400).send({ message: 'text must not exceed 500 characters' });
  }
  const row = app.statements.insertOne.get(trimmed) as DbRow;
  return reply.status(201).send(toTodo(row));
});

// PATCH /api/todos/:id
app.patch('/:id', { schema: patchSchema }, async (req, reply) => {
  const { id } = req.params as { id: number };
  const { completed } = req.body as { completed: boolean };
  const row = app.statements.updateCompleted.get(completed ? 1 : 0, id) as DbRow | undefined;
  if (!row) return reply.status(404).send({ message: `Todo ${id} not found` });
  return reply.send(toTodo(row));
});

// DELETE /api/todos/:id
app.delete('/:id', { schema: deleteSchema }, async (req, reply) => {
  const { id } = req.params as { id: number };
  const result = app.statements.deleteOne.run(id);
  if (result.changes === 0) return reply.status(404).send({ message: `Todo ${id} not found` });
  return reply.status(204).send();
});
```

### Postman Collection — File Structure

Create `postman/todo-app.collection.json`. Use **Postman Collection Format v2.1**:

```json
{
  "info": {
    "name": "Todo App API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:3000" }
  ],
  "item": [
    {
      "name": "GET /api/todos",
      "item": [
        {
          "name": "List todos (200)",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/todos"
          },
          "event": [{
            "listen": "test",
            "script": {
              "exec": [
                "pm.test('status 200', () => pm.response.to.have.status(200));",
                "pm.test('body is array', () => { const b = pm.response.json(); pm.expect(b).to.be.an('array'); });",
                "if (pm.response.json().length > 0) {",
                "  const todo = pm.response.json()[0];",
                "  pm.test('todo shape', () => {",
                "    pm.expect(todo).to.have.all.keys('id','text','completed','createdAt');",
                "    pm.expect(todo.completed).to.be.a('boolean');",
                "  });",
                "}"
              ]
            }
          }]
        }
      ]
    },
    {
      "name": "POST /api/todos",
      "item": [
        {
          "name": "Create todo (201)",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/todos",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\"text\":\"Buy milk\"}" }
          },
          "event": [{
            "listen": "test",
            "script": {
              "exec": [
                "pm.test('status 201', () => pm.response.to.have.status(201));",
                "const b = pm.response.json();",
                "pm.test('todo shape', () => {",
                "  pm.expect(b).to.have.all.keys('id','text','completed','createdAt');",
                "  pm.expect(b.completed).to.be.false;",
                "  pm.expect(b.text).to.eql('Buy milk');",
                "});"
              ]
            }
          }]
        },
        {
          "name": "Empty text (400)",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/todos",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\"text\":\"\"}" }
          },
          "event": [{
            "listen": "test",
            "script": {
              "exec": [
                "pm.test('status 400', () => pm.response.to.have.status(400));",
                "pm.test('error shape', () => pm.expect(pm.response.json()).to.have.property('message'));"
              ]
            }
          }]
        }
      ]
    },
    {
      "name": "PATCH /api/todos/:id",
      "item": [
        {
          "name": "Toggle complete (200)",
          "request": {
            "method": "PATCH",
            "url": "{{baseUrl}}/api/todos/1",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\"completed\":true}" }
          },
          "event": [{
            "listen": "test",
            "script": {
              "exec": [
                "pm.test('status is 200 or 404', () => pm.expect(pm.response.code).to.be.oneOf([200,404]));",
                "pm.test('response has message or todo', () => {",
                "  const b = pm.response.json();",
                "  if (pm.response.code === 200) pm.expect(b).to.have.property('completed', true);",
                "  else pm.expect(b).to.have.property('message');",
                "});"
              ]
            }
          }]
        },
        {
          "name": "Non-existent id (404)",
          "request": {
            "method": "PATCH",
            "url": "{{baseUrl}}/api/todos/999999",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\"completed\":true}" }
          },
          "event": [{
            "listen": "test",
            "script": {
              "exec": [
                "pm.test('status 404', () => pm.response.to.have.status(404));",
                "pm.test('error shape', () => pm.expect(pm.response.json()).to.have.property('message'));"
              ]
            }
          }]
        }
      ]
    },
    {
      "name": "DELETE /api/todos/:id",
      "item": [
        {
          "name": "Non-existent id (404)",
          "request": {
            "method": "DELETE",
            "url": "{{baseUrl}}/api/todos/999999"
          },
          "event": [{
            "listen": "test",
            "script": {
              "exec": [
                "pm.test('status 404', () => pm.response.to.have.status(404));",
                "pm.test('error shape', () => pm.expect(pm.response.json()).to.have.property('message'));"
              ]
            }
          }]
        }
      ]
    }
  ]
}
```

Note: The `DELETE /api/todos/:id` happy-path (204) is best tested in the integration suite, not a solo Postman request, because it requires a known existing id. Use the Postman MCP to validate this collection is importable and structurally sound.

### Target File Structure After This Story

```
server/src/
├── db/
│   └── database.ts             # unchanged from Story 1.2
├── routes/
│   ├── health.ts               # unchanged from Story 1.2
│   ├── health.test.ts          # unchanged from Story 1.2
│   ├── todos.ts                # NEW — 4 CRUD endpoints
│   └── todos.test.ts           # NEW — full integration test suite
├── types/
│   ├── fastify.d.ts            # unchanged from Story 1.2
│   └── db.ts                   # NEW (optional) — DbRow type
├── app.ts                      # MODIFIED — register todosRoutes + setErrorHandler
└── index.ts                    # unchanged from Story 1.2

postman/                        # NEW — at monorepo root
└── todo-app.collection.json
```

### What NOT to Do

- ❌ Do NOT use raw string interpolation in SQL — all queries go through the prepared statements already initialized in `database.ts`
- ❌ Do NOT create new `better-sqlite3` instances in route handlers — use `app.statements` decorated onto the Fastify instance
- ❌ Do NOT return Fastify's default validation error shape (`{ statusCode, error, message }`) — the global `setErrorHandler` must normalise it to `{ message }` only
- ❌ Do NOT expose stack traces, internal error details, or the raw SQLite error message in HTTP responses
- ❌ Do NOT skip the whitespace-only check for `POST /api/todos` — JSON Schema `minLength: 1` will pass `"   "`, so application-level trimming is required
- ❌ Do NOT return `completed` as `0` or `1` — it must be a boolean in the API response

### References

- [Source: architecture.md#API Contract] — method/path/status code/response shapes
- [Source: architecture.md#Data Architecture] — prepared statements, `completed` as INTEGER, `created_at` TEXT
- [Source: epics.md#Story 1.3] — acceptance criteria
- [Source: prd.md#FR22–FR26] — CRUD functional requirements
- [Source: server/src/db/database.ts] — existing prepared statement names and signatures
- [Source: server/src/app.ts] — `buildApp()` factory, decoration pattern to follow

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `ORDER BY created_at DESC` in `selectAll` is non-deterministic when multiple rows get the same second-precision timestamp. Added `id DESC` as tiebreaker to make ordering stable.
- `setErrorHandler` receives `error: unknown` in strict TS — cast via `(error as { statusCode?: number }).statusCode` and `error instanceof Error` check.
- Postman MCP `createCollection` doesn't accept nested `item` arrays for folders; validated as flat collection. Folder structure is preserved in the file on disk.

### Completion Notes List

- All 4 tasks completed. 18 integration tests (16 todos + 2 health), all passing.
- `GET /api/todos`: returns `[]` on empty DB, array ordered by `created_at DESC, id DESC` otherwise. Row mapping to `{ id, text, completed: boolean, createdAt }` validated.
- `POST /api/todos`: Fastify JSON Schema rejects missing/too-long text; application-level trim rejects whitespace-only. 201 with full Todo shape on success.
- `PATCH /api/todos/:id`: `updateCompleted` RETURNING * returns undefined on no-match → 404; 200 with updated Todo shape on match.
- `DELETE /api/todos/:id`: `deleteOne.run().changes === 0` → 404; 204 no body on success.
- Global `setErrorHandler` in `app.ts` normalises all errors to `{ message: string }` — Fastify's default validation shape is suppressed.
- `postman/todo-app.collection.json` created at monorepo root. Collection imported and validated via Postman MCP (uid: `2060976-cb9084af-8e6d-4408-a969-990356f22673`).
- `npm run test:all` — 18/18 passed, client/e2e exit zero, no regressions.
- `npm run lint` and `npm run typecheck` both clean.

### File List

- `server/src/routes/todos.ts` (NEW)
- `server/src/routes/todos.test.ts` (NEW)
- `server/src/app.ts` (MODIFIED — added `todosRoutes` registration and `setErrorHandler`)
- `server/src/db/database.ts` (MODIFIED — added `id DESC` tiebreaker to `selectAll` query)
- `postman/todo-app.collection.json` (NEW)

### Change Log

- Story 1.3 implementation complete (Date: 2026-04-09): Added 4 CRUD endpoints under `/api/todos`, global error handler normalising all errors to `{ message }`, 18 integration tests (16 new), and Postman collection v2.1 validated via MCP.

### Review Findings

- [x] [Review][Patch] Fix createdAt to proper ISO 8601 — SQLite datetime('now') is space-separated local-naive; replaced with `.replace(' ', 'T') + 'Z').toISOString()` [server/src/routes/todos.ts:15]
- [x] [Review][Patch] setErrorHandler exposes raw error.message for 500s — changed to 'Internal Server Error' for statusCode >= 500 [server/src/app.ts:24]
- [x] [Review][Patch] Remove dead code — trimmed.length > 500 branch unreachable due to schema maxLength:500 guard [server/src/routes/todos.ts:63]
- [x] [Review][Defer] fastify.d.ts non-optional db/statements carried from story 1-2 — CRUD 500s now return safe 'Internal Server Error'; full fix deferred to story 1.4+ [server/src/types/fastify.d.ts:7] — deferred, pre-existing