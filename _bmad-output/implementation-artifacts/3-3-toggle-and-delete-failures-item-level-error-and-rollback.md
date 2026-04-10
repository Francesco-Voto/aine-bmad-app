# Story 3.3: Toggle & Delete Failures — Item-Level Error & Rollback

Status: done

## Story

As a user,
I want a failed toggle or delete to revert and show a calm inline error on that item,
So that my list remains accurate and I know what happened.

## Acceptance Criteria

1. **Given** the toggle mutation fails, **When** `onError` fires on `TodoItem`, **Then** the item reverts to its previous `completed` state; `InlineError` with `"Couldn't update — try again."` appears below that specific item.

2. **Given** the delete mutation fails, **When** `onError` fires on `TodoItem`, **Then** the deleted item reappears in its original list position; `InlineError` with `"Couldn't delete — try again."` appears below that specific item.

3. **Given** a failure occurs on one item, **When** the rest of the list is inspected, **Then** all other items are entirely unaffected — no global error state.

4. **Given** the user retries successfully, **When** the next action on that item succeeds, **Then** its `InlineError` clears automatically.

5. **Given** RTL tests, **When** mutations are mocked to fail, **Then** toggle reverts state and shows correct error; delete restores item and shows correct error; sibling items unaffected; error clears on subsequent success.

---

## Tasks / Subtasks

- [x] Task 1: Add `InlineError` to `TodoItem.tsx` (AC: 1, 2, 3, 4)
  - [x] Import `InlineError` from `./InlineError`
  - [x] Use `toggleMutation.isError` and `deleteMutation.isError` from destructured `useMutation` return values
  - [x] Wrap the existing card `<div>` and `<InlineError>` in an outer `<div>` wrapper:
    - Move `marginBottom: 6` to the outer wrapper (remove it from the inner card)
    - The outer wrapper has no other styles
  - [x] Determine error message: `toggleMutation.isError ? "Couldn't update — try again." : deleteMutation.isError ? "Couldn't delete — try again." : undefined`
  - [x] Render `<InlineError message={...} variant="item" />` below the card div inside the wrapper
  - [x] `isError` auto-clears when `mutate()` is called again (transitions to `isPending`) — no manual reset needed

- [x] Task 2: Write RTL tests for toggle and delete failures (AC: 5)
  - [x] Add tests to `client/src/components/TodoItem.test.tsx`
  - [x] Test 1 — toggle failure shows "Couldn't update" InlineError:
    - seed cache with `[activeTodo]`
    - mock PATCH to `mockRejectedValueOnce(new Error('fail'))`
    - click checkbox → `await screen.findByRole('alert')` → assert text contains "Couldn't update"
  - [x] Test 2 — delete failure shows "Couldn't delete" InlineError:
    - seed cache with `[activeTodo]`
    - mock DELETE to `mockRejectedValueOnce(new Error('fail'))`
    - click delete button → `await screen.findByRole('alert')` → assert text contains "Couldn't delete"
  - [x] Test 3 — toggle error clears on successful retry:
    - fail once, then succeed; assert `queryByRole('alert')` is null after retry

---

## Dev Notes

### Files to Change

| File | Action |
|---|---|
| `client/src/components/TodoItem.tsx` | Modify — add outer wrapper div, `InlineError` import and render, destructure `isError` from both mutations |
| `client/src/components/TodoItem.test.tsx` | Modify — add 3 new failure tests |
| `client/src/components/InlineError.tsx` | No change |

### `isError` from `useMutation`

TanStack Query's `useMutation` exposes `isError` which is `true` after a failed mutation and automatically resets to `false` when `mutate()` is called again (transitions via `isPending`). This pattern was established in Story 3.2 for `TodoInput`.

Destructure from each mutation:
```ts
const { mutate: toggleMutate, isError: toggleIsError } = useMutation({ ... });
const { mutate: deleteMutate, isError: deleteIsError } = useMutation({ ... });
```

### Wrapper Div for InlineError

The current `TodoItem` root is a single `.todo-card` div with `marginBottom: 6`. Since `InlineError` must render below the card (not inside its flex row), wrap both in an outer `<div>`:

```tsx
<div style={{ marginBottom: 6 }}>
  <div className="todo-card" style={{ /* existing styles WITHOUT marginBottom */ }}>
    {/* ... existing content ... */}
  </div>
  <InlineError
    message={toggleIsError ? "Couldn't update — try again." : deleteIsError ? "Couldn't delete — try again." : undefined}
    variant="item"
  />
</div>
```

`InlineError` has its own `marginTop: var(--space-1)` built into the component — no extra spacing needed.

### Rollback Already Implemented

Both `onError` handlers in `TodoItem.tsx` already perform optimistic rollback:
- `toggleMutation.onError`: restores `context.previous` to query cache
- `deleteMutation.onError`: calls `setCollapsed(false)` + restores `context.previous`

No changes needed to `onError` logic — only add `setCreateError` equivalent (which is just reading `isError`).

### Error Copy (exact strings)

- Toggle: `"Couldn't update — try again."` (em dash U+2014)
- Delete: `"Couldn't delete — try again."` (em dash U+2014)

### Established Project Patterns

- `import * as React from 'react'` namespace import
- Named exports: `export { TodoItem }`
- Inline `style` prop only — no Tailwind class strings

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Created story file from epics.md requirements (was backlog — no file existed)
- `TodoItem.tsx`: destructured `isError` from both mutations (`toggleIsError`, `deleteIsError`); renamed `mutate` calls accordingly
- Outer `<div style={{ marginBottom: 6 }}>` wraps card + `<InlineError>`; `marginBottom` removed from inner card
- `InlineError` uses ternary: `toggleIsError` → "Couldn't update — try again." / `deleteIsError` → "Couldn't delete — try again." / undefined
- `isError` auto-clears on retry (transitions to `isPending`) — AC 4 satisfied with no manual reset
- 37/37 tests pass; typecheck clean

### File List

- client/src/components/TodoItem.tsx (modified)
- client/src/components/TodoItem.test.tsx (modified)

### Change Log

- 2026-04-10: Story 3.3 — Item-level InlineError for toggle/delete failures; 3 new RTL tests
