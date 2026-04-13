# Pre-Epic 4 Task: Fix `<form>` ARIA Label

Status: done

## Story

As a screen reader user,
I want the add-task form announced with the correct label,
So that voice navigation and assistive technology match the accessibility specification.

## Background

`TodoInput.tsx` currently has `aria-label="Add task form"` on the `<form>` element. The epics.md specification (Story 4.3 AC) requires `aria-label="Add a task"`. This discrepancy was first identified in Epic 2 and deferred twice. Story 4.3 (Full ARIA Implementation & Accessibility Audit) explicitly validates this label — if it remains wrong, the Lighthouse accessibility audit will flag it.

This is a one-line change to `TodoInput.tsx` plus a corresponding update to the test file.

## Acceptance Criteria

1. **Given** `TodoInput` renders, **When** the form element's `aria-label` is inspected, **Then** it is exactly `"Add a task"` — not `"Add task form"`.

2. **Given** `TodoInput.test.tsx` runs, **When** any test queries the form by role, **Then** it uses `"Add a task"` as the label and all tests pass (`vitest run` exit 0).

3. **Given** the component renders, **When** the rest of `TodoInput`'s markup is inspected, **Then** no other attributes or styles are changed — only the `aria-label` string is different.

---

## Tasks / Subtasks

- [ ] Task 1: Update `aria-label` in `client/src/components/TodoInput.tsx`
  - [ ] Find the `<form>` element — currently at approximately line 39:
    ```tsx
    aria-label="Add task form"
    ```
  - [ ] Change it to:
    ```tsx
    aria-label="Add a task"
    ```
  - [ ] No other changes to this file

- [ ] Task 2: Update `client/src/components/TodoInput.test.tsx` if any test asserts the form label
  - [ ] Search the test file for `"Add task form"` — if found, replace with `"Add a task"`
  - [ ] The existing tests use `getByPlaceholderText('Add a task…')` and `getByRole('button', { name: 'Add' })` — these are unaffected
  - [ ] If no test queries the form by aria-label, no test change is needed. Run `npm run test --workspace=client` to confirm all tests still pass.

- [ ] Task 3: Verify
  - [ ] Run `npm run test --workspace=client` — all tests pass
  - [ ] Run `npm run typecheck --workspace=client` — no type errors

---

## Dev Notes

### Exact Location

`client/src/components/TodoInput.tsx`, line ~39, inside the `<form>` JSX opening tag:

```tsx
<form
  aria-label="Add task form"   ← change this string only
  className="input-container"
  onSubmit={handleSubmit}
  ...
>
```

Change to:
```tsx
<form
  aria-label="Add a task"
  className="input-container"
  onSubmit={handleSubmit}
  ...
>
```

### Why This Matters for Epic 4

Story 4.3 AC specifies:
> Given the add form, When ARIA attributes are inspected, Then `role="form"` and `aria-label="Add a task"` are present.

Additionally, `aria-label="Add a task"` matches the input placeholder `"Add a task…"` — the form is named by what it does, not by its type ("form" is redundant when the element already has `role="form"` or is a `<form>` element).

### No Snapshot or E2E Test Changes

- RTL tests do not query the form by its `aria-label` — they use placeholder text and button labels
- E2E specs in `e2e/tests/` access the input via `page.getByPlaceholder('Add a task…')` — unaffected
- No snapshot tests exist in this project

### Files to Change

| File | Action |
|---|---|
| `client/src/components/TodoInput.tsx` | Modify — change `aria-label` string on `<form>` |
| `client/src/components/TodoInput.test.tsx` | Check for `"Add task form"` — update if present |

No other files.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log
