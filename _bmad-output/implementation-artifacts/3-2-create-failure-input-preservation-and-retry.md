# Story 3.2: Create Failure — Input Preservation & Retry

Status: done

## Story

As a user,
I want my text restored and a clear error shown when saving a new task fails,
So that I can retry without retyping or losing anything.

## Acceptance Criteria

1. **Given** the create mutation fails (network loss or API error), **When** `onError` fires, **Then** the optimistically inserted item is removed from the list; `InlineError` with `"Couldn't save — check your connection."` appears below `TodoInput`; original typed text remains in the input field.

2. **Given** the error state is shown, **When** the input field is inspected, **Then** it is focused and contains the user's original text — ready for retry.

3. **Given** the user resubmits successfully, **When** the mutation succeeds, **Then** `InlineError` auto-clears; task appears in list normally.

4. **Given** the user submits while a previous error is showing, **When** the new mutation fires, **Then** the existing error is cleared immediately (no stacking of error messages).

5. **Given** RTL tests, **When** the mutation is mocked to fail, **Then** `InlineError` renders with correct copy; input value is preserved after failure; input is focused; error clears on successful retry.

---

## Tasks / Subtasks

- [x] Task 1: Add error state and `InlineError` rendering to `TodoInput.tsx` (AC: 1, 2, 3, 4)
  - [x] Import `InlineError` from `./InlineError`
  - [x] Add error state: `const [createError, setCreateError] = React.useState<string | null>(null)`
  - [x] In `handleSubmit`, clear the error at the top before calling `mutate`, so a new attempt always starts clean:
    ```ts
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed) {
        setShaking(true);
        return;
      }
      setCreateError(null); // clear any previous error before retry
      mutate(trimmed, {
        onSuccess: () => {
          setText('');
          inputRef.current?.focus();
        },
      });
    };
    ```
  - [x] In the `useMutation` `onError` handler, set the error message **and** focus the input:
    ```ts
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['todos'], context.previous);
      }
      setCreateError("Couldn't save — check your connection.");
      inputRef.current?.focus();
    },
    ```
  - [x] In the `useMutation` `onSettled` (already present) no changes needed — it just invalidates
  - [x] Render `<InlineError>` **below** the `<form>` element (not inside it), wrapping both in a container `<div>`:
    ```tsx
    return (
      <div>
        <form
          aria-label="Add task form"
          className="input-container"
          onSubmit={handleSubmit}
          style={{ ... }}
        >
          {/* existing Input, counter, Button unchanged */}
        </form>
        <InlineError message={createError ?? undefined} variant="input" />
      </div>
    );
    ```
  - [x] **Text preservation:** `setText('')` is **only** called in `onSuccess`. On failure, `onSuccess` never fires, so the user's typed text is still in `text` state — no explicit restoration code is needed. Just confirm `setText('')` is NOT in `onError` or `onSettled`.

- [x] Task 2: Write RTL tests for create failure (AC: 5)
  - [x] Add tests to `client/src/components/TodoInput.test.tsx` (existing file — add new `describe` block or new `it` blocks at the end)
  - [x] Test pattern: real `QueryClientProvider` + `vi.stubGlobal('fetch', vi.fn())` (same as existing tests in this file)
  - [x] Test 1 — shows InlineError when mutation fails:
    ```tsx
    it('shows InlineError when create mutation fails', async () => {
      const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      renderWithQuery(<TodoInput />);
      const input = screen.getByPlaceholderText('Add a task…');
      await userEvent.type(input, 'Buy milk');
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));

      await screen.findByRole('alert');
      expect(screen.getByRole('alert').textContent).toContain("Couldn't save");
    });
    ```
  - [x] Test 2 — input value is preserved after failure:
    ```tsx
    it('preserves input text after create failure', async () => {
      const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      renderWithQuery(<TodoInput />);
      const input = screen.getByPlaceholderText('Add a task…');
      await userEvent.type(input, 'Buy milk');
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));

      await screen.findByRole('alert');
      expect((input as HTMLInputElement).value).toBe('Buy milk');
    });
    ```
  - [x] Test 3 — InlineError clears on successful retry:
    ```tsx
    it('clears InlineError on successful retry', async () => {
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ id: 99, text: 'Buy milk', completed: false, createdAt: new Date().toISOString() }),
        });
      vi.stubGlobal('fetch', mockFetch);

      renderWithQuery(<TodoInput />);
      const input = screen.getByPlaceholderText('Add a task…');
      await userEvent.type(input, 'Buy milk');
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      await screen.findByRole('alert'); // error appears

      await userEvent.click(screen.getByRole('button', { name: 'Add' })); // retry
      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    });
    ```
  - [x] Import `waitFor` from `@testing-library/react` at the top of the test file if not already imported

---

## Dev Notes

### Files to Change

| File | Action |
|---|---|
| `client/src/components/TodoInput.tsx` | Modify — add `createError` state, `InlineError` import and render, `onError` change, `handleSubmit` change |
| `client/src/components/TodoInput.test.tsx` | Modify — add 3 new tests at the end |
| `client/src/components/InlineError.tsx` | No change — already implemented in Story 3.1 |

No other files need to change.

### Text Preservation — No Restoration Needed

The current `TodoInput.tsx` **already** preserves text on failure. `setText('')` is called only in the `onSuccess` callback of `mutate(trimmed, { onSuccess: () => { setText(''); ... } })`. On failure, `onSuccess` never fires. The `text` state retains the user's typed value throughout the failed mutation. The dev only needs to:
1. Set the error message in `onError`
2. Focus the input in `onError`

There is no text restoration logic to write.

### Wrapper `<div>` Requirement

`InlineError` must render **outside** the `<form>` element. The `<form>` already has `display: flex` and `align-items: center` for row layout — placing `InlineError` inside it would break the layout. Wrap the `<form>` and `<InlineError>` in a plain `<div>` with no styles. The `InlineError` component already applies its own `marginTop: var(--space-1)` for the correct gap.

### `onError` in `useMutation` vs `mutate()` callback

There are **two** places error callbacks can live in TanStack Query:
- **`useMutation({ onError })`** — fires for every failure, regardless of where `mutate()` is called
- **`mutate(vars, { onError })`** — fires for this specific call only, but NOT after component unmounts

For setting state (`setCreateError`), use `useMutation({ onError })` — this is the safe, established pattern in this codebase (see `TodoItem.tsx` which uses the same approach for rollbacks). Do **not** add a second `onError` in the `mutate()` call site.

### Error Copy

Exact string (case-sensitive, including the em dash):
```
"Couldn't save — check your connection."
```
The `—` is an em dash (U+2014), not a hyphen. Copy exactly from epics.md UX-DR8 / Story 3.2 ACs.

### CSS Token Reference

`InlineError` uses `var(--color-error-subtle)` and `var(--color-error)` — both already defined in `client/src/globals.css`. No CSS changes needed in this story.

### Established Project Patterns (must follow)

- **Named exports only:** `export { TodoInput }` — no default exports
- **`import * as React from 'react'`** — namespace import, not `import React from 'react'`
- **Inline `style` prop for all styling** — no Tailwind class strings; use `style={{ ... }}` with CSS custom properties

### References

- Story 3.2 ACs [Source: `_bmad-output/planning-artifacts/epics.md` lines 563–604]
- `TodoInput.tsx` current implementation [Source: `client/src/components/TodoInput.tsx`]
- `InlineError.tsx` interface [Source: Story 3.1 / `client/src/components/InlineError.tsx`]
- CSS tokens [Source: `client/src/globals.css` `:root` block]
- `onMutate/onError/onSettled` pattern [Source: `client/src/components/TodoItem.tsx` — reference implementation]

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Added `createError` state (`string | null`) to `TodoInput.tsx`
- Imported `InlineError` from `./InlineError`; wrapped `<form>` and `<InlineError>` in a plain `<div>` so error renders outside the flex row
- `onError` in `useMutation` now calls `setCreateError("Couldn't save — check your connection.")` and `inputRef.current?.focus()` — text preserved naturally (only `setText('')` in `onSuccess`)
- `handleSubmit` calls `setCreateError(null)` before `mutate()` for clean retry UX
- Added 3 new RTL tests to `TodoInput.test.tsx`: failure shows InlineError, text preserved on failure, error clears on successful retry
- 34/34 tests pass; typecheck clean

### File List

- client/src/components/TodoInput.tsx (modified)
- client/src/components/TodoInput.test.tsx (modified)

### Change Log

- 2026-04-10: Story 3.2 — Create failure: InlineError wired into TodoInput; 3 new RTL tests
