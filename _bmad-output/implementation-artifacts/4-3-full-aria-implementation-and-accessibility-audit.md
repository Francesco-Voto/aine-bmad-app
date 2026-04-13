# Story 4.3: Full ARIA Implementation & Accessibility Audit

Status: done

## Story

As a screen reader user,
I want all list changes, errors, and interactive elements to be announced correctly,
So that I can use the app without visual output.

## Context & Analysis

### Current ARIA Inventory

| Element | Attribute | Current State | Required |
|---|---|---|---|
| `PageShell` `<h1>` | heading level | ✅ `<h1>` renders app title | Exactly one `<h1>` |
| `TodoInput` `<form>` | `role="form"` | ❌ **MISSING** | Must be present |
| `TodoInput` `<form>` | `aria-label` | ✅ `"Add a task"` | `"Add a task"` |
| `TodoInput` `<Input>` | `aria-label` | ✅ `"Task text"` | Present |
| `TodoList` outer `<div>` | `aria-live` | ✅ `"polite"` | `"polite"` |
| `TodoList` outer `<div>` | `aria-busy` | ❌ **MISSING from live region** | `true` during loading |
| `TodoList` skeleton `<div>` | `aria-busy` | ✅ `true` — but **wrong element** | Must be on `aria-live` container |
| `TodoList` `<ul>` | `role` | ✅ `"list"` | `"list"` |
| `TodoList` `<li>` | `role` | ✅ `"listitem"` | `"listitem"` |
| `TodoItem` checkbox | `aria-label` | ✅ `"Complete: {text}"` | `"Complete: {text}"` |
| `TodoItem` delete button | `aria-label` | ✅ `"Delete: {text}"` | `"Delete: {text}"` |
| `TodoItem` delete button | AT visibility | ✅ native `<button>`, `opacity` does not remove from AT | Keyboard-focusable at all times |
| `InlineError` | `role` | ✅ `"alert"` | `"alert"` |

### Two Code Gaps

#### Gap 1: `role="form"` missing from `TodoInput`

The HTML `<form>` element does not have an accessible role in the AT unless it **also has an accessible name** — either via `aria-label`, `aria-labelledby`, or `title`. An `aria-label` alone is insufficient; `role="form"` must be explicitly declared for the accessible role to be exposed as "form" (not just a generic region or nothing).

Current:
```tsx
<form
  aria-label="Add a task"
  className="input-container"
  ...
```

Required:
```tsx
<form
  role="form"
  aria-label="Add a task"
  className="input-container"
  ...
```

#### Gap 2: `aria-busy` on wrong element in `TodoList`

The ARIA spec requires `aria-busy="true"` to be set on the **live region element** itself (`<div aria-live="polite">`), not on a child element. When `aria-busy="true"` is on the live region, screen readers suppress announcements until it becomes `false` or is removed — giving a coherent "loading, then done" announcement. When it is only on a child, SRs may announce partial content changes during loading.

Current `TodoList.tsx` structure:
```tsx
<div aria-live="polite">        {/* ← aria-busy NOT here */}
  {isLoading && (
    <div aria-busy="true" aria-label="Loading tasks">  {/* ← aria-busy incorrectly here */}
      {/* skeleton rows */}
    </div>
  )}
```

Required structure:
```tsx
<div aria-live="polite" aria-busy={isLoading || undefined}>   {/* ← aria-busy moved here */}
  {isLoading && (
    <div aria-label="Loading tasks">   {/* ← aria-busy removed; aria-label kept */}
      {/* skeleton rows */}
    </div>
  )}
```

Note: `aria-busy={isLoading || undefined}` uses `undefined` (not `false`) when not loading. `aria-busy="false"` is valid but noisy in the DOM; `undefined` omits the attribute entirely, which has the same AT effect.

---

## Acceptance Criteria

1. **Given** the page renders, **When** the heading structure is inspected (RTL or AT), **Then** there is exactly one `<h1>` describing the app purpose.

2. **Given** the add form, **When** ARIA attributes are inspected, **Then** `role="form"` and `aria-label="Add a task"` are both present on the `<form>` element.

3. **Given** the todo list, **When** ARIA attributes are inspected, **Then** `<ul>` has `role="list"`; each `<li>` has `role="listitem"`; the outer container has both `aria-live="polite"` **and** `aria-busy="true"` during the fetch, on the same element.

4. **Given** each `TodoItem`, **When** ARIA labels are inspected, **Then** checkbox has `aria-label="Complete: {task text}"` and delete button has `aria-label="Delete: {task text}"`.

5. **Given** an `InlineError` renders, **When** the accessibility tree is inspected, **Then** `role="alert"` announces the message immediately on render.

6. **Given** the delete button has `opacity: 0`, **When** the accessibility tree is inspected, **Then** the button is present and keyboard-focusable (opacity does not remove from AT; native `<button>` always included).

7. **Given** Chrome DevTools MCP is available, **When** the full Lighthouse accessibility audit is run, **Then** the score is ≥ 95; all ARIA attributes on the form, list, and a `TodoItem` are confirmed in the accessibility tree; `aria-live="polite"` confirmed on the list container.

8. **Given** RTL tests, **When** the form renders, **Then** `role="form"` and `aria-label="Add a task"` are asserted together on the same element.

9. **Given** RTL tests, **When** `TodoList` renders in loading state, **Then** `aria-busy="true"` is on the **same element** that has `aria-live="polite"`.

---

## Tasks / Subtasks

### Task 1: Add `role="form"` to `TodoInput.tsx` (AC: 2, 8)

In `client/src/components/TodoInput.tsx`, add `role="form"` to the `<form>` element:

**Current:**
```tsx
<form
  aria-label="Add a task"
  className="input-container"
  onSubmit={handleSubmit}
  style={{
```

**Replace with:**
```tsx
<form
  role="form"
  aria-label="Add a task"
  className="input-container"
  onSubmit={handleSubmit}
  style={{
```

No other changes to `TodoInput.tsx`.

---

### Task 2: Move `aria-busy` to the `aria-live` container in `TodoList.tsx` (AC: 3, 9)

In `client/src/components/TodoList.tsx`:

**Step 2a** — Add `aria-busy` to outer container:

**Current:**
```tsx
<div aria-live="polite">
```

**Replace with:**
```tsx
<div aria-live="polite" aria-busy={isLoading || undefined}>
```

**Step 2b** — Remove `aria-busy` from inner skeleton div (keep `aria-label`):

**Current:**
```tsx
<div aria-busy="true" aria-label="Loading tasks">
```

**Replace with:**
```tsx
<div aria-label="Loading tasks">
```

No other changes to `TodoList.tsx`.

---

### Task 3: Add RTL test for `role="form"` in `TodoInput.test.tsx` (AC: 8)

Add one new test to `client/src/components/TodoInput.test.tsx` inside the existing `describe('TodoInput')` block:

```tsx
it('form has role="form" and aria-label="Add a task"', () => {
  renderWithQuery(<TodoInput />);
  const form = screen.getByRole('form', { name: 'Add a task' });
  expect(form).toBeDefined();
});
```

`getByRole('form', { name: '...' })` locates the element with `role="form"` and the given accessible name. If either attribute is missing, the query throws and the test fails — it asserts both attributes in a single line.

---

### Task 4: Add RTL test asserting `aria-busy` is on the `aria-live` container in `TodoList.test.tsx` (AC: 9)

The existing test `container.querySelector('[aria-busy="true"]')` will still pass after the code change (the attribute moves to the outer container, which is still in the DOM). Add a more precise test that asserts co-location:

Add one new test to `client/src/components/TodoList.test.tsx` inside the existing `describe('TodoList')` block:

```tsx
it('aria-busy="true" is on the aria-live container while loading', () => {
  mockUseTodos.mockReturnValue({
    isLoading: true,
    data: undefined,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useTodos>);

  const { container } = renderWithQuery(<TodoList />);

  const liveRegion = container.querySelector('[aria-live="polite"]');
  expect(liveRegion).toBeTruthy();
  expect(liveRegion?.getAttribute('aria-busy')).toBe('true');
});
```

---

### Task 5: Lighthouse Accessibility Audit via Chrome DevTools MCP (AC: 7)

This task is a **verification step**, not a code change. Run the Lighthouse audit against the running dev server (`http://localhost:5173`) using the Chrome DevTools MCP tools after Tasks 1–2 are complete:

**Steps:**
1. Ensure both dev servers are running (`npm run dev` in `server/` and `client/`)
2. Use `mcp_chrome-devtool_lighthouse_audit` with `url: "http://localhost:5173"` and include the `accessibility` category
3. Target score: **≥ 95**

**Accessibility tree verification (using `mcp_chrome-devtool_take_snapshot`):**

Confirm in the AT snapshot:
- Form: `role=form name="Add a task"` is present
- List: `role=list` is present; `aria-live="polite"` on its container
- A `TodoItem` row: `role=checkbox name="Complete: {text}"` and `role=button name="Delete: {text}"`
- An `InlineError` (trigger a fetch error): `role=alert` appears

**If the score is < 95:**  
Common Lighthouse accessibility flags to check:
- Color contrast failures — use `var(--color-text-secondary)` which may be low-contrast in some themes
- Missing `lang` attribute on `<html>` — if not set, add `lang="en"` to `index.html`
- Image alternative text — not applicable (no `<img>` elements)
- Link / button names — all should pass given existing `aria-label` attributes

---

## Files Changed

| File | Change |
|---|---|
| `client/src/components/TodoInput.tsx` | Add `role="form"` to `<form>` |
| `client/src/components/TodoList.tsx` | Move `aria-busy` from inner skeleton div to outer `aria-live` container |
| `client/src/components/TodoInput.test.tsx` | Add 1 test: `role="form"` + `aria-label` asserted together |
| `client/src/components/TodoList.test.tsx` | Add 1 test: `aria-busy` co-located with `aria-live` |

No changes to: `InlineError.tsx`, `PageShell.tsx`, `TodoItem.tsx`, any UI primitives, hooks, or API files.

---

## What Is Already Correct (No Code Changes)

The following ARIA implementations from previous epics are complete and have passing tests. Story 4.3 should **not** modify them:

- `InlineError` → `role="alert"` ✅ tested in `InlineError.test.tsx`
- `PageShell` → single `<h1>` ✅ tested in `PageShell.test.tsx`
- `TodoItem` checkbox → `aria-label="Complete: {text}"` ✅ tested in `TodoItem.test.tsx`
- `TodoItem` delete button → `aria-label="Delete: {text}"` ✅ tested in `TodoItem.test.tsx`
- `TodoList` `<ul>` → `role="list"` ✅ tested in `TodoList.test.tsx`
- `TodoList` `<li>` → `role="listitem"` ✅ tested in `TodoList.test.tsx`
- `TodoList` outer container → `aria-live="polite"` ✅ confirmed in code
- Delete button AT visibility → native `<button>` with `opacity: 0` remains in accessibility tree ✅
