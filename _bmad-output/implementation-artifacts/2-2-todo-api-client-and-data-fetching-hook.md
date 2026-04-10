# Story 2.2: Todo API Client & Data Fetching Hook

Status: done

## Story

As a developer,
I want a typed API client and a TanStack Query hook for fetching todos,
So that UI components have a clean, type-safe data contract to build against.

## Acceptance Criteria

1. **Given** `client/src/api/todos.ts`, **When** it is reviewed, **Then** it exports typed fetch wrappers for all 4 endpoints using only relative paths (`/api/todos`) — no hardcoded host or port
2. **Given** the `Todo` TypeScript type, **When** it is compared to the API contract, **Then** it exactly matches `{ id: number; text: string; completed: boolean; createdAt: string }`
3. **Given** `client/src/hooks/useTodos.ts`, **When** it is called in a component, **Then** it returns `{ data, isLoading, isError }` via `useQuery({ queryKey: ['todos'], queryFn })`
4. **Given** the Vitest suite, **When** API wrapper unit tests run, **Then** each wrapper constructs the correct method, path, and body options
5. **Given** RTL tests for `useTodos`, **When** the mock fetch resolves, **Then** the hook transitions correctly: loading → data on success, loading → error on non-2xx response

## Tasks / Subtasks

- [x] Task 1: Define the `Todo` type and API error helper (AC: 2)
  - [x] Create `client/src/api/types.ts`
  - [x] Export the `Todo` type matching the server's `toTodo()` output exactly:
    ```ts
    export type Todo = {
      id: number;
      text: string;
      completed: boolean;
      createdAt: string;
    };
    ```
  - [x] Export an `ApiError` class that extends `Error` and carries `status: number`:
    ```ts
    export class ApiError extends Error {
      constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
      }
    }
    ```
  - [x] Export a `throwIfNotOk` helper: if `response.ok` is false, read `response.json()` and throw `new ApiError(response.status, json.message ?? 'Request failed')`

- [x] Task 2: Implement `client/src/api/todos.ts` with all 4 typed wrappers (AC: 1)
  - [x] Create `client/src/api/todos.ts`
  - [x] Import `Todo`, `ApiError`, `throwIfNotOk` from `./types`
  - [x] Implement `getTodos(): Promise<Todo[]>`:
    - `fetch('/api/todos')` → call `throwIfNotOk` → return `res.json()`
  - [x] Implement `createTodo(text: string): Promise<Todo>`:
    - `fetch('/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })` → call `throwIfNotOk` → return `res.json()`
  - [x] Implement `toggleTodo(id: number, completed: boolean): Promise<Todo>`:
    - `fetch(`/api/todos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed }) })` → call `throwIfNotOk` → return `res.json()`
  - [x] Implement `deleteTodo(id: number): Promise<void>`:
    - `fetch(`/api/todos/${id}`, { method: 'DELETE' })` → call `throwIfNotOk` → return (no body on 204)
  - [x] All paths are relative (`/api/todos`, `/api/todos/${id}`) — no `http://localhost:3000` or similar

- [x] Task 3: Create `client/src/hooks/useTodos.ts` (AC: 3)
  - [x] Import `useQuery` from `@tanstack/react-query`
  - [x] Import `getTodos` from `../api/todos`
  - [x] Import `Todo` from `../api/types`
  - [x] Export `useTodos()` hook:
    ```ts
    export function useTodos() {
      return useQuery<Todo[]>({
        queryKey: ['todos'],
        queryFn: getTodos,
      });
    }
    ```
  - [x] The hook returns `{ data, isLoading, isError, error }` — consumers destructure what they need; no additional logic beyond the query

- [x] Task 4: Write unit tests for the API wrappers (AC: 4)
  - [x] Create `client/src/api/todos.test.ts`
  - [x] Use `vi.stubGlobal('fetch', vi.fn())` (or `vi.spyOn(global, 'fetch')`) to mock the global `fetch`
  - [x] Reset mock in `afterEach`
  - [x] Test `getTodos`:
    - mock `fetch` to resolve with `{ ok: true, json: async () => [{ id: 1, text: 'Test', completed: false, createdAt: '2026-01-01T00:00:00.000Z' }] }`
    - assert `fetch` was called with `'/api/todos'` and default method (GET)
    - assert result is the expected `Todo[]`
  - [x] Test `createTodo`:
    - mock `fetch` to resolve with `{ ok: true, status: 201, json: async () => ({ id: 2, text: 'New', completed: false, createdAt: '...' }) }`
    - assert `fetch` was called with `'/api/todos'`, method `'POST'`, correct `Content-Type` header, correct stringified body
    - assert result is the returned `Todo`
  - [x] Test `toggleTodo`:
    - mock `fetch` to resolve with `{ ok: true, json: async () => ({ id: 1, text: 'Test', completed: true, createdAt: '...' }) }`
    - assert called with `'/api/todos/1'`, method `'PATCH'`, body `JSON.stringify({ completed: true })`
  - [x] Test `deleteTodo`:
    - mock `fetch` to resolve with `{ ok: true, status: 204, json: async () => ({}) }`
    - assert called with `'/api/todos/1'`, method `'DELETE'`
    - assert returns `undefined`
  - [x] Test error path (`throwIfNotOk`):
    - mock `fetch` to resolve with `{ ok: false, status: 404, json: async () => ({ message: 'Todo 99 not found' }) }`
    - assert `getTodos()` rejects with an `ApiError` where `status === 404` and `message === 'Todo 99 not found'`

- [x] Task 5: Write RTL + TanStack Query tests for `useTodos` hook (AC: 5)
  - [x] Create `client/src/hooks/useTodos.test.tsx`
  - [x] Create a `renderHook` wrapper with `QueryClientProvider`:
    ```tsx
    function wrapper({ children }: { children: React.ReactNode }) {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    }
    ```
  - [x] Use `renderHook(() => useTodos(), { wrapper })` from `@testing-library/react`
  - [x] Mock `fetch` globally before each test, reset in `afterEach`
  - [x] Test: success path
    - mock `fetch` to resolve with `{ ok: true, json: async () => [{ id: 1, text: 'Task', completed: false, createdAt: '...' }] }`
    - after `await waitFor(() => expect(result.current.isLoading).toBe(false))`
    - assert `result.current.data` equals the expected array
    - assert `result.current.isError` is `false`
  - [x] Test: error path
    - mock `fetch` to resolve with `{ ok: false, status: 500, json: async () => ({ message: 'Internal server error' }) }`
    - after `await waitFor(() => expect(result.current.isError).toBe(true))`
    - assert `result.current.error` is an `ApiError` with `status === 500`
  - [x] Run `npm run test --workspace=client` — exits zero, 10/10 tests pass

## Dev Notes

### API Contract (from server implementation)

The server routes are registered under the `/api` prefix in `server/src/app.ts`. The 4 endpoints:

| Method | Path | Request body | Success response |
|---|---|---|---|
| GET | `/api/todos` | — | `200 Todo[]` |
| POST | `/api/todos` | `{ text: string }` (1–500 chars) | `201 Todo` |
| PATCH | `/api/todos/:id` | `{ completed: boolean }` | `200 Todo` |
| DELETE | `/api/todos/:id` | — | `204 (no body)` |

**Error response shape** (all error cases from the server):
```json
{ "message": "string" }
```

The `toTodo()` function in `server/src/routes/todos.ts` maps the DB row:
- `completed: 0 | 1` → `boolean`
- `created_at: string` → `createdAt: string` (ISO 8601)

The `Todo` type in `client/src/api/types.ts` must match this output exactly.

### No Extra Dependencies Needed

All required packages are already installed (`@tanstack/react-query@5.74.4`). No new npm installs are needed for this story.

### Vite Proxy — Already Configured

Story 2.1 added the Vite proxy to `client/vite.config.ts`:
```ts
server: {
  proxy: {
    '/api': 'http://localhost:3000',
  },
},
```

This means all `/api/*` fetch calls from the browser hit `localhost:3000`. In tests, fetch is mocked and the proxy is irrelevant.

### TanStack Query v5 API

This project uses `@tanstack/react-query@5.74.4`. Key v5 differences from v4:
- `useQuery` accepts a single options object — `useQuery({ queryKey, queryFn })` — not positional arguments
- `isLoading` means "no cached data AND fetching". For a hook with no prior cache, this behaves as expected.
- `renderHook` from `@testing-library/react` (v16.x) is used directly — no separate `@testing-library/react-hooks` package needed

### Mocking `fetch` in Vitest

The test environment is jsdom (set in `client/vitest.config.ts`). jsdom does not provide a real `fetch`, but React Testing Library 16 + Vitest 3.x provides one via the environment setup. Use `vi.stubGlobal('fetch', vi.fn())` to override it cleanly. Reset with `vi.restoreAllMocks()` or `vi.unstubAllGlobals()` in `afterEach`.

Example mock pattern:
```ts
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

mockFetch.mockResolvedValueOnce({
  ok: true,
  status: 200,
  json: async () => [{ id: 1, text: 'Test', completed: false, createdAt: '2026-01-01T00:00:00.000Z' }],
} as Response);
```

### File Structure After Story 2.2

```
client/src/
  api/
    types.ts        ← Todo type, ApiError, throwIfNotOk
    todos.ts        ← 4 typed fetch wrappers
    todos.test.ts   ← unit tests for wrappers + error path
  hooks/
    useTodos.ts     ← useQuery wrapper
    useTodos.test.tsx ← RTL hook tests
  components/       ← unchanged from Story 2.1
  lib/              ← unchanged from Story 2.1
  globals.css       ← unchanged
  main.tsx          ← unchanged
  App.tsx           ← unchanged
```

### Current Codebase State

**Already implemented (Story 2.1):**
- `client/src/globals.css` — full design token system + Tailwind v4 `@import`
- `client/src/main.tsx` — `QueryClientProvider` wrapping `<App />`
- `client/src/App.tsx` — renders `<PageShell title="Todo"><></></PageShell>`
- `client/src/components/PageShell.tsx` — centred layout, max-width 560px, heading + divider
- `client/src/components/ui/Button.tsx`, `Input.tsx`, `Checkbox.tsx` — shadcn/ui source files
- `client/src/lib/utils.ts` — `cn()` helper
- `client/vite.config.ts` — Vite proxy `/api` → `localhost:3000`

**No `api/` or `hooks/` directories exist yet** — both are created fresh in this story.

### Working Directory

All `npm` commands from the repo root via workspaces. Use `npm run test --workspace=client` to run only client tests.

### Definition of Done

- [x] `client/src/api/types.ts` exports `Todo`, `ApiError`, and `throwIfNotOk`
- [x] `client/src/api/todos.ts` exports `getTodos`, `createTodo`, `toggleTodo`, `deleteTodo` — all relative paths
- [x] `client/src/hooks/useTodos.ts` exports `useTodos()` using `useQuery`
- [x] `client/src/api/todos.test.ts` covers all 4 wrappers + error path, all passing
- [x] `client/src/hooks/useTodos.test.tsx` covers success and error transitions, all passing
- [x] `npm run test --workspace=client` exits zero (10 tests pass across 3 files)
- [x] `npm run typecheck` from repo root exits zero

## Dev Agent Record

- **Completed by:** GitHub Copilot (Claude Sonnet 4.6)
- **Date:** 2026-04-10
- **Files created:**
  - `client/src/api/types.ts` — `Todo` type, `ApiError` class, `throwIfNotOk` async helper
  - `client/src/api/todos.ts` — 4 typed fetch wrappers using relative `/api/*` paths
  - `client/src/hooks/useTodos.ts` — `useQuery<Todo[]>` wrapper with `queryKey: ['todos']`
  - `client/src/api/todos.test.ts` — 5 unit tests (4 wrappers + error path)
  - `client/src/hooks/useTodos.test.tsx` — 2 RTL hook tests (success + error transitions)
- **Key decisions:**
  - `throwIfNotOk` is `async` so it can `await response.json()` before throwing; wrapped in `.catch(() => ({}))` to handle non-JSON error bodies gracefully
  - `deleteTodo` returns `void` — `throwIfNotOk` runs on the 204 response then function returns implicitly (no `res.json()` call on 204)
  - Hook tests use `QueryClient` with `retry: false` to prevent TanStack Query from retrying on error which would make error-path tests flaky
  - Used `vi.unstubAllGlobals()` (not `vi.restoreAllMocks()`) to cleanly reset the stubbed `fetch` between tests
- **Test results:** 10/10 passing, 0 regressions, `tsc --noEmit` exits 0

## Review Findings

**Reviewed by:** GitHub Copilot (Claude Sonnet 4.6) — 2026-04-10
**Review mode:** full

### Patches Applied

None.

### Dismissed (2)

- **D1** — `staleTime` not configured in `useTodos`; TanStack Query v5 default triggers refetch on window focus. Spec is silent on this; not a defect.
- **D2** — `deleteTodo` test mock includes a dead `json: async () => ({})` function (204 means `throwIfNotOk` never reads the body). Harmless.

### All ACs: ✅ Pass
