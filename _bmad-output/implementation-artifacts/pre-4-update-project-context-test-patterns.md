# Pre-Epic 4 Task: Update `project-context.md` with RTL Test Strategy Patterns

Status: done

## Story

As a dev agent working on Epic 4 stories,
I want `project-context.md` to document the two established RTL testing strategies,
So that I always reach for the correct pattern without re-deriving it from existing test files.

## Background

Two distinct RTL test strategies have been established and used consistently across Epics 2 and 3. These patterns determine which test setup to use depending on the component under test. Without explicit documentation in `project-context.md`, a dev agent working on a new Epic 4 component must infer the pattern from existing files — risking choosing the wrong one.

The two patterns:
1. **`vi.mock` hook strategy** — for components that only *read* from a custom hook (no mutations)
2. **`renderWithQuery` + mocked `fetch` strategy** — for components that *call* mutations or `useQueryClient()`

Additionally, Story 3.4 surfaced a related gotcha: adding `useQueryClient()` to a component silently breaks any test that uses bare `render()` instead of `renderWithQuery()`. This rule must also be documented.

## Acceptance Criteria

1. **Given** `project-context.md`, **When** a dev agent reads it, **Then** it finds a clear section explaining both RTL strategies with: when to use each, what to import, and a minimal code example for each.

2. **Given** the documentation, **When** the `useQueryClient()` gotcha is described, **Then** it explicitly states: any component that calls `useQueryClient()` requires tests to use `renderWithQuery`, not bare `render`.

3. **Given** the `onError` placement rule (Epic 3 lesson), **When** documented in `project-context.md`, **Then** it states: use `useMutation({ onError })` (not `mutate(vars, { onError })`) for state-setting in components, with the reason.

4. **Given** the existing `project-context.md` content (project description prose), **When** the new content is added, **Then** the existing prose is preserved — new content is appended as structured sections after the existing text.

---

## Tasks / Subtasks

- [ ] Task 1: Append the testing patterns section to `_bmad-output/project-context.md`
  - [ ] Append the following content to the end of the existing file (do NOT replace existing content):

```markdown

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
```

- [ ] Task 2: Verify the file
  - [ ] Read the updated `project-context.md` and confirm: existing prose is intact, new sections are appended cleanly with the `---` separator, all code blocks are properly fenced.

---

## Dev Notes

### File Location

`_bmad-output/project-context.md` — this file is at the root of the `_bmad-output/` directory, not inside `planning-artifacts/` or `implementation-artifacts/`.

### Do Not Rewrite Existing Content

The current file contains several paragraphs describing the project vision (todo app, CRUD operations, mobile-friendly, etc.). These paragraphs must be kept exactly as-is. New content is appended after the last existing paragraph.

### Why Document CSS Rules Here Too

Epic 4 stories involve new components (`PageShell` responsive layout changes) and CSS modifications. Including the styling rules in `project-context.md` prevents the dev agent from accidentally introducing Tailwind classes or hardcoded hex values.

### `renderWithQuery` Helper Location

The `renderWithQuery` helper is currently defined inline in individual test files (e.g., `TodoList.test.tsx`, `TodoItem.test.tsx`). Epic 4 may want to extract it to a shared `client/src/test-utils.ts`. That refactor is not in scope for this task — document it as-is (per-file helper) and note it in the pattern description.

### Files to Change

| File | Action |
|---|---|
| `_bmad-output/project-context.md` | Modify — append new sections; existing content untouched |

No code files, no test files, no package.json changes.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log
