# Test Automation Summary

## Generated Tests

### Infrastructure

- [x] `playwright.config.ts` — Updated `webServer` to array (server + client); `workers: 1` for shared-SQLite serial execution
- [x] `e2e/fixtures/db.ts` — `resetDb()` and `seedTodo()` helpers using live API

### E2E Tests

- [x] `e2e/tests/add-todo.spec.ts` — Add task via Enter; verify list appearance; verify persistence after reload
- [x] `e2e/tests/empty-state.spec.ts` — Empty state message when DB is clean
- [x] `e2e/tests/complete-todo.spec.ts` — Toggle checkbox; strikethrough CSS; completed state persists after reload
- [x] `e2e/tests/delete-todo.spec.ts` — Hover to reveal delete button; click to remove; absent after reload
- [x] `e2e/tests/persistence.spec.ts` — Multiple todos persist across page reload
- [x] `e2e/tests/mobile-layout.spec.ts` — 375×812 viewport; no horizontal scroll; input + list visible
- [x] `e2e/tests/error-state.spec.ts` — GET /api/todos intercepted to 503; error alert + Retry shown; recovery after Retry click

## Results

**12 / 12 tests passed** (28s, 1 worker, Chromium)

## Fixes Applied During Implementation

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Strict mode violation (2 checkboxes) | `fullyParallel: true` with shared SQLite caused race: 2 parallel `beforeEach` seeded the same todo name | Set `workers: 1` in `playwright.config.ts` |
| Error state not appearing (timeout) | TanStack Query retries 3× with backoff (~7s) before showing error | Added `test.setTimeout(30000)` + `{ timeout: 20000 }` on alert/retry assertions |
| Beta task not found after sequential add | React's `onSuccess` clears input asynchronously, racing with Playwright's `.fill()` | Wait for Alpha task to be visible before filling Beta task |

## Coverage

- UI features covered: add, empty state, complete, delete, persistence, mobile layout, error state + retry
- API coverage: via UI interactions (POST, PATCH, DELETE) + direct DB seeding helpers
- Journey coverage: Journeys 1–4 from the PRD (AC 1–9 of Story 3.5 all satisfied)

## Next Steps

- Run in CI: `npm run test:e2e` (workers already set to 1)
- Add more edge cases as needed (e.g. 500-character input limit, rapid successive adds)
