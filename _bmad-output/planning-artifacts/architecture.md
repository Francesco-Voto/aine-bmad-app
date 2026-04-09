---
stepsCompleted:
  [
    step-01-init,
    step-02-context,
    step-03-starter,
    step-04-decisions,
    step-05-patterns,
    step-06-structure,
    step-07-validation,
    step-08-complete,
  ]
status: 'complete'
completedAt: '9 April 2026'
inputDocuments: [prd.md, project-context.md]
workflowType: 'architecture'
project_name: 'Todo App'
user_name: 'Francesco'
date: '9 April 2026'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (33 total across 6 areas):**

- **Task Management (FR1–FR6):** Full CRUD on a single `Todo` entity with database-backed persistence. No relations, no user ownership in v1.
- **List Display & States (FR7–FR10):** Loading, empty, and populated states all explicitly required. Consistent ordering needed.
- **Error Handling & Feedback (FR11–FR15):** Network failure detection, user-visible error messaging, input preservation on failed save, graceful recovery without page refresh. Error handling is a first-class requirement.
- **Input Validation (FR16–FR18):** Client-side UX validation + server-side authoritative validation. Both layers required.
- **Responsiveness & Accessibility (FR19–FR21):** 375px–1440px responsive layout, full keyboard operability, WCAG 2.1 AA.
- **Deployment & Infrastructure (FR27–FR33):** Multi-stage Docker builds (non-root), Docker Compose orchestration, health check endpoint, environment-variable-driven configuration.

**Non-Functional Requirements (6 categories):**

- **Performance:** FCP < 1.2s, API CRUD < 200ms, UI interaction response < 100ms — favours minimal bundle size and simple DB queries
- **Security:** Server-side input validation, parameterized queries / ORM, non-root containers, no secrets hardcoded
- **Reliability:** Data survival across restarts, no silent failures, UI usable after errors, accurate health checks
- **Accessibility:** WCAG 2.1 AA contrast, full keyboard operability, ARIA labels, non-colour-only status distinction
- **Maintainability:** Single-responsibility layers, environment-variable config, `docker-compose up` as the one-command setup
- **Testing:** Unit (Vitest/Jest), Integration (Supertest/RTL), E2E (Playwright)

### Scale & Complexity

- **Primary domain:** Full-stack web — client SPA + REST API + relational database + container orchestration
- **Complexity level:** Low — single entity, single user, no real-time, no authentication, no background jobs
- **Estimated architectural components:** 4 (frontend SPA, API server, database, static/reverse-proxy layer)
- **Data model:** 1 entity (`Todo`: id, text, completed, createdAt)

### Technical Constraints & Dependencies

- No authentication or session management in v1
- No server-side rendering — client-side SPA only
- No real-time sync — standard HTTP request/response
- Single-route application — no client-side router required in v1
- All environment-specific config via environment variables
- Browser support: last 2 major versions of Chrome, Firefox, Safari, Edge
- Container runtime: Docker + Docker Compose (no Kubernetes in scope)

### Cross-Cutting Concerns Identified

- **HTTP error normalisation:** API must return consistent error shapes (`{ message }`) across all failure modes — consumed by both frontend error handling and integration tests
- **Input validation:** Must exist at both layers (client for UX, server as authority) — Fastify JSON Schema handles server-side; client mirrors the rules for responsiveness
- **Environment configuration:** Ports, database URL, and any secrets flow through environment variables — affects application code and Docker Compose
- **Health probes:** Backend exposes a health endpoint verifying DB connectivity — required by both the reliability NFR and Docker health check declarations
- **Container networking:** Frontend reaches the API via Compose service name; API reaches the database via service name — network aliases are part of the architecture

## Starter Template & Technology Stack

### Technology Decisions

| Layer                | Technology                     | Version | Rationale                                                                                |
| -------------------- | ------------------------------ | ------- | ---------------------------------------------------------------------------------------- |
| Frontend             | React                          | 19.x    | Component model fits the UI; hooks cover all state needs                                 |
| Frontend build       | Vite                           | 8.x     | Fast dev server, minimal config, modern defaults                                         |
| Frontend language    | TypeScript                     | 5.x     | Type safety across the stack, catches bugs early                                         |
| CSS                  | Tailwind CSS                   | 4.x     | Utility-first, no runtime overhead, fast to build responsive layouts                     |
| Data fetching        | TanStack Query                 | 5.x     | Manages server state, caching, loading/error states via `useQuery` / `useMutation`       |
| Backend              | Fastify                        | 5.x     | Schema-first, low overhead, native JSON Schema validation                                |
| Backend language     | TypeScript                     | 5.x     | Shared language with frontend, type-safe route handlers                                  |
| Database             | SQLite via better-sqlite3      | —       | Zero-config, file-based, durable; upgradeable to PostgreSQL if multi-user is added later |
| API validation       | Fastify JSON Schema (built-in) | —       | Native to Fastify, validates request/response bodies at the framework level              |
| Unit tests (client)  | Vitest                         | 3.x     | Vite-native, same config, fast                                                           |
| Unit tests (server)  | Jest                           | 29.x    | Mature Node test runner for server-side route handler tests                              |
| Integration (server) | Supertest                      | 7.x     | HTTP assertion library for Fastify route integration tests                               |
| Integration (client) | React Testing Library          | 16.x    | Component-level integration tests with real DOM                                          |
| E2E                  | Playwright                     | 1.x     | Cross-browser, covers all 7 defined E2E journey scenarios                                |
| Linting              | ESLint + typescript-eslint     | 9.x     | Flat config, shared rules across both workspaces                                         |
| Formatting           | Prettier                       | 3.x     | Zero-debate code style                                                                   |
| Containerisation     | Docker + Docker Compose        | — / 2.x | Required by FR27–FR33; multi-stage builds, health checks                                 |

### Initialization Commands

```bash
# Frontend — Vite + React + TypeScript scaffold
npm create vite@latest client -- --template react-ts

# Backend — manual setup (no official scaffolder needed)
mkdir server && cd server
npm init -y
npm install fastify better-sqlite3
npm install --save-dev typescript @types/node ts-node \
  jest @types/jest supertest @types/supertest ts-jest
```

**Note:** Project scaffolding using these commands is the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Repository structure: monorepo (`client/` + `server/` under one root)
- API contract: REST endpoints, shapes, and error format defined
- Database access: direct SQL via `better-sqlite3`, no ORM
- Frontend production serving: Nginx (multi-stage Docker build)
- Dev-time API communication: Vite proxy (`/api/*` → `localhost:3000`)

**Deferred Decisions (Post-MVP):**

- Database migration to PostgreSQL (architecture does not prevent it)
- Authentication / session management
- Task filtering, search, ordering

---

### Repository Structure

**Decision:** Monorepo — single repository with `client/` and `server/` subdirectories.

**Structure:**

```
todo-app/
├── client/                        # React SPA (Vite)
├── server/                        # Fastify API
├── docker-compose.yml
├── eslint.config.js               # shared lint config
├── prettier.config.js             # shared formatting
└── tsconfig.base.json             # shared TypeScript base
```

**Rationale:** Two tightly coupled services sharing TypeScript, ESLint, and Prettier. Monorepo eliminates duplication, keeps CI simple, and allows a developer to `git clone` + `docker-compose up` to get a fully working environment.

---

### Data Architecture

**Decision:** Direct SQL via `better-sqlite3`. No ORM, no migration framework.

**Rationale:** The entire data model is a single table with 4 columns. An ORM adds a dependency, an abstraction layer, and a migration toolchain for no benefit at this scale. Direct parameterized SQL is explicit, readable, and safe — `better-sqlite3` enforces prepared statements by default, preventing SQL injection. If the project grows to require PostgreSQL, the queries are trivially portable.

**Schema:**

```sql
CREATE TABLE IF NOT EXISTS todos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  text       TEXT    NOT NULL,
  completed  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

**Access pattern:** All queries are prepared statements initialized at server startup and reused. No raw string interpolation in queries.

---

### API Contract

**Base path:** `/api`

| Method | Path             | Description                                                 | Success              | Error codes   |
| ------ | ---------------- | ----------------------------------------------------------- | -------------------- | ------------- |
| GET    | `/api/todos`     | List all todos, ordered by `created_at DESC` (newest first) | 200 `Todo[]`         | 500           |
| POST   | `/api/todos`     | Create a todo                                               | 201 `Todo`           | 400, 500      |
| PATCH  | `/api/todos/:id` | Toggle `completed`                                          | 200 `Todo`           | 400, 404, 500 |
| DELETE | `/api/todos/:id` | Delete a todo                                               | 204 No Content       | 404, 500      |
| GET    | `/health`        | Health check (no `/api` prefix)                             | 200 `HealthResponse` | 503           |

**Shapes:**

```typescript
// Todo
{
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
}

// POST /api/todos body
{
  text: string;
} // max 500 chars, non-empty after trim

// PATCH /api/todos/:id body
{
  completed: boolean;
}

// Error (all 4xx / 5xx)
{
  message: string;
}

// Health
{
  status: 'ok';
  db: 'ok' | 'error';
}
```

**Validation:** Fastify JSON Schema on all request bodies and route params. Invalid payloads return 400 with `{ message }` before reaching route handlers.

---

### Frontend Architecture

**State management:**

- **Server state:** TanStack Query (`useQuery` / `useMutation`) for all server state. `useQuery({ queryKey: ['todos'], queryFn })` fetches the todo list on mount and provides `data`, `isLoading`, `isError` automatically. `useMutation` + `queryClient.invalidateQueries(['todos'])` handles add, toggle, and delete — on success the query is invalidated and the list refetches.
- **Local UI state:** plain `useState` for input value and error banner visibility. No Redux, Zustand, or other global store.
- **Update strategy:** optimistic UI — all mutations update the UI before server confirmation, with rollback on failure via `onMutate` / `onError` / `onSettled` callbacks. On success, `queryClient.invalidateQueries(['todos'])` triggers a re-fetch to confirm server state. This is the v1 interaction model, aligned with the UX specification.

**Component structure:**

```
client/src/
├── api/
│   └── todos.ts          # typed fetch wrappers, all paths relative (/api/todos)
├── hooks/
│   └── useTodos.ts       # useQuery + useMutation wrappers
├── components/
│   ├── PageShell.tsx     # centred single-column layout wrapper (max-width 560px, page padding, app title)
│   ├── TodoInput.tsx     # add-task form
│   ├── TodoList.tsx      # list container + loading / empty / populated states
│   ├── TodoItem.tsx      # single row (toggle + delete)
│   └── InlineError.tsx   # contextual inline error near the failing action (mutation + fetch errors)
└── App.tsx
```

**Dev-time API proxy (`vite.config.ts`):**

```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

Client code always uses relative paths (`/api/todos`). No environment-specific URL logic in the client — the same code works in dev (via Vite proxy) and in Docker (via Compose service name and Nginx upstream).

---

### Infrastructure & Deployment

**Frontend container (Nginx, multi-stage):**

- Stage 1: `node:22-alpine` — `npm ci && npm run build`
- Stage 2: `nginx:alpine` — copy `/dist`, serve on port 80, non-root user, SPA fallback (`try_files $uri /index.html`)

**Backend container (multi-stage):**

- Stage 1: `node:22-alpine` — `npm ci && npm run build` (tsc → `dist/`)
- Stage 2: `node:22-alpine` — copy compiled output + production `node_modules`, run as non-root user on port 3000

**Docker Compose services:**

| Service  | Image          | Port | Notes                                     |
| -------- | -------------- | ---- | ----------------------------------------- |
| `client` | nginx:alpine   | 80   | depends_on: server                        |
| `server` | node:22-alpine | 3000 | mounts `./data:/app/data` for SQLite file |

**Environment variables (server):**

```
PORT=3000
DB_PATH=/app/data/todos.db
NODE_ENV=development|production|test
```

**Health check:** `GET /health` verifies the SQLite file is reachable. Returns `{ status: "ok", db: "ok" }` or 503. Docker health check declared on the server container.

---

### Decision Impact Analysis

**Implementation sequence:**

1. Monorepo scaffold — root config (ESLint, Prettier, tsconfig base), `client/`, `server/` directories
2. Fastify server bootstrap — `better-sqlite3` init, schema creation, prepared statements
3. REST endpoints (FR22–FR26) with JSON Schema validation + health check
4. React SPA scaffold — Vite + TanStack Query setup + Vite proxy config
5. UI components — `TodoInput`, `TodoList`, `TodoItem` + loading / empty / error states
6. Docker multi-stage builds + Docker Compose orchestration (FR27–FR33)
7. Test setup — Vitest, Jest, Supertest, RTL, Playwright

**Cross-component dependencies:**

- `client/src/api/todos.ts` depends on the agreed REST contract — shapes and paths must not diverge from this document
- Vite proxy config must match the server port (`3000`) and base path (`/api`)
- Compose volume mount path (`/app/data/todos.db`) must match the `DB_PATH` env var
- Nginx SPA fallback is required — without it, hard reloads return 404

## Implementation Patterns & Consistency Rules

**9 conflict areas identified** where agents could independently make different choices.

### Naming Patterns

**Database (SQLite / better-sqlite3):**

- Tables: `snake_case`, plural — `todos`
- Columns: `snake_case` — `id`, `text`, `completed`, `created_at`
- No prefix conventions — simple names only

**API (Fastify routes):**

- Endpoints: `kebab-case`, plural nouns — `/api/todos`
- Route params: `:id` (not `{id}`)
- JSON response fields: `camelCase` — `createdAt`, not `created_at`
- The server maps DB `created_at` → JSON `createdAt` at the route handler level

**Code (TypeScript — both client and server):**

- Files: `PascalCase` for components and classes (`TodoItem.tsx`, `TodoService.ts`), `camelCase` for utilities and hooks (`useTodos.ts`, `todos.ts`)
- Functions / variables: `camelCase`
- Types / interfaces: `PascalCase` (`Todo`, `CreateTodoBody`)
- Constants: `SCREAMING_SNAKE_CASE` (`MAX_TODO_LENGTH`)

### Structure Patterns

**Test placement:**

- Server: `server/src/__tests__/` — unit and integration together, distinguished by filename suffix (`.unit.test.ts` / `.integration.test.ts`)
- Client: co-located next to the file under test — `TodoItem.test.tsx` next to `TodoItem.tsx`
- E2E: `e2e/` at monorepo root

**Import ordering (enforced by ESLint):**

1. Node built-ins
2. External packages
3. Internal absolute imports
4. Relative imports

### Format Patterns

**API responses — direct, no wrapper:**

```typescript
// ✅ Correct
GET /api/todos  → 200: Todo[]
POST /api/todos → 201: Todo

// ❌ Wrong — no envelope
{ data: Todo[], success: true }
```

**Error responses — always `{ message: string }`:**

```typescript
// All 4xx and 5xx
{ "message": "Todo not found" }
{ "message": "text is required" }
```

**Date format:** ISO 8601 strings in all JSON (`"2026-04-09T10:00:00.000Z"`). Never Unix timestamps in the API.

**Boolean in SQLite:** `better-sqlite3` returns `0` / `1` for INTEGER columns. Route handlers must cast to `boolean` before responding: `completed: row.completed === 1`.

**Max todo text length:** `500` characters. Enforced in Fastify JSON Schema (`maxLength: 500`) and mirrored in the client input (`maxLength` attribute + client-side check before submit).

### Process Patterns

**Error handling — server:**

- All errors return `{ message }` — no stack traces in responses regardless of `NODE_ENV`
- 404 for unknown `:id`; 400 for validation failures; 500 for unexpected errors
- Health check catches DB errors and returns 503, never 500

**Error handling — client:**

- TanStack Query `error` state drives all user-visible error feedback
- Failed mutations do NOT clear the input field — the user's text is preserved for retry (FR13)
- No `alert()` or `console.error` as user-facing error mechanisms

**Loading states:**

- TanStack Query `isLoading` / `isPending` drives all loading UI — no local `useState` for loading
- Loading indicator shown on initial list fetch; mutations show inline feedback (disabled button state)
- `InlineError` visibility is local `useState` — shown on mutation error, dismissed on next successful action

**Optimistic updates:**

- Used in v1 — all mutations (add, toggle, delete) update the UI immediately via `onMutate`, with rollback via `onError` and final confirmation via `onSettled` + `invalidateQueries`
- This is architecturally native to TanStack Query `useMutation` and requires no structural change to the component tree

### Enforcement Rules

All agents MUST:

- Return `camelCase` fields in all JSON responses, regardless of DB column names
- Return `{ message: string }` for every error — never a bare string, never a stack trace
- Cast SQLite booleans (`0` / `1`) to TypeScript `boolean` at the route handler boundary, not in the component
- Use relative API paths (`/api/todos`) in the client — never hardcode `localhost` or a port number
- Preserve user input on failed mutations — never reset the form on error

**Anti-patterns to avoid:**

```typescript
// ❌ Raw DB field names in JSON response
{ "created_at": "2026-04-09" }         // use createdAt

// ❌ Envelope wrapping
{ "data": [...], "status": "ok" }      // return the array directly

// ❌ Hardcoded host in client
fetch("http://localhost:3000/api/todos") // use /api/todos

// ❌ Boolean not cast from SQLite integer
{ completed: 1 }                        // must be { completed: true }

// ❌ Clearing input on mutation error
setInputValue("")                        // preserve input for retry
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
todo-app/                              # monorepo root
├── .env.example                       # env var template (committed)
├── .gitignore
├── docker-compose.yml                 # orchestrates client + server
├── eslint.config.js                   # shared flat ESLint config
├── prettier.config.js                 # shared Prettier config
├── tsconfig.base.json                 # shared TS compiler base
├── README.md
│
├── client/                            # React SPA (Vite + TS + Tailwind)
│   ├── Dockerfile                     # multi-stage: build → nginx:alpine
│   ├── nginx.conf                     # SPA fallback + /api proxy upstream
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json                  # extends ../../tsconfig.base.json
│   ├── vite.config.ts                 # includes /api proxy for dev
│   ├── vitest.config.ts
│   ├── tailwind.config.ts
│   ├── .env.example
│   └── src/
│       ├── main.tsx                   # React root mount
│       ├── App.tsx                    # single-page shell
│       ├── api/
│       │   └── todos.ts               # typed fetch wrappers, relative paths only
│       ├── hooks/
│       │   └── useTodos.ts            # useQuery + useMutation for all todo ops
│       ├── components/
│       │   ├── TodoInput.tsx          # add-task form (FR1, FR16, FR17)
│       │   ├── TodoInput.test.tsx
│       │   ├── TodoList.tsx           # list container + loading / empty / populated states (FR7–FR9)
│       │   ├── TodoList.test.tsx
│       │   ├── TodoItem.tsx           # single row: toggle + delete (FR3–FR5, FR9)
│       │   ├── TodoItem.test.tsx
│       │   ├── InlineError.tsx        # contextual inline error near the failing action (FR11–FR14)
│       │   ├── InlineError.test.tsx
│       │   ├── PageShell.tsx          # centred layout wrapper: max-width 560px, padding, app title
│       │   └── PageShell.test.tsx
│       └── types/
│           └── todo.ts                # shared Todo type (matches API shape)
│
├── server/                            # Fastify API (TS + better-sqlite3)
│   ├── Dockerfile                     # multi-stage: build → node:22-alpine
│   ├── package.json
│   ├── tsconfig.json                  # extends ../../tsconfig.base.json
│   ├── jest.config.ts
│   ├── .env.example                   # PORT, DB_PATH, NODE_ENV
│   └── src/
│       ├── index.ts                   # server bootstrap, plugin registration
│       ├── app.ts                     # Fastify instance factory (testable)
│       ├── db/
│       │   ├── client.ts              # better-sqlite3 connection + init + prepared statements
│       │   └── schema.sql             # CREATE TABLE IF NOT EXISTS todos (...)
│       ├── routes/
│       │   ├── todos.ts               # GET /api/todos, POST, PATCH/:id, DELETE/:id
│       │   └── health.ts              # GET /health
│       ├── schemas/
│       │   └── todos.ts               # Fastify JSON Schema definitions
│       ├── types/
│       │   └── todo.ts                # Todo, CreateTodoBody, PatchTodoBody
│       └── __tests__/
│           ├── todos.unit.test.ts     # route handler logic in isolation
│           ├── todos.integration.test.ts  # Supertest against real DB
│           └── health.integration.test.ts
│
├── e2e/                               # Playwright E2E tests (all 7 scenarios)
│   ├── playwright.config.ts
│   ├── fixtures/
│   │   └── db.ts                      # seed / reset helpers via API
│   └── tests/
│       ├── add-todo.spec.ts           # Journey 1: add + view
│       ├── empty-state.spec.ts        # Journey 1: empty state
│       ├── complete-todo.spec.ts      # Journey 2: toggle
│       ├── delete-todo.spec.ts        # Journey 2: delete
│       ├── persistence.spec.ts        # Journey 2: reload
│       ├── mobile-layout.spec.ts      # Journey 3: 375×812 viewport
│       └── error-state.spec.ts        # Journey 4: intercepted 500
│
└── data/                              # SQLite data volume (Docker mount)
    └── .gitkeep                       # directory tracked, DB file gitignored
```

### Architectural Boundaries

**API Boundary — the only cross-service contract:**

- `client/src/api/todos.ts` is the sole entry point from client to server
- All fetch calls go through this module — no `fetch()` calls in components directly
- `client/src/types/todo.ts` and `server/src/types/todo.ts` must stay identical

**Component Boundaries:**

- `TodoInput` owns the add form: input value (`useState`), submit handler, client-side validation
- `TodoList` owns list rendering + loading / empty / populated states
- `TodoItem` owns a single row: completed style, toggle action, delete action
- `InlineError` owns contextual error display near the failing action — shown by parent via prop
- `PageShell` owns the centred layout wrapper: max-width 560px, page padding, app title region
- No component calls `fetch()` directly — all server communication flows through `useTodos.ts`

**Data Boundary:**

- `server/src/db/client.ts` is the only file that imports `better-sqlite3`
- All SQL lives in `db/client.ts` as named prepared statements
- SQLite boolean cast (`=== 1`) happens in `db/client.ts`, not in routes or components

### Requirements to Structure Mapping

| FR Range       | Capability                 | Location                                                       |
| -------------- | -------------------------- | -------------------------------------------------------------- |
| FR1, FR16–FR18 | Create / validate todo     | `TodoInput.tsx`, `schemas/todos.ts`, `routes/todos.ts`         |
| FR2, FR7–FR10  | List display + states      | `TodoList.tsx`, `useTodos.ts`, `routes/todos.ts` GET           |
| FR3–FR4        | Toggle completed           | `TodoItem.tsx`, `routes/todos.ts` PATCH                        |
| FR5            | Delete todo                | `TodoItem.tsx`, `routes/todos.ts` DELETE                       |
| FR6            | Persistence                | `db/client.ts`, `db/schema.sql`, Docker volume                 |
| FR11–FR15      | Error handling & feedback  | `useTodos.ts` mutation callbacks, `InlineError.tsx`            |
| FR19–FR21      | Responsive + accessibility | All components — Tailwind breakpoints + ARIA                   |
| FR22–FR26      | API endpoints              | `routes/todos.ts`, `schemas/todos.ts`                          |
| FR27–FR33      | Docker / infra             | `client/Dockerfile`, `server/Dockerfile`, `docker-compose.yml` |
| FR30–FR31      | Health check               | `routes/health.ts`, Docker `HEALTHCHECK` declaration           |

### Data Flow

```
User action (click / keypress)
  → React component event handler
  → useTodos.ts mutation (TanStack Query useMutation)
  → api/todos.ts fetch wrapper (relative path /api/todos/...)
  → [dev: Vite proxy → localhost:3000] [prod: Nginx upstream → server:3000]
  → Fastify route handler
  → Fastify JSON Schema validation
  → db/client.ts prepared statement
  → SQLite file (/app/data/todos.db)
  ← row returned, booleans cast, camelCase fields mapped
  ← JSON response
  ← queryClient.invalidateQueries(['todos']) → list refetched
  ← React re-render
```

### Development Workflow

- **Local dev (no Docker):** `npm run dev` in `client/` (Vite, port 5173) + `npm run dev` in `server/` (ts-node, port 3000). Vite proxy handles `/api/*`.
- **Local dev (Docker):** `docker-compose up` — single command, all services.
- **Tests:** `npm test` in `client/` (Vitest), `npm test` in `server/` (Jest + Supertest), `npx playwright test` from repo root.
- **Build:** Each Dockerfile runs its own build step — no shared build script needed.

## Architecture Validation

### Coherence Validation ✅

All technology choices are mutually compatible and at stable versions. The Vite dev proxy and Nginx production upstream use identical path conventions (`/api/*`), ensuring client code is environment-agnostic. The single boolean-cast boundary (`db/client.ts`) and the single JSON-shape boundary (route handlers) prevent the most common cross-layer inconsistency. No contradictory decisions identified.

### Requirements Coverage ✅

All 33 functional requirements and all 6 NFR categories are architecturally supported. Every FR traces to at least one specific file in the project structure. The test strategy covers all three layers with tooling assigned and file locations defined.

### Implementation Readiness ✅

**Decision completeness:** All critical decisions are documented with versions, rationale, and explicit anti-patterns. No decision is left to agent interpretation.

**Structure completeness:** Every file in the project is named and annotated. Agents have a concrete target structure to build toward.

**Pattern completeness:** 9 conflict areas identified and resolved. Naming, format, process, and enforcement rules are all specified.

### Gap Addressed

**`nginx.conf` SPA + proxy configuration** — agents will need this exact content:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Proxy API calls to the backend service
    location /api/ {
        proxy_pass http://server:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA fallback — all non-asset routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

The `server` hostname in `proxy_pass` matches the Docker Compose service name.

### Architecture Completeness Checklist

- [x] Project context analysed — 33 FRs, 6 NFR categories, cross-cutting concerns mapped
- [x] Technology stack decided — all layers specified with versions and rationale
- [x] API contract defined — all endpoints, shapes, and error format documented
- [x] Data architecture decided — direct SQL, schema defined, boolean cast boundary specified
- [x] Repository structure decided — monorepo with shared config
- [x] Frontend architecture decided — TanStack Query server state, `useState` local state, component breakdown
- [x] Infrastructure decided — multi-stage Docker builds, Nginx, Docker Compose, volume for SQLite
- [x] Naming patterns defined — DB `snake_case`, JSON `camelCase`, code `PascalCase`/`camelCase`
- [x] Format patterns defined — direct responses (no envelope), `{ message }` errors, ISO dates
- [x] Process patterns defined — error handling, loading states, update strategy
- [x] Enforcement rules documented — with anti-pattern examples
- [x] Complete project tree defined — every file named and annotated
- [x] Requirements mapped to files — FR1–FR33 traced to specific locations
- [x] Data flow documented — end-to-end request/response path

### Architecture Readiness Assessment

**Status: READY FOR IMPLEMENTATION**

**Strengths:**

- Single-entity data model keeps the entire stack minimal and auditable
- Every boundary (API shape, boolean cast, fetch path) is a single file — refactoring is localised
- The Vite proxy / Nginx upstream symmetry means zero environment logic in client code
- TanStack Query's invalidation model keeps data flow unambiguous; optimistic updates are an additive change, not a rewrite
- All 7 E2E scenarios are named and mapped to journeys before any code is written
- QA is a first-class citizen in every story — tests are written during, not after, implementation

**Future enhancements (post-MVP, architecture supports them without structural change):**

- Swap SQLite for PostgreSQL: change `db/client.ts` and connection config only; routes and shapes unchanged
- Add authentication: Fastify plugin at the route level; TanStack Query auth headers in `api/todos.ts`
- Swap SQLite for PostgreSQL: change `db/client.ts` and connection config only; routes and shapes unchanged (already listed above)

### Implementation Handoff — Story Sequence

Testing is a first-class constraint in every story. No story is done until its defined tests pass.

---

**Story 1 — Monorepo Scaffold**
Create root config files, `client/`, `server/`, `e2e/` directories, shared ESLint/Prettier/tsconfig, empty `docker-compose.yml`.

_QA Integration:_ Set up test infrastructure immediately — Vitest in `client/`, Jest in `server/`, Playwright in `e2e/`. Configure `test` scripts in all `package.json` files. All test runners must be executable from day one, even against empty test suites.

---

**Story 2 — Backend Foundation**
Fastify server bootstrap, `better-sqlite3` init, schema creation (`CREATE TABLE IF NOT EXISTS todos`), `/health` endpoint.

_QA Integration:_ Write integration tests for the health endpoint and DB connectivity using Supertest as the backend is built. Use Postman MCP or equivalent to validate the API contract manually during development. Each route gets its integration test before the story is marked done.

---

**Story 3 — REST API**
All four todo routes (`GET /api/todos`, `POST /api/todos`, `PATCH /api/todos/:id`, `DELETE /api/todos/:id`) with Fastify JSON Schema validation, correct status codes, and `{ message }` error responses.

_QA Integration:_ Write Supertest integration tests for every endpoint as each route is implemented — success paths, validation failures (400), not-found (404), and error paths (500). Unit tests for route handler logic. All 7 API scenarios from the Test Strategy must pass before the story closes.

---

**Story 4 — Frontend SPA**
Vite + React + TypeScript scaffold, Tailwind setup, TanStack Query provider, `useTodos.ts` hook, `api/todos.ts` fetch wrappers, Vite proxy config, and all five components: `PageShell`, `TodoInput`, `TodoList`, `TodoItem`, `InlineError`.

_QA Integration:_ Write React Testing Library component tests as each component is built. Use Chrome DevTools MCP to debug layout, inspect accessibility tree, and validate WCAG contrast during development. Component tests cover: list renders, add form submits, toggle and delete trigger correct mutations, loading/empty/error states render correctly.

---

**Story 5 — E2E Test Suite**
Full Playwright test suite covering all 7 defined scenarios across the 4 user journeys (running against the local dev stack).

_QA Integration:_ Use Playwright MCP to automate browser interactions. Required scenarios: create todo (Journey 1), empty state (Journey 1), toggle complete (Journey 2), delete todo (Journey 2), persistence across reload (Journey 2), mobile layout at 375×812 (Journey 3), error state via intercepted 500 (Journey 4). All scenarios must pass before this story closes.

---

**Story 6 — Docker & Compose**
Multi-stage Dockerfiles for client (Nginx) and server (Node), `docker-compose.yml` with networking, SQLite volume mount, health checks, and environment variable wiring. `docker-compose up` must bring up the full working application.

_QA Integration:_ Verify all Supertest and Vitest tests pass inside the container build. Confirm health check endpoint responds correctly. Run the full E2E suite against the Compose stack to validate production-equivalent behaviour.
