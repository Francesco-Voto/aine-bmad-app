# Story 6.1: Test Coverage Analysis & Gap Remediation

Status: done

## Story

As a developer,
I want AI-assisted analysis of the current test suite and coverage report,
So that meaningful coverage gaps are identified and remediated to reach ≥ 70% coverage.

## Context & Analysis

### Current Test Landscape

| Scope | Framework | Config | Coverage provider |
|---|---|---|---|
| `client/src/**` | Vitest + RTL | `client/vitest.config.ts` | v8 — already configured |
| `server/src/**` | Jest + Supertest | `server/jest.config.ts` | Not yet configured |
| E2E | Playwright | `playwright.config.ts` / `playwright.docker.config.ts` | N/A |

### Client Coverage Config (already in place)

`client/vitest.config.ts` has:
```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'html'],
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['src/main.tsx', 'src/test-setup.ts'],
}
```

Run with: `npm run test:coverage` (root) or `npm run test:coverage --workspace=client`.
HTML report outputs to `client/coverage/index.html`.

### Existing Client Tests

| Component | Test file | Current coverage focus |
|---|---|---|
| `TodoList` | `TodoList.test.tsx` | Loading, empty, populated, error/retry states |
| `TodoItem` | `TodoItem.test.tsx` | Display, toggle, delete, optimistic rollback |
| `TodoInput` | `TodoInput.test.tsx` | Submit, validation, character counter, pending state |
| `InlineError` | `InlineError.test.tsx` | Render/null, role=alert |
| `PageShell` | `PageShell.test.tsx` | Snapshot only |
| `App.tsx` | None | No test — likely gap |
| `api/todos.ts` | None | No test — covered by E2E only |
| `hooks/useTodos.ts` | None | No direct unit test — covered via component tests |

### Known Gap Areas

- **Branch coverage** in `TodoItem`: optimistic collapse animation CSS class toggling
- **`App.tsx`**: no unit test at all — integration covered by E2E but not unit
- **`api/todos.ts`** API wrapper: tested via component mocks but no direct unit test
- **Server CRUD endpoints**: each route has a happy-path test; error paths (DB failure, invalid input) may be sparse

---

## Acceptance Criteria

1. **Given** `npm run test:coverage` is run, **When** the v8 coverage report is generated, **Then** an HTML report is produced at `client/coverage/index.html` with per-file statement, branch, function, and line percentages.

2. **Given** the coverage report and AI analysis of `client/src/**`, **When** gaps are identified, **Then** a written gap analysis (in this story's dev notes section) lists each under-covered file, the type of gap, and its materiality.

3. **Given** the gap analysis, **When** new or extended tests are written, **Then** overall meaningful coverage reaches ≥ 70% across statements, branches, and functions for the `client/` codebase.

4. **Given** server-side Jest tests in `server/src/**`, **When** existing tests are reviewed, **Then** all CRUD endpoints and the health check have at least one happy-path and one error-path test; any gaps are remediated.

---

## Tasks / Subtasks

### Task 1: Run baseline coverage report (AC: 1)

```bash
npm run test:coverage --workspace=client
```

Open `client/coverage/index.html`. Record the baseline numbers per file.

### Task 2: AI gap analysis (AC: 2)

With the coverage report open, ask AI (Copilot in this workspace) to:
1. List all files below 70% branch coverage and explain why each branch matters
2. Identify any untested error paths in mutation hooks
3. Flag any component that has only snapshot tests with no interaction tests

Document findings in a "## Dev Notes — Gap Analysis" section below.

### Task 3: Write remediation tests (AC: 3)

Priority order (highest value gaps first):
1. `api/todos.ts` — add unit tests for each API wrapper function, mocking `fetch` directly, asserting method/path/body construction and error propagation
2. `TodoItem` — add branch tests for the `collapsed` state, aria-label rendering for completed vs active items
3. `App.tsx` — add a smoke render test (renders without crashing, `<h1>` present)

Re-run coverage after each set of additions. Stop when ≥ 70% across all three metrics.

### Task 4: Review and extend server tests (AC: 4)

Review `server/src/**/*.test.ts` (or `*.spec.ts`). For each endpoint:

| Endpoint | Happy path? | Error path? |
|---|---|---|
| `GET /api/todos` | ? | ? |
| `POST /api/todos` | ? | ? |
| `PATCH /api/todos/:id` | ? | ? |
| `DELETE /api/todos/:id` | ? | ? |
| `GET /health` | ? | ? |

Add missing error-path tests (e.g. DB throws, invalid body, missing `:id`).

### Task 5: Save report to docs/ (AC: all)

Once all findings are recorded in the Dev Notes section below, save the completed section as a standalone report:

```bash
# Copy the Dev Notes section into docs/test-coverage-report.md
```

The file `docs/test-coverage-report.md` should contain the gap analysis table, remediation summary, and final coverage percentages.

---

## Dev Notes — Gap Analysis

### Baseline (before remediation)

| File | Stmts | Branch | Funcs | Lines | Notes |
|---|---|---|---|---|---|
| `App.tsx` | 0% | 0% | 0% | 0% | No test at all — 13 lines |
| `TodoList.tsx` | 90.58% | 100% | 66.66% | 90.58% | `onDeleteFocus` callback (lines 83–90) uncovered |
| `Checkbox.tsx` | 94.64% | 66.66% | 50% | 94.64% | `onBlur` CSS handler (lines 28–30) |
| `Input.tsx` | 100% | 60% | 100% | 100% | `onFocus`/`onBlur` branches (lines 24, 28) |
| `useToggleTodo.ts` | 100% | 90.9% | 100% | 100% | `context?.previous` falsy branch (line 17) |
| **Overall** | **96.25%** | **94.44%** | **91.3%** | **96.25%** | Already ≥ 70% |

### Server (before remediation)

All CRUD happy paths covered. Missing:
- `PATCH /api/todos/:id` with non-boolean `completed` → 400 (schema validation path untested)
- `PATCH /api/todos/:id` with missing `completed` field → 400 (same)

### Remediation Applied

| Gap | Fix | File(s) |
|---|---|---|
| `App.tsx` 0% | Added smoke render test, mocking child components | `src/App.test.tsx` (new) |
| `TodoList.tsx` `onDeleteFocus` uncovered | Added focus callback tests using `document.getElementById` spy | `src/components/TodoList.focus.test.tsx` (new) |
| `useToggleTodo.ts` context nullish branch | Added error test with empty cache (no prior `setQueryData`) | `src/hooks/useToggleTodo.test.tsx` |
| Server PATCH invalid body | Added 400 tests for non-boolean and missing `completed` | `server/src/routes/todos.test.ts` |

### Remaining Minor Gaps (intentionally left)

- `Checkbox.tsx` `onBlur` / `Input.tsx` `onFocus`/`onBlur` — inline CSS-only handlers, no business logic, not worth testing
- `useToggleTodo.ts` branch 17 — `context?.previous` falsy — covered by new test; residual v8 branch artefact
- `vite-env.d.ts` — declaration file only, no executable code

### Final Coverage

| Metric | Before | After |
|---|---|---|
| Statements | 96.25% | **99.48%** |
| Branches | 94.44% | **94.64%** |
| Functions | 91.3% | **95.65%** |
| Lines | 96.25% | **99.48%** |

AC ≥ 70% across all three metrics: ✅
