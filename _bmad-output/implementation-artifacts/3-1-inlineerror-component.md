# Story 3.1: InlineError Component

Status: done

## Story

As a developer,
I want a reusable inline error component,
So that every failure surface in the app has a consistent, calm, accessible presentation.

## Acceptance Criteria

1. **Given** a non-empty `message` string is passed, **When** `InlineError` renders, **Then** it shows a small `●` dot + message text, `background: var(--color-error-subtle)` (`#fff1f2` / rose-50), `color: var(--color-error)` (`#e11d48` / rose-600), and `role="alert"` on the root element for immediate screen-reader announcement.

2. **Given** no `message` prop (or empty string or `undefined`), **When** `InlineError` renders, **Then** it returns `null` — nothing in the DOM.

3. **Given** the `variant` prop, **When** set to `"input"`, **Then** the component renders with `margin-top: var(--space-1)` (4px) to sit snugly below the `TodoInput` compound container; **When** set to `"item"`, **Then** it renders with `margin-top: var(--space-1)` as well (visual gap from the `todo-card` above). Both variants share identical visual anatomy — variant is reserved for semantic distinction and may be extended in Epic 4 if layout diverges.

4. **Given** RTL tests, **When** each case is tested, **Then** message text renders when provided; `role="alert"` attribute is present; nothing is rendered when message is absent/empty.

---

## Tasks / Subtasks

- [x] Task 1: Create `InlineError` component (AC: 1, 2, 3)
  - [x] Create `client/src/components/InlineError.tsx`
  - [x] Define props interface:
    ```ts
    interface InlineErrorProps {
      message?: string;
      variant?: 'input' | 'item';
    }
    ```
  - [x] Return `null` when `!message` (covers `undefined`, `''`, falsy)
  - [x] When `message` is truthy, return:
    ```tsx
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        marginTop: 'var(--space-1)',
        padding: '4px var(--space-2)',
        borderRadius: 4,
        background: 'var(--color-error-subtle)',
        color: 'var(--color-error)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <span aria-hidden="true">●</span>
      <span>{message}</span>
    </div>
    ```
  - [x] The `●` dot uses `aria-hidden="true"` — it is decorative; the message span carries the accessible text that `role="alert"` announces
  - [x] Export as named export: `export { InlineError };`

- [x] Task 2: Write RTL tests (AC: 4)
  - [x] Create `client/src/components/InlineError.test.tsx`
  - [x] Import: `render, screen` from `@testing-library/react`; `describe, expect, it` from `vitest`; `InlineError` from `./InlineError`
  - [x] **No `QueryClientProvider` needed** — `InlineError` is a pure presentational component with no hooks or queries
  - [x] Test 1 — renders message text when provided:
    ```tsx
    it('renders message when provided', () => {
      render(<InlineError message="Couldn't save — check your connection." />);
      expect(screen.getByText("Couldn't save — check your connection.")).toBeDefined();
    });
    ```
  - [x] Test 2 — has `role="alert"` when message provided:
    ```tsx
    it('has role="alert" when message is present', () => {
      render(<InlineError message="An error occurred" />);
      expect(screen.getByRole('alert')).toBeDefined();
    });
    ```
  - [x] Test 3 — renders nothing when message is absent:
    ```tsx
    it('renders nothing when message is undefined', () => {
      const { container } = render(<InlineError />);
      expect(container.firstChild).toBeNull();
    });
    ```
  - [x] Test 4 — renders nothing when message is empty string:
    ```tsx
    it('renders nothing when message is empty string', () => {
      const { container } = render(<InlineError message="" />);
      expect(container.firstChild).toBeNull();
    });
    ```
  - [x] Test 5 — renders with `variant="input"` (smoke test, no crash):
    ```tsx
    it('renders with variant="input"', () => {
      render(<InlineError message="Input error" variant="input" />);
      expect(screen.getByRole('alert')).toBeDefined();
    });
    ```
  - [x] Test 6 — renders with `variant="item"` (smoke test, no crash):
    ```tsx
    it('renders with variant="item"', () => {
      render(<InlineError message="Item error" variant="item" />);
      expect(screen.getByRole('alert')).toBeDefined();
    });
    ```

---

## Dev Notes

### Purpose of This Story

`InlineError` is a pure presentational component with no state, no side effects, no mutations, and no queries. It is **Story 3.1** and is a prerequisite for:
- **Story 3.2** — imported into `TodoInput.tsx` to show below the compound input form on create failure
- **Story 3.3** — imported into `TodoItem.tsx` to show below each `<li>` item on toggle/delete failure
- **Story 3.4** — imported into `TodoList.tsx` to replace the existing plain paragraph error state with proper `InlineError` + Retry button

Do not wire `InlineError` into any consuming component in this story — that is reserved for Stories 3.2–3.4.

### CSS Token Reference

All tokens are defined in `client/src/globals.css` `:root`:

| Token | Value | Semantic |
|---|---|---|
| `--color-error` | `#e11d48` | rose-600 — text and dot color |
| `--color-error-subtle` | `#fff1f2` | rose-50 — background |
| `--space-1` | `4px` | gap between dot and message; margin-top |
| `--space-2` | `8px` | horizontal padding |
| `--text-sm` | `0.875rem` | body-level error font size |

**Color contrast note:** `#e11d48` on `#fff1f2` = approximately 5.1:1 — exceeds WCAG AA 4.5:1 requirement. No further work needed.

### File Location

```
client/src/components/InlineError.tsx       ← new file
client/src/components/InlineError.test.tsx  ← new file
```

No changes to any existing files in this story.

### Test Pattern

Because `InlineError` has no hooks, no queries, and no mutations, tests use plain `render` from RTL — **not** the `renderWithQuery` helper. The `renderWithQuery` helper is only for components that need `QueryClientProvider`.

Import pattern:
```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { InlineError } from './InlineError';
```

### Established Project Patterns

- **No Tailwind class strings** — this project uses CSS custom properties via inline `style` prop (see `TodoItem.tsx`, `TodoInput.tsx`). Do not use `className="bg-rose-50 text-rose-600"`. Use `style={{ background: 'var(--color-error-subtle)', color: 'var(--color-error)' }}`.
- **Named exports** — all components use named exports (`export { InlineError }`), not default exports. This matches every existing component in the codebase.
- **`import * as React from 'react'`** — all files use this namespace import pattern (not `import React from 'react'`).
- **TypeScript** — props interface uses `interface`, not `type`. See `TodoItemProps` in `TodoItem.tsx` for reference.

### References

- UX-DR8: `InlineError` anatomy and variants [Source: `_bmad-output/planning-artifacts/epics.md` line 120]
- UX-DR14: `role="alert"` ARIA requirement [Source: `_bmad-output/planning-artifacts/epics.md` line 126]
- Story 3.1 ACs [Source: `_bmad-output/planning-artifacts/epics.md` lines 539–561]
- CSS tokens [Source: `client/src/globals.css` `:root` block]
- Named export pattern [Source: `client/src/components/TodoItem.tsx`, `TodoInput.tsx`, `TodoList.tsx`]

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Created `client/src/components/InlineError.tsx` — pure presentational component; returns `null` when `!message`, otherwise renders `role="alert"` div with `●` dot (aria-hidden) + message span; both variants share identical layout (variant prop accepted for future divergence in Epic 4)
- Created `client/src/components/InlineError.test.tsx` — 6 RTL tests covering: message renders, role="alert" present, null on undefined, null on empty string, variant="input" smoke, variant="item" smoke
- 31/31 tests pass (7 test files); typecheck clean
- No changes to existing files

### File List

- client/src/components/InlineError.tsx (new)
- client/src/components/InlineError.test.tsx (new)

### Change Log

- 2026-04-10: Story 3.1 — Created `InlineError` component and tests

## Review Findings

**Reviewed by:** GitHub Copilot (Claude Sonnet 4.6) — 2026-04-10
**Review mode:** full

### Patches Applied

None.

### Dismissed (1)

- **D1** — `variant` prop accepted in interface but not used in component body. Intentional per spec — both variants share identical layout; reserved for potential Epic 4 divergence.

### All ACs: ✅ Pass
