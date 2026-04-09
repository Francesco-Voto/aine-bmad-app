---
stepsCompleted:
  [
    step-01-validate-prerequisites,
    step-02-design-epics,
    step-03-create-stories,
    step-04-final-validation,
  ]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# Todo App - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Todo App, decomposing the requirements from the PRD, UX Design Specification, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can create a new todo item by entering a text description and submitting
FR2: User can view the complete list of all todo items
FR3: User can mark a todo item as complete
FR4: User can mark a completed todo item as incomplete (toggle)
FR5: User can delete a todo item
FR6: System persists all todo items in a database across sessions and page refreshes
FR7: System displays a loading indicator while the todo list is being fetched on page open
FR8: System displays an empty state when no todo items exist
FR9: System visually distinguishes completed todo items from active ones
FR10: System displays the complete todo list in a consistent order (newest first)
FR11: System notifies the user when a create operation fails due to network unavailability
FR12: System notifies the user when a delete or update operation fails due to network unavailability
FR13: System preserves user input when a save operation fails, enabling retry without data loss
FR14: System displays a clear error state when the API is unreachable or times out
FR15: System recovers gracefully after a failed operation without requiring a page refresh
FR16: System rejects empty or whitespace-only todo text submissions
FR17: System enforces a maximum character length (500 chars) on todo text input
FR18: System validates all input server-side before persisting
FR19: Application renders and functions correctly on screen widths from 375px to 1440px
FR20: All core actions (add, complete, delete) are operable via keyboard
FR21: All interactive elements have accessible labels and meet WCAG 2.1 AA contrast requirements
FR22: System exposes an API endpoint to retrieve all todos
FR23: System exposes an API endpoint to create a new todo
FR24: System exposes an API endpoint to update a todo's completion status
FR25: System exposes an API endpoint to delete a todo
FR26: API returns appropriate error responses for invalid or malformed requests
FR27: Frontend is containerized via a Dockerfile with a multi-stage build and runs as a non-root user
FR28: Backend is containerized via a Dockerfile with a multi-stage build and runs as a non-root user
FR29: A `docker-compose.yml` orchestrates all containers (frontend, backend, database) with proper networking, volume mounts, and environment variable configuration
FR30: Backend exposes a health check endpoint that returns the service's operational status
FR31: Containers declare health checks so Docker can report and monitor container status
FR32: Application logs are accessible via `docker-compose logs`
FR33: Application supports dev and test environment configurations through environment variables and Docker Compose profiles

### NonFunctional Requirements

**Performance**
NFR1: First Contentful Paint (FCP) < 1.2 seconds on standard broadband
NFR2: All API CRUD responses complete within < 200ms under normal single-user load
NFR3: UI responds to user interaction (loading indicator or optimistic update) within 100ms

**Security**
NFR4: All API inputs validated server-side; empty, malformed, or oversized payloads rejected with appropriate HTTP error codes
NFR5: All database queries use parameterized statements to prevent SQL injection
NFR6: Backend runs as a non-root user inside its container
NFR7: No task content or user input written to application logs
NFR8: No sensitive configuration values hardcoded; all supplied via environment variables

**Reliability**
NFR9: Task data survives application restart, container restart, database restart, and full browser session close
NFR10: No user-visible action results in silent data loss — every failure surfaces a clear error or is automatically recovered
NFR11: The UI remains usable after a failed operation; no action leaves the interface broken or frozen
NFR12: Health check endpoints accurately reflect the backend's ability to serve requests and reach the database

**Accessibility**
NFR13: All interactive elements meet WCAG 2.1 AA contrast ratio requirements
NFR14: All core actions (add, complete, delete) fully operable via keyboard alone
NFR15: All form controls and buttons have descriptive ARIA labels
NFR16: Completed and active task states distinguishable by more than color alone (strikethrough + opacity)

**Maintainability**
NFR17: The codebase is structured so a developer unfamiliar with the project can understand each layer independently
NFR18: Frontend components and backend route handlers have a clear single responsibility
NFR19: All environment-specific values configurable via environment variables
NFR20: `docker-compose up` is the single command needed to spin up the full local environment

**Testing**
NFR21: Unit tests cover pure functions, hooks, and route handlers in isolation (Vitest for client, Jest for server)
NFR22: Integration tests cover API route + database interaction and React component + mock API (Supertest for server, RTL for client)
NFR23: E2E tests cover all 7 defined full user journeys using Playwright

### Additional Requirements

- ARCH1: Monorepo structure — single repo with `client/` and `server/` subdirectories; shared `eslint.config.js`, `prettier.config.js`, and `tsconfig.base.json` at root
- ARCH2: **First story is project scaffolding** — `npm create vite@latest client -- --template react-ts` for frontend; manual Fastify + better-sqlite3 setup for backend; this is the greenfield starter initialization
- ARCH3: Database is `better-sqlite3` (SQLite, no ORM); single `todos` table: `id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))`
- ARCH4: All DB queries are prepared statements initialized at server startup; no raw string interpolation; `better-sqlite3` returns `0`/`1` for booleans — route handlers must cast to `boolean` before responding
- ARCH5: REST API base path `/api`; endpoints: `GET /api/todos`, `POST /api/todos`, `PATCH /api/todos/:id`, `DELETE /api/todos/:id`, `GET /health`; error shape always `{ message: string }`; success responses are direct (no envelope wrapper)
- ARCH6: Dev-time: Vite proxy routes `/api/*` → `localhost:3000`; production: Nginx multi-stage build serves `/dist`, SPA fallback (`try_files $uri /index.html`), proxies API to backend service
- ARCH7: Frontend server state managed exclusively by TanStack Query; optimistic UI for all mutations via `onMutate`/`onError`/`onSettled`; local UI state (input value, error banner) via plain `useState` only
- ARCH8: Tech stack: React 19.x + Vite 8.x + TypeScript 5.x + Tailwind CSS 4.x + TanStack Query 5.x (frontend); Fastify 5.x + TypeScript 5.x + better-sqlite3 (backend)
- ARCH9: Testing stack: Vitest 3.x + RTL 16.x (client); Jest 29.x + Supertest 7.x (server); Playwright 1.x (E2E); ESLint 9.x flat config + Prettier 3.x (shared)
- ARCH10: Environment variables: `PORT=3000`, `DB_PATH=/app/data/todos.db`, `NODE_ENV=development|production|test`; Docker Compose mounts `./data:/app/data` for SQLite file persistence
- ARCH11: Test placement — server: `server/src/__tests__/` with `.unit.test.ts` / `.integration.test.ts` suffixes; client: co-located next to component (e.g. `TodoItem.test.tsx`); E2E: `e2e/` at monorepo root
- ARCH12: Naming conventions — DB/tables: `snake_case`; API JSON fields: `camelCase` (server maps `created_at` → `createdAt`); TypeScript files: `PascalCase` for components, `camelCase` for utils/hooks; constants: `SCREAMING_SNAKE_CASE`

### UX Design Requirements

UX-DR1: Install and configure shadcn/ui components (`Input`, `Button`, `Checkbox`) using Radix UI primitives; components copied into project source (not installed as a library) and customized at token/class level only
UX-DR2: Implement full design token system in `globals.css` as CSS custom properties — all semantic color tokens (`--color-bg` slate-50, `--color-surface` white, `--color-border` slate-200, `--color-border-focus` slate-400, `--color-text-primary` slate-900, `--color-text-secondary` slate-500, `--color-text-disabled` slate-400, `--color-accent` slate-700, `--color-accent-hover` slate-800, `--color-error` rose-600, `--color-error-subtle` rose-50), typography scale tokens (`--text-xs` through `--text-lg`), and spacing tokens (`--space-1` through `--space-8`)
UX-DR3: Load Sintony font from Google Fonts via `@import` with `font-display: swap`; fallback stack: `'Sintony', 'Inter', system-ui, -apple-system, sans-serif`; input font-size minimum 16px to prevent iOS Safari auto-zoom
UX-DR4: `PageShell` component — single-column centred layout, max-width 560px, page padding (--space-8 all sides desktop / --space-4 horizontal on mobile), `<h1>` app title at `--text-lg`, 1px `--color-border` divider between input area and list
UX-DR5: `TodoInput` compound component — bordered container (white bg, 1px `--color-border`, 8px radius, flex row) containing the text field + inline `Button` (slate-700 fill, "Add" label); states: default, focused (`--color-border-focus`), error (rose-300 border + `InlineError` below), submitting (button `opacity-0.5` + disabled); shake animation on empty/whitespace submit; character counter appears at 80% of 500-char max, turns rose-600 at limit
UX-DR6: `TodoItem` card component — white bg, 1px slate-200 border, 6px radius, 12px/14px padding, 6px margin-bottom; layout: `[Checkbox][Task text flex-1][Delete ✕ button]`; hover: border shifts to slate-300, delete button `opacity-0 → opacity-1`; delete uses `opacity` not `display:none` (remains in accessibility tree); completion state: strikethrough + `opacity-60` + `--color-text-disabled`; delete button `aria-label="Delete: {task text}"`, checkbox `aria-label="Complete: {task text}"`
UX-DR7: `TodoList` component — section label ("TASKS": 11px, 700 weight, 0.08em letter-spacing, uppercase, secondary color); states: loading (3 skeleton rows with shimmer), empty (`"No tasks yet. Add one above."` centred, secondary color, no illustration), populated (newest-first order); `aria-live="polite"` on container; `aria-busy="true"` during fetch
UX-DR8: `InlineError` component — two variants: input-level (below `TodoInput`) and item-level (below specific `TodoItem`); anatomy: `[● dot][plain message text]`; `background: rose-50`, `color: rose-600`; `role="alert"` for immediate screen-reader announcement; auto-clears on successful retry; no manual close
UX-DR9: Optimistic UI for all three mutations — add (immediate list prepend, restore text + show InlineError on failure), toggle (immediate visual state change, revert on failure), delete (fade-out + height collapse, reappear on failure) — all via TanStack Query `onMutate`/`onError`/`onSettled`
UX-DR10: Hover-reveal delete pattern — desktop: `opacity-0` at rest on list item, `opacity-1` on parent card hover; mobile/touch: delete visible at reduced opacity at rest (no hover state on touch); always in DOM and keyboard-focusable; 44×44px minimum touch target
UX-DR11: Form microcopy — input placeholder: `"Add a task…"`; empty state: `"No tasks yet. Add one above."`; network save error: `"Couldn't save — check your connection."`; load error: `"Couldn't load your tasks. Check your connection."`; tone: factual, present tense, no emoji, no exclamation marks
UX-DR12: Responsive layout — mobile-first base at 375px; breakpoints: 375–639px (`--space-4` padding, full-width elements), 640–1023px (`--space-6` padding), 1024px+ (`--space-8` padding, 560px centred max-width); `scroll-padding-top` on input to prevent keyboard obscuring on mobile iOS
UX-DR13: Keyboard navigation — `Tab`/`Shift+Tab` full traversal; `Enter` submits form; `Space` toggles checkbox; `Enter`/`Space` activates delete button; `Escape` clears input; all focusable elements use `ring-2 ring-slate-400` focus ring via `:focus-visible` (never suppressed)
UX-DR14: Full ARIA implementation — `<h1>` page heading; `role="form"` + `aria-label="Add a task"` on form; `role="list"` on `<ul>`; `role="listitem"` on `<li>`; `aria-label="Complete: {task text}"` on checkbox; `aria-label="Delete: {task text}"` on delete button; `role="alert"` on `InlineError`; `aria-live="polite"` on list container
UX-DR15: Animation and transition specifications — new task fade-in: `opacity` transition ~150ms; completion toggle: `opacity` + `text-decoration` shift 150ms ease-out; delete: `opacity 150ms` + `max-height 200ms ease-out` collapse; submit button disabled state: `opacity: 0.5`, `cursor: not-allowed`; no sounds, no confetti, no bounce

### FR Coverage Map

| FR   | Epic   | Note                                                |
| ---- | ------ | --------------------------------------------------- |
| FR1  | Epic 2 | Create todo via UI                                  |
| FR2  | Epic 2 | View todo list via UI                               |
| FR3  | Epic 2 | Toggle complete via UI                              |
| FR4  | Epic 2 | Toggle incomplete via UI                            |
| FR5  | Epic 2 | Delete todo via UI                                  |
| FR6  | Epic 1 | DB-backed persistence (server)                      |
| FR7  | Epic 2 | Loading state on list fetch                         |
| FR8  | Epic 2 | Empty state                                         |
| FR9  | Epic 2 | Visual distinction completed vs active              |
| FR10 | Epic 2 | Consistent newest-first ordering                    |
| FR11 | Epic 3 | Create failure notification                         |
| FR12 | Epic 3 | Delete/update failure notification                  |
| FR13 | Epic 3 | Input preservation on failed save                   |
| FR14 | Epic 3 | API unreachable error state                         |
| FR15 | Epic 3 | Graceful recovery without page refresh              |
| FR16 | Epic 2 | Client-side empty/whitespace rejection              |
| FR17 | Epic 2 | Client-side max-length enforcement (500 chars)      |
| FR18 | Epic 1 | Server-side input validation                        |
| FR19 | Epic 4 | Responsive layout 375px–1440px                      |
| FR20 | Epic 4 | Keyboard operability for all core actions           |
| FR21 | Epic 4 | WCAG 2.1 AA contrast + ARIA labels                  |
| FR22 | Epic 1 | GET /api/todos endpoint                             |
| FR23 | Epic 1 | POST /api/todos endpoint                            |
| FR24 | Epic 1 | PATCH /api/todos/:id endpoint                       |
| FR25 | Epic 1 | DELETE /api/todos/:id endpoint                      |
| FR26 | Epic 1 | API error responses for invalid requests            |
| FR27 | Epic 5 | Frontend multi-stage Dockerfile                     |
| FR28 | Epic 5 | Backend multi-stage Dockerfile                      |
| FR29 | Epic 5 | docker-compose.yml orchestration                    |
| FR30 | Epic 1 | Health check endpoint (backend code)                |
| FR31 | Epic 5 | Docker health check declarations                    |
| FR32 | Epic 5 | Logs via docker-compose logs                        |
| FR33 | Epic 5 | Dev/test env config via env vars + Compose profiles |

## Epic List

### Epic 1: Project Foundation & Working Backend API

A developer can run a fully functional REST API for todo CRUD, backed by a real SQLite database, with server-side validation and a health monitoring endpoint. The monorepo is scaffolded with shared tooling, and the backend test infrastructure is in place.
**FRs covered:** FR6, FR18, FR22, FR23, FR24, FR25, FR26, FR30
**ARCH covered:** ARCH1, ARCH2, ARCH3, ARCH4, ARCH5, ARCH8 (backend), ARCH9 (backend), ARCH10, ARCH11, ARCH12

### Epic 2: Core Frontend Application

A user can open the app in a browser and perform the complete todo workflow — add a task, see it in the list, toggle it complete, delete it. The app loads their persisted tasks on return visits. Loading and empty states are handled. The full visual design system (design tokens, Sintony font, shadcn/ui components, card layout) is implemented.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR7, FR8, FR9, FR10, FR16, FR17
**ARCH covered:** ARCH6, ARCH7, ARCH8 (frontend), ARCH9 (frontend unit/integration tests)
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR9 (optimistic happy path), UX-DR11 (placeholder + empty state copy)

### Epic 3: Error Handling & Resilience

A user who experiences network loss or a failed API call sees a clear, calm inline error message with their text preserved. They can retry without refreshing. The UI never freezes or becomes broken after a failed operation. Optimistic rollback is fully implemented for all mutations.
**FRs covered:** FR11, FR12, FR13, FR14, FR15
**UX-DRs covered:** UX-DR8 (InlineError component), UX-DR9 (rollback paths), UX-DR11 (error microcopy)

### Epic 4: Responsive Design & Accessibility

The app works flawlessly at all screen widths from 375px to 1440px with no layout breakage. Every core action is operable by keyboard alone. All interactive elements meet WCAG 2.1 AA contrast requirements and have descriptive ARIA labels. Animations and transitions are implemented per spec.
**FRs covered:** FR19, FR20, FR21
**UX-DRs covered:** UX-DR10 (hover-reveal delete, mobile adaptation), UX-DR12 (responsive breakpoints), UX-DR13 (keyboard nav), UX-DR14 (full ARIA), UX-DR15 (animations/transitions)

### Epic 5: Containerization & Production Readiness

A developer can run `docker-compose up` to spin up the complete environment (frontend Nginx, backend Fastify, SQLite volume). Multi-stage builds produce non-root containers. Health checks are declared at the Docker level. All configuration flows through environment variables.
**FRs covered:** FR27, FR28, FR29, FR31, FR32, FR33

---

## Epic 1: Project Foundation & Working Backend API

A developer can run a fully functional REST API for todo CRUD, backed by a real SQLite database, with server-side validation and a health monitoring endpoint. The monorepo is scaffolded with shared tooling, and the backend test infrastructure is in place.

### Story 1.1: Monorepo Scaffold & Shared Tooling

As a developer,
I want the project structure initialized with shared tooling,
So that both frontend and backend workspaces share consistent TypeScript, linting, and formatting config from day one.

**Acceptance Criteria:**

**Given** an empty repository,
**When** the scaffold script is run,
**Then** `client/` exists (Vite + React + TypeScript via `npm create vite@latest`) and `server/` exists (manual: `npm init`, Fastify + better-sqlite3 installed)
**And** root `tsconfig.base.json` with strict settings exists; `client/` and `server/` both extend it

**Given** the monorepo root,
**When** `npm run lint` is executed,
**Then** ESLint 9 flat config (`eslint.config.js`) runs typescript-eslint rules across both workspaces with zero errors on the scaffold

**Given** the monorepo root,
**When** `npm run format` is executed,
**Then** Prettier 3.x formats all files in `client/` and `server/` according to `prettier.config.js`

**Given** the monorepo root,
**When** `npm run typecheck` is executed,
**Then** TypeScript compilation passes with zero errors across both workspaces

**Given** the repository,
**When** a developer reads `README.md`,
**Then** it documents `docker-compose up` as the one-command setup (scaffold placeholder; Compose file added in Epic 5)

---

### Story 1.2: Server Bootstrap, DB Schema & Health Endpoint

As a developer,
I want the Fastify server to start with a connected SQLite database and a verified health endpoint,
So that the API foundation is confirmed working before CRUD logic is added.

**Acceptance Criteria:**

**Given** `PORT` and `DB_PATH` env vars are set,
**When** `npm run dev` is executed in `server/`,
**Then** the Fastify 5.x + TypeScript server starts and listens on the configured port

**Given** `DB_PATH` env var is not set,
**When** the server starts,
**Then** it exits immediately with a clear error message identifying the missing variable

**Given** the server starts for the first time,
**When** it initializes,
**Then** the `todos` table is created if it does not exist (`id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))`)
**And** all 4 CRUD prepared statements are initialized at startup with no raw string interpolation

**Given** the server is running with a reachable database,
**When** `GET /health` is called,
**Then** it returns `200 { "status": "ok", "db": "ok" }`

**Given** the database file is unreachable,
**When** `GET /health` is called,
**Then** it returns `503 { "status": "error", "db": "error" }`

**Given** the server receives any request,
**When** it logs the request,
**Then** it logs only method and path — never any request body content

**Given** `NODE_ENV=test` and a test-specific `DB_PATH`,
**When** the Supertest integration test suite runs,
**Then** `GET /health` returns 200 with the correct response shape

---

### Story 1.3: CRUD API Endpoints, Tests & Postman Contract Collection

As a developer,
I want all four CRUD REST endpoints fully implemented with server-side validation, integration tests passing, and a Postman collection documenting the API contract,
So that consumers have a verified, runnable source of truth for the API.

**Acceptance Criteria:**

**Given** the database has existing todos,
**When** `GET /api/todos` is called,
**Then** it returns `200 Todo[]` ordered by `created_at DESC` (newest first)

**Given** the database is empty,
**When** `GET /api/todos` is called,
**Then** it returns `200 []`

**Given** a valid `{ "text": "Buy milk" }` body,
**When** `POST /api/todos` is called,
**Then** it returns `201` with `{ id, text, completed: false, createdAt }` where `createdAt` is ISO 8601 and `completed` is a boolean

**Given** an empty string, whitespace-only, or missing `text` field,
**When** `POST /api/todos` is called,
**Then** it returns `400 { "message": "..." }`

**Given** a `text` field exceeding 500 characters,
**When** `POST /api/todos` is called,
**Then** it returns `400 { "message": "..." }`

**Given** an existing todo id and `{ "completed": true }`,
**When** `PATCH /api/todos/:id` is called,
**Then** it returns `200 Todo` with the updated `completed` value

**Given** a non-existent todo id,
**When** `PATCH /api/todos/:id` is called,
**Then** it returns `404 { "message": "..." }`

**Given** an existing todo id,
**When** `DELETE /api/todos/:id` is called,
**Then** it returns `204` with no body and the record is removed

**Given** a non-existent todo id,
**When** `DELETE /api/todos/:id` is called,
**Then** it returns `404 { "message": "..." }`

**Given** any 4xx or 5xx error condition,
**When** the server responds,
**Then** the response is always `{ "message": string }` — never a stack trace

**Given** all routes are implemented,
**When** the Supertest integration suite runs (`npm test` in `server/`),
**Then** all happy-path and error-case tests pass and the suite exits zero

**Given** a `postman/todo-app.collection.json` file exists in the monorepo root,
**When** it is imported into Postman,
**Then** it contains one folder per endpoint with requests and test scripts asserting status code, response shape, and error message format — validated via Postman MCP

---

## Epic 2: Core Frontend Application

A user can open the app in a browser and perform the complete todo workflow — add a task, see it in the list, toggle it complete, delete it. The app loads their persisted tasks on return visits. Loading and empty states are handled. The full visual design system is implemented.

### Story 2.1: Frontend Scaffold, Design System & Component Shell

As a developer,
I want the React app scaffolded with the full design token system, Sintony font, shadcn/ui primitives, and the PageShell layout,
So that all subsequent UI stories build on a verified visual foundation.

**Acceptance Criteria:**

**Given** the `client/` workspace,
**When** `npm run dev` is executed,
**Then** the Vite 8.x + React 19.x + TypeScript app starts cleanly with no console errors; TanStack Query 5.x and Tailwind CSS 4.x are configured

**Given** the Vite dev server is running,
**When** a request to `/api/*` is made from the client,
**Then** the Vite proxy forwards it to `http://localhost:3000` — no environment-specific URL logic in client code

**Given** `globals.css` is loaded,
**When** CSS custom properties are inspected,
**Then** all 11 color tokens (`--color-bg` through `--color-error-subtle`), full typography scale (`--text-xs` through `--text-lg`), and spacing tokens (`--space-1` through `--space-8`) are defined

**Given** the app renders,
**When** the font stack is inspected in Chrome DevTools,
**Then** Sintony is loaded via Google Fonts `@import` with `font-display: swap`; fallback stack is `'Sintony', 'Inter', system-ui, -apple-system, sans-serif`

**Given** shadcn/ui components are installed,
**When** `client/src/components/ui/` is inspected,
**Then** `Input`, `Button`, and `Checkbox` source files are present and customized to the design tokens

**Given** the app renders,
**When** `PageShell` is inspected,
**Then** it renders a centred single-column layout with max-width 560px, `<h1>` app title at `--text-lg`, and a 1px `--color-border` divider below the input area

**Given** Chrome DevTools MCP is available,
**When** a screenshot of the rendered shell is taken,
**Then** computed styles confirm `--color-bg: #f8fafc` and `--color-accent: #334155` resolve correctly; Sintony appears in the computed font stack

**Given** Vitest + RTL are configured,
**When** `npm test` is run in `client/`,
**Then** the `PageShell` snapshot test passes

---

### Story 2.2: Todo API Client & Data Fetching Hook

As a developer,
I want a typed API client and a TanStack Query hook for fetching todos,
So that UI components have a clean, type-safe data contract to build against.

**Acceptance Criteria:**

**Given** `client/src/api/todos.ts`,
**When** it is reviewed,
**Then** it exports typed fetch wrappers for all 4 endpoints using only relative paths (`/api/todos`) — no hardcoded host or port

**Given** the `Todo` TypeScript type,
**When** it is compared to the API contract,
**Then** it exactly matches `{ id: number; text: string; completed: boolean; createdAt: string }`

**Given** `client/src/hooks/useTodos.ts`,
**When** it is called in a component,
**Then** it returns `{ data, isLoading, isError }` via `useQuery({ queryKey: ['todos'], queryFn })`

**Given** the Vitest suite,
**When** API wrapper unit tests run,
**Then** each wrapper constructs the correct method, path, and body options

**Given** RTL tests for `useTodos`,
**When** the mock fetch resolves,
**Then** the hook transitions correctly: loading → data on success, loading → error on non-2xx response

---

### Story 2.3: TodoList — Loading, Empty & Populated States

As a user,
I want to open the app and immediately see my tasks or a clear empty state,
So that I always know the current state of my list.

**Acceptance Criteria:**

**Given** `isLoading` is true,
**When** `TodoList` renders,
**Then** 3 skeleton rows with shimmer animation are shown and `aria-busy="true"` is set on the container

**Given** the API returns an empty array,
**When** `TodoList` renders,
**Then** `"No tasks yet. Add one above."` is shown centred in `--color-text-secondary` with no illustration

**Given** the API returns todos,
**When** `TodoList` renders,
**Then** task cards appear with a "TASKS" section label (11px, 700 weight, 0.08em letter-spacing, uppercase, secondary color)
**And** `role="list"` is on `<ul>`, `role="listitem"` on each `<li>`, and `aria-live="polite"` on the container

**Given** Chrome DevTools MCP is available,
**When** screenshots are taken of each state,
**Then** loading skeleton, empty state copy, and populated list all render correctly; accessibility tree confirms `role="list"` and `aria-live="polite"`

**Given** RTL tests,
**When** each state is rendered,
**Then** loading state shows skeleton rows; empty state shows correct copy; populated state shows correct item count

---

### Story 2.4: TodoItem — Display, Toggle & Delete

As a user,
I want to see each task as a card, toggle its completion, and delete it,
So that I can manage my list fluidly.

**Acceptance Criteria:**

**Given** an active todo item,
**When** `TodoItem` renders,
**Then** it shows white bg, 1px `--color-border` border, 6px radius, 12px/14px padding, 6px margin-bottom, with layout `[Checkbox][text flex-1][Delete ✕]` at full opacity

**Given** a completed todo item,
**When** `TodoItem` renders,
**Then** task text has strikethrough + `opacity-60` + `--color-text-disabled` color — distinguished from active state without relying on color alone

**Given** the card is hovered,
**When** the CSS hover state applies,
**Then** the card border shifts to slate-300 and the delete button transitions from `opacity-0` to `opacity-1`

**Given** the delete button at rest,
**When** the DOM is inspected,
**Then** the button is present in the DOM with `opacity-0` (not `display:none`) and has `aria-label="Delete: {task text}"`; the checkbox has `aria-label="Complete: {task text}"`

**Given** the user clicks the checkbox,
**When** the toggle mutation fires,
**Then** the item immediately reflects the new completed state (optimistic); on API success `queryClient.invalidateQueries(['todos'])` is called; on failure the item reverts to its previous state

**Given** the user clicks the delete button,
**When** the delete mutation fires,
**Then** the item immediately begins `opacity 150ms` + `max-height 200ms ease-out` collapse (optimistic); on failure the item reappears

**Given** Chrome DevTools MCP is available,
**When** active and completed items are screenshotted side-by-side,
**Then** strikethrough and opacity difference are visible; accessibility tree confirms ARIA labels; delete button present in DOM at `opacity: 0` at rest

**Given** RTL tests,
**When** interactions are simulated,
**Then** completed item shows strikethrough; delete triggers mutation; toggle sends correct payload; optimistic state applies before API response resolves

---

### Story 2.5: TodoInput — Task Creation

As a user,
I want to type a task and press Enter (or tap Add) to instantly see it in my list,
So that task capture is immediate and effortless.

**Acceptance Criteria:**

**Given** the app loads,
**When** the page renders,
**Then** `TodoInput` is autofocused; placeholder text reads `"Add a task…"`; the compound container shows white bg with 1px `--color-border` border and 8px radius

**Given** the user presses Enter or taps the Add button,
**When** the input is empty or whitespace-only,
**Then** a subtle shake animation plays on the input, focus is retained, and the mutation is not called

**Given** the input reaches 400 characters (80% of 500),
**When** the user continues typing,
**Then** a character counter appears; at 500 characters it turns `rose-600` and the submit is blocked

**Given** a valid task text,
**When** the user submits,
**Then** the task is optimistically prepended to the list before API response; input clears and refocuses immediately

**Given** the API confirms success,
**When** the mutation settles,
**Then** `queryClient.invalidateQueries(['todos'])` is called to confirm server state

**Given** the submit button is in-flight,
**When** the mutation is pending,
**Then** the button has `opacity: 0.5`, `cursor: not-allowed`, and the disabled attribute

**Given** Chrome DevTools MCP is available,
**When** screenshots are taken,
**Then** default, focused, and error input states are captured; character counter visible at threshold; `aria-label="Add a task"` confirmed on the form element in the accessibility tree

**Given** RTL tests,
**When** interactions are simulated,
**Then** empty submit does not call mutation; valid submit calls mutation with correct payload; input clears after success; character counter appears and blocks submit at limit

---

## Epic 3: Error Handling & Resilience

A user who experiences network loss or a failed API call sees a clear, calm inline error message with their text preserved. They can retry without refreshing. The UI never freezes or becomes broken after a failed operation.

### Story 3.1: InlineError Component

As a developer,
I want a reusable inline error component,
So that every failure surface in the app has a consistent, calm, accessible presentation.

**Acceptance Criteria:**

**Given** a non-empty `message` string is passed,
**When** `InlineError` renders,
**Then** it shows a small `●` dot + message text with `background: rose-50`, `color: rose-600`
**And** `role="alert"` is on the root element, announcing immediately to screen readers

**Given** no `message` prop (or empty string),
**When** `InlineError` renders,
**Then** it renders `null` — clean unmount with nothing in the DOM

**Given** the `variant` prop,
**When** set to `"input"` or `"item"`,
**Then** the component renders in the correct position relative to its parent (below `TodoInput` or below a `TodoItem`)

**Given** Chrome DevTools MCP is available,
**When** both variants are screenshotted,
**Then** `role="alert"` is confirmed in the accessibility tree; color contrast of `rose-600` on `rose-50` is verified ≥ 4.5:1 (WCAG AA)

**Given** RTL tests,
**When** each case is tested,
**Then** message renders when provided; `role="alert"` is present; nothing renders when message is absent

---

### Story 3.2: Create Failure — Input Preservation & Retry

As a user,
I want my text restored and a clear error shown when saving a new task fails,
So that I can retry without retyping or losing anything.

**Acceptance Criteria:**

**Given** the create mutation fails (network loss or API error),
**When** `onError` fires,
**Then** the optimistically inserted item is removed from the list; `InlineError` with `"Couldn't save — check your connection."` appears below `TodoInput`; original typed text is restored to the input field

**Given** the error state is shown,
**When** the input field is inspected,
**Then** it is focused and contains the user's original text — ready for retry

**Given** the user resubmits successfully,
**When** the mutation succeeds,
**Then** `InlineError` auto-clears; task appears in list normally

**Given** the user submits while a previous error is showing,
**When** the new mutation fires,
**Then** the existing error is replaced (no stacking of error messages)

**Given** Chrome DevTools MCP is available,
**When** `POST /api/todos` is intercepted to return 500,
**Then** screenshot confirms `InlineError` below input with text restored; list is unchanged (optimistic item removed)

**Given** RTL tests,
**When** the mutation is mocked to fail,
**Then** `InlineError` renders with correct copy; input value is restored after failure; error clears on successful retry

---

### Story 3.3: Toggle & Delete Failures — Item-Level Error & Rollback

As a user,
I want a failed toggle or delete to revert and show a calm inline error on that item,
So that my list remains accurate and I know what happened.

**Acceptance Criteria:**

**Given** the toggle mutation fails,
**When** `onError` fires on `TodoItem`,
**Then** the item reverts to its previous `completed` state; `InlineError` with `"Couldn't update — try again."` appears below that specific item

**Given** the delete mutation fails,
**When** `onError` fires on `TodoItem`,
**Then** the deleted item reappears in its original list position; `InlineError` with `"Couldn't delete — try again."` appears below that specific item

**Given** a failure occurs on one item,
**When** the rest of the list is inspected,
**Then** all other items are entirely unaffected — no global error state

**Given** the user retries successfully,
**When** the next action on that item succeeds,
**Then** its `InlineError` clears automatically

**Given** Chrome DevTools MCP is available,
**When** `PATCH` is intercepted to return 500,
**Then** screenshot shows toggle rollback with item-level `InlineError`; repeat for `DELETE` → 500; confirm rest of list unchanged

**Given** RTL tests,
**When** mutations are mocked to fail,
**Then** toggle reverts state and shows correct error; delete restores item and shows correct error; sibling items unaffected; error clears on subsequent success

---

### Story 3.4: List Load Failure & Retry

As a user,
I want a clear error with a retry action when the app can't load my tasks,
So that I'm never left staring at a blank screen.

**Acceptance Criteria:**

**Given** `useQuery` returns `isError: true` on initial fetch,
**When** `TodoList` renders,
**Then** it shows `"Couldn't load your tasks. Check your connection."` and a visible Retry button — not a blank screen

**Given** the user clicks Retry,
**When** `queryClient.refetchQueries(['todos'])` is called,
**Then** the loading skeleton re-appears while fetching; on success the list renders normally — no page refresh required

**Given** the retry is in progress,
**When** the list container is inspected,
**Then** `aria-busy="true"` is set and skeleton rows are shown

**Given** Chrome DevTools MCP is available,
**When** `GET /api/todos` is intercepted to return 503,
**Then** screenshot shows list-level error state with Retry visible; clicking Retry and then unblocking the request shows recovery to the populated list

**Given** RTL tests,
**When** `isError` state is simulated,
**Then** error message and Retry button render; Retry triggers refetch; successful refetch renders todo list

---

## Epic 4: Responsive Design & Accessibility

The app works flawlessly at all screen widths from 375px to 1440px. Every core action is operable by keyboard alone. All interactive elements meet WCAG 2.1 AA and have descriptive ARIA labels. Animations and transitions are implemented per spec.

### Story 4.1: Responsive Layout

As a user on any device,
I want the app to render correctly from 375px to 1440px,
So that I can use it comfortably on mobile or desktop without horizontal scroll or broken layout.

**Acceptance Criteria:**

**Given** the app renders at any viewport width 375px–1440px,
**When** the layout is inspected,
**Then** there is no horizontal scroll and no element overflows the viewport

**Given** a 375–639px viewport,
**When** `PageShell` padding is inspected,
**Then** horizontal padding is `--space-4` (16px); all components are `w-full`

**Given** a 640–1023px viewport,
**When** `PageShell` padding is inspected,
**Then** horizontal padding is `--space-6` (24px)

**Given** a 1024px+ viewport,
**When** `PageShell` padding is inspected,
**Then** all-sides padding is `--space-8` (32px) and the content column is centred at max-width 560px

**Given** a mobile viewport with the keyboard open,
**When** the input is focused on iOS Safari,
**Then** `scroll-padding-top` prevents the keyboard from obscuring the input; font-size is 16px minimum (no auto-zoom)

**Given** a touch device (no hover),
**When** `TodoItem` renders,
**Then** the delete button is visible at rest (not `opacity-0`) — no hover-only critical paths

**Given** Chrome DevTools MCP is available,
**When** viewport is emulated at 375×812,
**Then** screenshot confirms input visible, list readable, Add button reachable, no horizontal scroll
**And** viewport emulated at 1440×900 confirms centred desktop layout

**Given** RTL tests,
**When** `PageShell` is rendered,
**Then** it renders children without overflow; input font-size is 16px minimum

---

### Story 4.2: Keyboard Navigation & Focus Management

As a keyboard user,
I want to operate every action — add, complete, delete — without a mouse,
So that the app is fully accessible to me.

**Acceptance Criteria:**

**Given** the keyboard user tabs through the app,
**When** `Tab` / `Shift+Tab` is pressed,
**Then** focus traverses in DOM order: input field → Add button → checkboxes → delete buttons — no `tabindex` manipulation

**Given** focus is on the input and the user presses `Enter`,
**When** the input has valid text,
**Then** the form submits, the task is added, and focus returns to the input

**Given** focus is on a checkbox and the user presses `Space`,
**When** the action fires,
**Then** the todo's completed state toggles

**Given** focus is on a delete button and the user presses `Enter` or `Space`,
**When** the action fires,
**Then** the todo is deleted

**Given** focus is on the input and the user presses `Escape`,
**When** the key fires,
**Then** the input value is cleared and focus is removed from the field

**Given** a task is deleted via keyboard,
**When** the item is removed from the list,
**Then** focus moves to the next item in the list, or to the input if the list is now empty

**Given** any focusable element receives keyboard focus,
**When** the focus ring is inspected,
**Then** `ring-2 ring-slate-400` is visible via `:focus-visible` — never suppressed

**Given** Chrome DevTools MCP is available,
**When** focus screenshots are taken on input, Add button, and first checkbox,
**Then** focus ring is clearly visible in each; accessibility audit confirms zero keyboard-related violations

**Given** RTL tests,
**When** keyboard events are simulated,
**Then** `Enter` submits; `Space` toggles checkbox; `Escape` clears input; focus returns to input after creation; focus ring class present on all interactive elements

---

### Story 4.3: Full ARIA Implementation & Accessibility Audit

As a screen reader user,
I want all list changes, errors, and interactive elements to be announced correctly,
So that I can use the app without visual output.

**Acceptance Criteria:**

**Given** the page renders,
**When** the heading structure is inspected,
**Then** there is exactly one `<h1>` describing the app purpose

**Given** the add form,
**When** ARIA attributes are inspected,
**Then** `role="form"` and `aria-label="Add a task"` are present

**Given** the todo list,
**When** ARIA attributes are inspected,
**Then** `<ul>` has `role="list"`; each `<li>` has `role="listitem"`; the container has `aria-live="polite"` and `aria-busy="true"` during fetch

**Given** each `TodoItem`,
**When** ARIA labels are inspected,
**Then** checkbox has `aria-label="Complete: {task text}"` and delete button has `aria-label="Delete: {task text}"`

**Given** an `InlineError` renders,
**When** the accessibility tree is inspected,
**Then** `role="alert"` announces the message immediately on render

**Given** the delete button uses `opacity-0`,
**When** the accessibility tree is inspected,
**Then** the button is present and keyboard-focusable at all times (not hidden from the tree)

**Given** Chrome DevTools MCP is available,
**When** the full Lighthouse accessibility audit is run,
**Then** the score is ≥ 95; the accessibility tree for the list, form, and a single `TodoItem` confirms all ARIA attributes; `aria-live="polite"` confirmed on list container

**Given** RTL tests,
**When** all components are rendered,
**Then** all ARIA attributes are verified; `aria-busy` toggles correctly; `aria-live` is present

---

### Story 4.4: Animations, Transitions & Polish

As a user,
I want subtle, purposeful animations on task interactions,
So that the app feels responsive and alive without being distracting.

**Acceptance Criteria:**

**Given** a new task is optimistically inserted,
**When** it appears in the list,
**Then** it fades in with `opacity 0 → 1` transition of ~150ms

**Given** a todo is toggled complete,
**When** the transition fires,
**Then** `opacity` and `text-decoration` shift with 150ms ease-out

**Given** a todo is deleted,
**When** the item collapses,
**Then** `opacity 150ms ease-out` and `max-height 200ms ease-out` run — no jarring list jump

**Given** the Add mutation is in-flight,
**When** the button state is inspected,
**Then** `opacity: 0.5`, `cursor: not-allowed`, and disabled attribute are set

**Given** the list is loading,
**When** the skeleton renders,
**Then** a CSS `@keyframes` pulse animation runs on the 3 placeholder rows — no JS animation

**Given** all transition values,
**When** the code is reviewed,
**Then** all transitions are declared via CSS/Tailwind utility classes — no inline `style` transitions

**Given** `prefers-reduced-motion: reduce` is active,
**When** any animation or transition would run,
**Then** all transitions and animations are set to `none` via the media query — no motion for opted-out users

**Given** Chrome DevTools MCP is available,
**When** the delete collapse is traced in the Performance panel,
**Then** the animation runs smoothly; `prefers-reduced-motion: reduce` is emulated in the Rendering panel and screenshot confirms no animation on toggle or delete

**Given** RTL tests,
**When** `prefers-reduced-motion` media query is mocked,
**Then** transitions are absent; submit button has disabled attribute during pending mutation

---

## Epic 5: Containerization & Production Readiness

A developer can run `docker-compose up` to spin up the complete environment. Multi-stage builds produce non-root containers. Health checks are declared at the Docker level. All configuration flows through environment variables.

### Story 5.1: Backend Dockerfile (Multi-Stage, Non-Root)

As a developer,
I want the backend containerized with a production-ready multi-stage Dockerfile,
So that it runs securely and efficiently in any Docker environment.

**Acceptance Criteria:**

**Given** `server/Dockerfile`,
**When** the build stages are reviewed,
**Then** Stage 1 uses `node:22-alpine` to run `npm ci && npm run build` (tsc → `dist/`); Stage 2 uses `node:22-alpine` and copies only `dist/` and production `node_modules`

**Given** the built image,
**When** the running container's process is inspected,
**Then** it runs as a non-root user (created via `adduser` / `USER` directive)

**Given** `PORT`, `DB_PATH`, and `NODE_ENV` are supplied as env vars,
**When** the container starts,
**Then** the server starts on the configured port with no hardcoded values

**Given** `docker build -t todo-server ./server` is run,
**When** the build completes,
**Then** it exits successfully with no errors

**Given** the container runs with a mounted data volume and correct env vars,
**When** `GET /health` is called,
**Then** it returns `200 { "status": "ok", "db": "ok" }`

**Given** `docker logs <container>` is run,
**When** the output is reviewed,
**Then** request method and path are logged; no task content appears in the logs

---

### Story 5.2: Frontend Dockerfile (Multi-Stage, Nginx, Non-Root)

As a developer,
I want the frontend containerized with a production Nginx build,
So that the React SPA is served correctly with API proxying and SPA fallback.

**Acceptance Criteria:**

**Given** `client/Dockerfile`,
**When** the build stages are reviewed,
**Then** Stage 1 uses `node:22-alpine` to run `npm ci && npm run build`; Stage 2 uses `nginx:alpine` and copies `/dist` to the Nginx webroot

**Given** the Nginx configuration,
**When** it is reviewed,
**Then** it serves on port 80, has SPA fallback (`try_files $uri /index.html`), and proxies `/api/*` to the backend using the Compose service name

**Given** the built image,
**When** the running container's process is inspected,
**Then** it runs as a non-root user

**Given** `docker build -t todo-client ./client` is run,
**When** the build completes,
**Then** it exits successfully

**Given** the container starts,
**When** `http://localhost:80` is requested,
**Then** the React app HTML is served

---

### Story 5.3: Docker Compose Orchestration & Full Environment

As a developer,
I want `docker-compose up` to start the complete working environment,
So that the entire app is reproducible with a single command.

**Acceptance Criteria:**

**Given** `docker-compose.yml` at the monorepo root,
**When** it is reviewed,
**Then** it defines `client` (nginx:alpine, port 80) and `server` (node:22-alpine, port 3000) services; `client` has `depends_on: server`

**Given** the `server` service configuration,
**When** volume mounts are inspected,
**Then** `./data:/app/data` is mounted for SQLite persistence across container restarts

**Given** the `server` service,
**When** env vars are inspected,
**Then** `PORT`, `DB_PATH`, and `NODE_ENV` are configured in Compose; no secrets are hardcoded

**Given** the `server` container,
**When** Docker health check is inspected,
**Then** it uses `GET /health`; Docker reports the container as healthy or unhealthy accordingly

**Given** `docker-compose up` is run,
**When** both containers are healthy,
**Then** `curl http://localhost` returns the React app; `curl http://localhost/api/todos` returns `200 []` via Nginx proxy

**Given** `docker-compose down` then `docker-compose up` is run,
**When** the list is fetched,
**Then** previously created todos are still present (SQLite volume persisted)

**Given** `docker-compose logs server` and `docker-compose logs client`,
**When** run after startup,
**Then** both produce output confirming the services started

---

### Story 5.4: Dev & Test Environment Profiles

As a developer,
I want separate dev and test environment configurations via Docker Compose profiles,
So that I can run the full stack locally or in CI without environment leakage.

**Acceptance Criteria:**

**Given** a `dev` Compose profile (or `docker-compose.override.yml`),
**When** `docker-compose --profile dev up` is run,
**Then** the stack starts in dev configuration (e.g. hot-reload or source mounts where applicable)

**Given** `NODE_ENV=test` and a test-specific `DB_PATH` (e.g. `./data/test.db`),
**When** `docker-compose --profile test up` is run,
**Then** the test database is separate from the production database — no data leakage between environments

**Given** all environment-specific values,
**When** the Compose file and a `.env` file are reviewed,
**Then** every value (port, DB path, `NODE_ENV`) is overridable via `.env` or shell env vars without editing the Compose file directly

**Given** `docker-compose up` with no profile,
**When** it starts,
**Then** the default production configuration runs cleanly

**Given** the `README.md`,
**When** it is read,
**Then** it documents all available profiles and confirms `docker-compose up` as the single-command setup
