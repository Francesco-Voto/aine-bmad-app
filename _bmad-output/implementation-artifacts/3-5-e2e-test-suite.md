# Story 3.5: E2E Test Suite — All 7 User Journey Scenarios

Status: done

## Story

As a developer,
I want a Playwright E2E test suite covering all 7 defined user journey scenarios,
So that every core user interaction is verified end-to-end against the running full-stack application.

## Acceptance Criteria

1. **Given** the full-stack application is running (server on :3000, client on :5173 via Playwright `webServer`), **When** `npx playwright test` is run from the monorepo root, **Then** all 7 spec files execute and pass without manual intervention.

2. **Given** `e2e/fixtures/db.ts` seed/reset helpers, **When** each spec runs, **Then** the database is reset to a clean state before each test (via DELETE API calls) so tests are fully independent.

3. **Given** Journey 1 — `add-todo.spec.ts`, **When** the user types a task and presses Enter, **Then** the task appears in the list immediately; the input clears; the task persists after page reload.

4. **Given** Journey 1 — `empty-state.spec.ts`, **When** the app loads with no todos in the DB, **Then** the empty state message `"No tasks yet. Add one above."` is visible.

5. **Given** Journey 2 — `complete-todo.spec.ts`, **When** the user clicks the checkbox on a todo, **Then** the item becomes visually struck through and the `completed` state is persisted after reload.

6. **Given** Journey 2 — `delete-todo.spec.ts`, **When** the user hovers a todo and clicks the delete button, **Then** the item is removed from the list and absent after reload.

7. **Given** Journey 2 — `persistence.spec.ts`, **When** the page is reloaded after adding todos, **Then** all previously added todos are still present with the same text and completion state.

8. **Given** Journey 3 — `mobile-layout.spec.ts`, **When** the viewport is set to 375×812, **Then** the layout renders without horizontal scroll; the input and list are fully visible; no elements overflow.

9. **Given** Journey 4 — `error-state.spec.ts`, **When** `GET /api/todos` is intercepted to return 503, **Then** the list error state and Retry button are visible; after clearing the interception and clicking Retry, the list loads normally.

---

## Tasks / Subtasks

- [ ] Task 1: Create `e2e/fixtures/db.ts` — DB reset helper (AC: 2)
  - [ ] Create `e2e/fixtures/db.ts`:
    ```ts
    const API = 'http://localhost:3000';

    export async function resetDb(): Promise<void> {
      const res = await fetch(`${API}/api/todos`);
      const todos: { id: number }[] = await res.json();
      await Promise.all(
        todos.map((t) =>
          fetch(`${API}/api/todos/${t.id}`, { method: 'DELETE' })
        )
      );
    }

    export async function seedTodo(text: string): Promise<{ id: number; text: string; completed: boolean; createdAt: string }> {
      const res = await fetch(`${API}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      return res.json();
    }
    ```
  - [ ] The reset calls the real server on `:3000` directly (not through the Vite proxy on `:5173`) to avoid any proxy overhead; both dev servers must be running during tests

- [ ] Task 2: Update `playwright.config.ts` to also start the server (AC: 1)
  - [ ] The current config only starts the client via `webServer`. Add the server start as a second `webServer` entry so both start automatically:
    ```ts
    webServer: [
      {
        command: 'npm run dev --workspace=server',
        url: 'http://localhost:3000/health',
        reuseExistingServer: !process.env.CI,
      },
      {
        command: 'npm run dev --workspace=client',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
      },
    ],
    ```
  - [ ] `webServer` accepts an array — Playwright starts both in order and waits for each URL to become available
  - [ ] The `reuseExistingServer: !process.env.CI` setting reuses already-running dev servers locally (fast DX) and always starts fresh in CI

- [ ] Task 3: `add-todo.spec.ts` — Journey 1: add + view (AC: 3)
  - [ ] Create `e2e/tests/add-todo.spec.ts`:
    ```ts
    import { test, expect } from '@playwright/test';
    import { resetDb } from '../fixtures/db';

    test.beforeEach(async () => { await resetDb(); });

    test('adds a todo and sees it in the list', async ({ page }) => {
      await page.goto('/');
      await page.getByPlaceholder('Add a task…').fill('Buy milk');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Buy milk')).toBeVisible();
      await expect(page.getByPlaceholder('Add a task…')).toHaveValue('');
    });

    test('added todo persists after reload', async ({ page }) => {
      await page.goto('/');
      await page.getByPlaceholder('Add a task…').fill('Persistent task');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Persistent task')).toBeVisible();
      await page.reload();
      await expect(page.getByText('Persistent task')).toBeVisible();
    });
    ```

- [ ] Task 4: `empty-state.spec.ts` — Journey 1: empty state (AC: 4)
  - [ ] Create `e2e/tests/empty-state.spec.ts`:
    ```ts
    import { test, expect } from '@playwright/test';
    import { resetDb } from '../fixtures/db';

    test.beforeEach(async () => { await resetDb(); });

    test('shows empty state when no todos exist', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText('No tasks yet. Add one above.')).toBeVisible();
    });
    ```

- [ ] Task 5: `complete-todo.spec.ts` — Journey 2: toggle (AC: 5)
  - [ ] Create `e2e/tests/complete-todo.spec.ts`:
    ```ts
    import { test, expect } from '@playwright/test';
    import { resetDb, seedTodo } from '../fixtures/db';

    test.beforeEach(async () => {
      await resetDb();
      await seedTodo('Call the dentist');
    });

    test('toggles a todo complete and sees strikethrough', async ({ page }) => {
      await page.goto('/');
      const checkbox = page.getByRole('checkbox', { name: /Complete: Call the dentist/i });
      await checkbox.click();
      const taskText = page.getByText('Call the dentist');
      await expect(taskText).toHaveCSS('text-decoration-line', 'line-through');
    });

    test('completed state persists after reload', async ({ page }) => {
      await page.goto('/');
      const checkbox = page.getByRole('checkbox', { name: /Complete: Call the dentist/i });
      await checkbox.click();
      await page.reload();
      // After reload the checkbox should still be checked
      await expect(page.getByRole('checkbox', { name: /Complete: Call the dentist/i })).toBeChecked();
    });
    ```

- [ ] Task 6: `delete-todo.spec.ts` — Journey 2: delete (AC: 6)
  - [ ] Create `e2e/tests/delete-todo.spec.ts`:
    ```ts
    import { test, expect } from '@playwright/test';
    import { resetDb, seedTodo } from '../fixtures/db';

    test.beforeEach(async () => {
      await resetDb();
      await seedTodo('Task to delete');
    });

    test('deletes a todo by hovering and clicking delete', async ({ page }) => {
      await page.goto('/');
      const card = page.getByText('Task to delete').locator('..');
      await card.hover();
      await page.getByRole('button', { name: /Delete: Task to delete/i }).click();
      await expect(page.getByText('Task to delete')).not.toBeVisible();
    });

    test('deleted todo is absent after reload', async ({ page }) => {
      await page.goto('/');
      const card = page.getByText('Task to delete').locator('..');
      await card.hover();
      await page.getByRole('button', { name: /Delete: Task to delete/i }).click();
      await expect(page.getByText('Task to delete')).not.toBeVisible();
      await page.reload();
      await expect(page.getByText('Task to delete')).not.toBeVisible();
    });
    ```

- [ ] Task 7: `persistence.spec.ts` — Journey 2: reload (AC: 7)
  - [ ] Create `e2e/tests/persistence.spec.ts`:
    ```ts
    import { test, expect } from '@playwright/test';
    import { resetDb } from '../fixtures/db';

    test.beforeEach(async () => { await resetDb(); });

    test('todos persist across page reloads', async ({ page }) => {
      await page.goto('/');
      await page.getByPlaceholder('Add a task…').fill('Alpha task');
      await page.keyboard.press('Enter');
      await page.getByPlaceholder('Add a task…').fill('Beta task');
      await page.keyboard.press('Enter');

      await expect(page.getByText('Alpha task')).toBeVisible();
      await expect(page.getByText('Beta task')).toBeVisible();

      await page.reload();

      await expect(page.getByText('Alpha task')).toBeVisible();
      await expect(page.getByText('Beta task')).toBeVisible();
    });
    ```

- [ ] Task 8: `mobile-layout.spec.ts` — Journey 3: 375×812 viewport (AC: 8)
  - [ ] Create `e2e/tests/mobile-layout.spec.ts`:
    ```ts
    import { test, expect } from '@playwright/test';
    import { resetDb, seedTodo } from '../fixtures/db';

    test.beforeEach(async () => {
      await resetDb();
      await seedTodo('Mobile task');
    });

    test('renders without horizontal scroll at 375x812', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');

      // No horizontal scrollbar: scrollWidth should not exceed clientWidth
      const hasHScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHScroll).toBe(false);
    });

    test('input and list are visible at mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await expect(page.getByPlaceholder('Add a task…')).toBeVisible();
      await expect(page.getByText('Mobile task')).toBeVisible();
    });
    ```

- [ ] Task 9: `error-state.spec.ts` — Journey 4: intercepted 503 (AC: 9)
  - [ ] Create `e2e/tests/error-state.spec.ts`:
    ```ts
    import { test, expect } from '@playwright/test';
    import { resetDb, seedTodo } from '../fixtures/db';

    test.beforeEach(async () => {
      await resetDb();
      await seedTodo('Should not appear');
    });

    test('shows list error state when GET /api/todos returns 503', async ({ page }) => {
      // Intercept the proxied API call at the Vite dev server level
      await page.route('**/api/todos', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({ status: 503, body: JSON.stringify({ message: 'Service unavailable' }) });
        } else {
          route.continue();
        }
      });

      await page.goto('/');

      await expect(page.getByRole('alert')).toBeVisible();
      expect(await page.getByRole('alert').textContent()).toContain("Couldn't load your tasks");
      await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    });

    test('recovers after clicking Retry when connection is restored', async ({ page }) => {
      let block = true;
      await page.route('**/api/todos', (route) => {
        if (route.request().method() === 'GET' && block) {
          route.fulfill({ status: 503, body: JSON.stringify({ message: 'Service unavailable' }) });
        } else {
          route.continue();
        }
      });

      await page.goto('/');
      await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();

      // Restore the connection, then click Retry
      block = false;
      await page.getByRole('button', { name: 'Retry' }).click();

      await expect(page.getByText('Should not appear')).toBeVisible();
      await expect(page.getByRole('alert')).not.toBeVisible();
    });
    ```
  - [ ] **Note:** `page.route('**/api/todos', ...)` intercepts at the browser level — it catches the request before it leaves the browser, regardless of whether it goes through the Vite proxy. The `**/` glob matches `http://localhost:5173/api/todos`.

---

## Dev Notes

### Infrastructure Already in Place

| Item | Status |
|---|---|
| `@playwright/test` installed | ✅ In root `devDependencies` (v1.59.1) |
| `playwright.config.ts` at monorepo root | ✅ Exists — needs `webServer` array update |
| `e2e/` directory | ✅ Exists (empty, has `.gitkeep`) |
| `npm run test:e2e` script | ✅ Defined in root `package.json` as `playwright test --pass-with-no-tests` |
| Server dev command | `npm run dev --workspace=server` |
| Client dev command | `npm run dev --workspace=client` |

### New Files to Create

```
e2e/
├── fixtures/
│   └── db.ts                  ← new
└── tests/
    ├── add-todo.spec.ts       ← new
    ├── empty-state.spec.ts    ← new
    ├── complete-todo.spec.ts  ← new
    ├── delete-todo.spec.ts    ← new
    ├── persistence.spec.ts    ← new
    ├── mobile-layout.spec.ts  ← new
    └── error-state.spec.ts    ← new
```

Modify:
- `playwright.config.ts` — change single `webServer` object to array of two

### `playwright.config.ts` — Exact Change

Current `webServer` (single object):
```ts
webServer: {
  command: 'npm run dev --workspace=client',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
},
```

Replace with array:
```ts
webServer: [
  {
    command: 'npm run dev --workspace=server',
    url: 'http://localhost:3000/health',
    reuseExistingServer: !process.env.CI,
  },
  {
    command: 'npm run dev --workspace=client',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
],
```

### Server `npm run dev` — Check Required

Before writing the story, confirm `server/package.json` has a `dev` script. The terminal context shows `npm run dev` was last run in `server/` with exit code 1 — verify if this is a missing script or a runtime error. If `dev` script is missing, the `webServer` config above won't work as written. The server dev command may be `npm run start` or `node --watch src/index.ts` — check `server/package.json` and adjust the `playwright.config.ts` command accordingly.

### DB Reset Strategy

The `resetDb()` helper uses the live API (`DELETE /api/todos/:id` for each todo) rather than direct SQLite file manipulation. This:
- Requires **no** additional packages
- Works without knowing the DB file path from the test environment
- Is safe for the in-memory or file-based SQLite the server uses

Each spec calls `await resetDb()` in `test.beforeEach`. Tests are isolated — order does not matter.

### Hover-Reveal Delete

The delete button uses CSS `opacity: 0` at rest (set in `globals.css` `.todo-card .delete-btn`). In `delete-todo.spec.ts`, the test hovers the parent card first to make the button visible before clicking. Playwright's `.hover()` triggers the CSS `:hover` state which transitions `opacity` to 1.

The `findBy` locator `.locator('..')` navigates to the parent element. This may need adjustment based on the actual DOM structure (the `<span>` text is inside the `<div class="todo-card">`). An alternative approach if locator fails:
```ts
await page.locator('.todo-card', { hasText: 'Task to delete' }).hover();
```

### Route Interception for Error Tests

`page.route('**/api/todos', ...)` intercepts at the browser network level — it works even through the Vite dev proxy. Use method filtering (`route.request().method() === 'GET'`) so POST/PATCH/DELETE mutations still reach the server. The `block` flag pattern in the recovery test controls whether interception is active.

### Spec File Placement

Playwright's `testDir: './e2e'` (set in `playwright.config.ts`) will pick up specs recursively including `e2e/tests/`. No config change needed for the subdirectory.

### TypeScript in `e2e/`

The existing `playwright.config.ts` is already TypeScript. The spec files and fixtures use TypeScript natively via Playwright's bundler — no `tsconfig.json` needed in `e2e/` unless the root `tsconfig.base.json` is too strict. If TS errors appear on `e2e/` files, add a minimal `e2e/tsconfig.json`:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": { "types": ["@playwright/test"] },
  "include": ["./**/*.ts"]
}
```

### References

- Story 3.5 ACs [Source: `_bmad-output/planning-artifacts/epics.md` lines 657–718]
- Architecture E2E structure [Source: `_bmad-output/planning-artifacts/architecture.md` lines 508–514, 698–700]
- `playwright.config.ts` [Source: `playwright.config.ts`]
- Root `package.json` scripts [Source: `package.json`]
- User journey definitions [Source: `_bmad-output/planning-artifacts/prd.md` lines 114–166]
- Error copy strings [Source: `_bmad-output/planning-artifacts/epics.md` UX-DR11]

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
