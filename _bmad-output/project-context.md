The goal of this project is to design and build a simple full-stack Todo application that allows individual users to manage personal tasks in a clear, reliable, and intuitive way. The application should focus on clarity and ease of use, avoiding unnecessary features or complexity, while providing a solid technical foundation that can be extended in the future if needed.
From a user perspective, the application should allow the creation, visualization, completion, and deletion of todo items. Each todo represents a single task and should include a short textual description, a completion status, and basic metadata such as creation time. Users should be able to immediately see their list of todos upon opening the application and interact with it without any onboarding or explanation.
The frontend experience should be fast and responsive, with updates reflected instantly when the user performs an action such as adding or completing a task. Completed tasks should be visually distinguishable from active ones to clearly communicate status at a glance. The interface should work well across desktop and mobile devices and include sensible empty, loading, and error states to maintain a polished user experience.
The backend will expose a small, well-defined API responsible for persisting and retrieving todo data. This API should support basic CRUD operations and ensure data consistency and durability across user sessions. While authentication and multi-user support are not required for the initial version, the architecture should not prevent these features from being added later if the product evolves.
From a non-functional standpoint, the system should prioritize simplicity, performance, and maintainability. Interactions should feel instantaneous under normal conditions, and the overall solution should be easy to understand, deploy, and extend by future developers. Basic error handling is expected both client-side and server-side to gracefully handle failures without disrupting the user flow.
The first version of the application intentionally excludes advanced features such as user accounts, collaboration, task prioritization, deadlines, or notifications. These capabilities may be considered in future iterations, but the initial delivery should remain focused on delivering a clean and reliable core experience.
Success for this project will be measured by the ability of a user to complete all core task-management actions without guidance, the stability of the application across refreshes and sessions, and the clarity of the overall user experience. The final result should feel like a complete, usable product despite its deliberately minimal scope.

---

## Project Conventions & Dev Agent Rules

### RTL Testing Strategy — Two Established Patterns

Every client component test uses exactly one of these two strategies. Choose based on the component's relationship to server state.

#### Pattern 1: `vi.mock` Hook Strategy

**When to use:** Component only *reads* from a custom hook (`useTodos`, etc.) — no mutations, no `useQueryClient()`.

**Setup:**
```ts
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as useTodosModule from '../hooks/useTodos';

const mockUseTodos = vi.spyOn(useTodosModule, 'useTodos');

// In each test:
mockUseTodos.mockReturnValue({ isLoading: false, data: [...], isError: false });
render(<ComponentUnderTest />);
```

**Examples:** `TodoList.test.tsx`

**Do NOT use `renderWithQuery`** — not needed because the hook is fully mocked.

---

#### Pattern 2: `renderWithQuery` + Mocked `fetch` Strategy

**When to use:** Component calls a mutation (`useMutation`), OR calls `useQueryClient()`.

**Setup:**
```ts
import { renderWithQuery } from '../test-utils'; // or wherever the helper lives
import { vi } from 'vitest';

// In each test:
vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, ... }));
renderWithQuery(<ComponentUnderTest />);
```

**Examples:** `TodoItem.test.tsx`, `TodoInput.test.tsx`, `TodoList.test.tsx` (error/retry tests added in Story 3.4)

**CRITICAL:** If a component is refactored to add `useQueryClient()`, ALL existing tests for that component must be updated from bare `render(...)` to `renderWithQuery(...)`. Failing to do so causes a silent "No QueryClient set" error.

---

### `onError` Placement Rule

When using TanStack Query `useMutation`, there are two places to provide an `onError` callback:
- `useMutation({ onError })` — fires for every failure, safe after component unmount ✅
- `mutate(vars, { onError })` — fires only for this call; NOT safe after unmount ⚠️

**Rule:** Always use `useMutation({ onError })` for any callback that sets component state (`setState`, `setError`, etc.). Never use `mutate(vars, { onError })` for state-setting.

**References:** `TodoItem.tsx` (toggle/delete onError), `TodoInput.tsx` (create onError)

---

### CSS / Styling Rules

- **No Tailwind class strings in components.** Use inline `style` prop with CSS custom properties: `style={{ color: 'var(--color-error)' }}`.
- **No hardcoded hex values.** All colors come from tokens defined in `client/src/globals.css` `:root`.
- **Named exports only.** `export { ComponentName }` — no default exports.
- **`import * as React from 'react'`** — namespace import in all files.
