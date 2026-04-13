# Story 4.4: Animations, Transitions & Polish

Status: done

## Story

As a user,
I want subtle, purposeful animations on task interactions,
So that the app feels responsive and alive without being distracting.

## Context & Analysis

### Current Animation Inventory

| Behaviour | AC Requirement | Current State |
|---|---|---|
| New item fade-in | `opacity 0→1`, ~150ms | ❌ **MISSING** — no animation on mount |
| Text toggle transition | `opacity` + `text-decoration` 150ms ease-out | ❌ **MISSING** — values change instantly |
| Delete item collapse | `opacity 150ms ease-out` + `max-height 200ms ease-out` | ⚠️ **EXISTS but as inline `style`** — must move to CSS |
| Add button pending | `opacity: 0.5`, `cursor: not-allowed`, `disabled` attribute | ⚠️ **opacity/cursor are inline style** — must rely on CSS via `buttonVariants` |
| Skeleton pulse/shimmer | `@keyframes` CSS, no JS animation | ✅ Already CSS-only `@keyframes shimmer` on `.skeleton` |
| `prefers-reduced-motion` | All transitions/animations → `none` | ❌ **MISSING** — no media query |

### AC: "No Inline `style` Transitions"

The epics require **all transition declarations to be in CSS/Tailwind classes, not inline `style` props**. Two current violations:

**Violation 1 — `collapseStyle` in `TodoItem.tsx`:**
```tsx
const collapseStyle: React.CSSProperties = collapsed
  ? {
      opacity: 0,
      maxHeight: 0,
      overflow: 'hidden',
      marginBottom: 0,
      padding: 0,
      transition: 'opacity 150ms, max-height 200ms ease-out',  // ← inline transition
    }
  : { opacity: 1, maxHeight: '200px', transition: 'opacity 150ms, max-height 200ms ease-out' };  // ← inline transition
```

Fix: remove `transition` from both branches of `collapseStyle`; add `transition: border-color 150ms, opacity 150ms, max-height 200ms ease-out;` to `.todo-card` in `globals.css` (extending the existing `border-color 150ms` rule).

The runtime-controlled values (`opacity`, `maxHeight`, `overflow`, `marginBottom`, `padding`) remain in inline style — they are the *values being transitioned*, not the transition declaration.

**Violation 2 — Button pending state in `TodoInput.tsx`:**
```tsx
<Button
  type="submit"
  disabled={isPending || atLimit}
  style={{
    flexShrink: 0,
    marginLeft: 'var(--space-2)',
    opacity: isPending ? 0.5 : 1,           // ← redundant with disabled:opacity-50
    cursor: isPending ? 'not-allowed' : 'pointer',  // ← redundant with disabled:pointer-events-none
  }}
>
```

`buttonVariants` in `Button.tsx` already includes `disabled:pointer-events-none disabled:opacity-50` in the Tailwind base class. When `disabled={isPending || atLimit}`, these Tailwind utilities already handle the visual state. The inline `opacity` and `cursor` are redundant and must be removed.

Note: `disabled:pointer-events-none` (no pointer events) has the same practical effect as `cursor: not-allowed` for disabled buttons — the user cannot hover or click the element.

### Text Toggle Transition

The `<span style={textStyle}>` text element in `TodoItem.tsx` switches between two style objects depending on `todo.completed`. Currently the visual change (opacity, color, strikethrough) is instant. The AC requires a 150ms ease-out transition on `opacity` and the color shift.

Note: `text-decoration: line-through` itself **cannot be CSS-transitioned** (it's not an animatable property). Only `opacity` and `color` can transition. The strikethrough will appear/disappear instantly — this is a browser limitation, not a code gap.

Fix: add a `.todo-text` CSS class with:
```css
.todo-text {
  transition: opacity 150ms ease-out, color 150ms ease-out;
}
```
Apply `className="todo-text"` to the `<span>` in `TodoItem.tsx` (alongside the existing `style={textStyle}`).

### New Item Fade-In

When `useCreateTodo` inserts an optimistic todo, `data[0]` gets a new entry with a negative id (e.g., `id: Date.now() * -1`). React renders a new `<li key={todo.id}>` element for it. The fade-in must fire on mount without any JS state.

Architecture: apply a `@keyframes todo-fade-in` animation to a `.todo-item` CSS class on the outer wrapper `<div>` in `TodoItem.tsx`. When React mounts a new `<TodoItem>`, the animation plays automatically via CSS — no JS involved.

The wrapper `<div>` (currently: `<div style={{ marginBottom: 6 }}>`) gets `className="todo-item"`. CSS:
```css
@keyframes todo-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.todo-item {
  animation: todo-fade-in 150ms ease-out;
}
```

This also causes the initial list load items to fade in (after the skeleton hides), which is a desirable polish effect.

### `prefers-reduced-motion`

Users who opt out of motion via OS/browser settings must see no animations or transitions. The standard CSS pattern:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

`0.01ms` (rather than `0` or `none`) is used because some browser engines skip `animationend` / `transitionend` events for zero-duration animations, which can break JS callbacks that depend on them. `0.01ms` is imperceptibly fast but fires the events.

---

## Acceptance Criteria

1. **Given** a new task is optimistically inserted, **When** it appears in the list, **Then** it fades in with `opacity 0→1` in ~150ms via CSS animation on mount.

2. **Given** a todo is toggled complete, **When** the transition fires, **Then** `opacity` and `color` shift with 150ms ease-out (note: `text-decoration: line-through` is non-animatable and toggles instantly — browser limitation).

3. **Given** a todo is deleted via the delete button, **When** it collapses, **Then** `opacity` transitions over 150ms and `max-height` over 200ms ease-out — no jarring jump. The transition is declared in CSS, not inline style.

4. **Given** the Add mutation is in-flight, **When** the button state is inspected, **Then** the button has the `disabled` attribute, `opacity-50` applied via Tailwind's `disabled:opacity-50` variant, and `pointer-events-none` applied via `disabled:pointer-events-none`. No inline `opacity` or `cursor` style on the button.

5. **Given** the list is loading, **When** the skeleton renders, **Then** the CSS `@keyframes shimmer` animation runs on the 3 placeholder rows — no JS animation. *(Already satisfied — code review check.)*

6. **Given** all transition and animation declarations in the codebase, **When** the code is reviewed, **Then** no `transition:` or `animation:` property appears in a React inline `style` prop.

7. **Given** `prefers-reduced-motion: reduce` is active, **When** any animation or transition would run, **Then** all durations are set to `0.01ms` via `@media (prefers-reduced-motion: reduce)` — imperceptibly fast with no visible motion.

8. **Given** Chrome DevTools MCP is available, **When** `prefers-reduced-motion: reduce` is emulated in the Rendering panel, **Then** a screenshot confirms no animation on toggle or delete; Lighthouse performance panel confirms the collapse animation runs at 60fps without layout thrash.

9. **Given** RTL tests for `TodoInput`, **When** a mutation is in-flight (mocked as pending), **Then** the submit button has the `disabled` HTML attribute set.

---

## Tasks / Subtasks

### Task 1: Move `.todo-card` transition from inline to CSS in `globals.css` (AC: 3, 6)

In `client/src/globals.css`, extend the existing `.todo-card` rule:

**Current:**
```css
.todo-card {
  transition: border-color 150ms;
}
```

**Replace with:**
```css
.todo-card {
  transition: border-color 150ms, opacity 150ms, max-height 200ms ease-out;
}
```

---

### Task 2: Add `.todo-text` transition class to `globals.css` (AC: 2)

Append to `client/src/globals.css` (after the `.todo-card` rules):

```css
/* Todo text toggle transition — Story 4.4 */
.todo-text {
  transition: opacity 150ms ease-out, color 150ms ease-out;
}
```

---

### Task 3: Add new-item fade-in animation to `globals.css` (AC: 1)

Append to `client/src/globals.css`:

```css
/* New item fade-in on mount — Story 4.4 */
@keyframes todo-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.todo-item {
  animation: todo-fade-in 150ms ease-out;
}
```

---

### Task 4: Add `prefers-reduced-motion` block to `globals.css` (AC: 7)

Append to `client/src/globals.css` as the final rule (must come last so it overrides all earlier declarations):

```css
/* Reduced motion — Story 4.4 — must be last rule in file */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### Task 5: Remove inline `transition` from `collapseStyle` in `TodoItem.tsx` (AC: 3, 6)

In `client/src/components/TodoItem.tsx`, remove the `transition` property from both branches of `collapseStyle`. The transition is now declared by `.todo-card` in CSS (Task 1).

**Current:**
```tsx
  const collapseStyle: React.CSSProperties = collapsed
    ? {
        opacity: 0,
        maxHeight: 0,
        overflow: 'hidden',
        marginBottom: 0,
        padding: 0,
        transition: 'opacity 150ms, max-height 200ms ease-out',
      }
    : { opacity: 1, maxHeight: '200px', transition: 'opacity 150ms, max-height 200ms ease-out' };
```

**Replace with:**
```tsx
  const collapseStyle: React.CSSProperties = collapsed
    ? {
        opacity: 0,
        maxHeight: 0,
        overflow: 'hidden',
        marginBottom: 0,
        padding: 0,
      }
    : { opacity: 1, maxHeight: '200px' };
```

---

### Task 6: Add `.todo-item` and `.todo-text` classes to `TodoItem.tsx` (AC: 1, 2)

**Step 6a** — Add `className="todo-item"` to the outermost wrapper `<div>`:

**Current:**
```tsx
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        className="todo-card"
```

**Replace with:**
```tsx
  return (
    <div className="todo-item" style={{ marginBottom: 6 }}>
      <div
        className="todo-card"
```

**Step 6b** — Add `className="todo-text"` to the text `<span>`:

**Current:**
```tsx
        <span style={textStyle}>{todo.text}</span>
```

**Replace with:**
```tsx
        <span className="todo-text" style={textStyle}>{todo.text}</span>
```

---

### Task 7: Remove inline `opacity`/`cursor` from Button in `TodoInput.tsx` (AC: 4, 6)

In `client/src/components/TodoInput.tsx`, remove `opacity` and `cursor` from the Button's inline style. The `buttonVariants` Tailwind base class already includes `disabled:opacity-50 disabled:pointer-events-none` which handles the visual state when `disabled` is set.

**Current:**
```tsx
        <Button
          type="submit"
          disabled={isPending || atLimit}
          style={{
            flexShrink: 0,
            marginLeft: 'var(--space-2)',
            opacity: isPending ? 0.5 : 1,
            cursor: isPending ? 'not-allowed' : 'pointer',
          }}
        >
```

**Replace with:**
```tsx
        <Button
          type="submit"
          disabled={isPending || atLimit}
          style={{
            flexShrink: 0,
            marginLeft: 'var(--space-2)',
          }}
        >
```

---

### Task 8: Add RTL test for disabled button during pending mutation in `TodoInput.test.tsx` (AC: 9)

Add one new test to `client/src/components/TodoInput.test.tsx` inside the existing `describe('TodoInput')` block. Use a `fetch` mock that never resolves to hold the mutation in pending state:

```tsx
it('submit button is disabled while mutation is pending', async () => {
  // fetch never resolves → mutation stays in isPending state
  const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}));
  vi.stubGlobal('fetch', fetchMock);

  renderWithQuery(<TodoInput />);
  const input = screen.getByPlaceholderText('Add a task…');
  const button = screen.getByRole('button', { name: 'Add' });

  await userEvent.type(input, 'Buy milk');
  await userEvent.click(button);

  // After click the mutation fires; button should become disabled
  await waitFor(() => {
    expect(button).toBeDisabled();
  });
});
```

Note: `waitFor` is needed because React's mutation state update is asynchronous even when `fetch` is called synchronously. Import `waitFor` at the top of the test file (it is already imported via `@testing-library/react`).

---

### Task 9: Chrome DevTools Verification (AC: 8)

After Tasks 1–7 are complete and the dev server is running:

1. **Performance trace of delete collapse:**
   - Use `mcp_chrome-devtoo_performance_start_trace` + trigger a delete + `mcp_chrome-devtoo_performance_stop_trace`
   - Use `mcp_chrome-devtoo_performance_analyze_insight` to confirm no layout thrash (the `max-height` + `opacity` combo should composite without layout reflow if `will-change` is needed)

2. **`prefers-reduced-motion` emulation:**
   - Use `mcp_chrome-devtoo_emulate` with reduced-motion setting (or inject CSS via `mcp_chrome-devtoo_evaluate_script`)
   - Use `mcp_chrome-devtoo_take_screenshot` to confirm no visible animation

---

## Files Changed

| File | Change |
|---|---|
| `client/src/globals.css` | Extend `.todo-card` transition; add `.todo-text`; add `@keyframes todo-fade-in` + `.todo-item`; add `prefers-reduced-motion` block |
| `client/src/components/TodoItem.tsx` | Remove `transition` from `collapseStyle`; add `className="todo-item"` to wrapper div; add `className="todo-text"` to text span |
| `client/src/components/TodoInput.tsx` | Remove `opacity` and `cursor` from Button inline style |
| `client/src/components/TodoInput.test.tsx` | Add 1 test: button disabled during pending mutation |

No changes to: `Button.tsx`, `Checkbox.tsx`, `Input.tsx`, `TodoList.tsx`, `PageShell.tsx`, any hooks, any API files.

---

## What Is Already Correct (No Code Changes)

- **Skeleton shimmer** — `@keyframes shimmer` + `.skeleton` CSS class in `globals.css` ✅
- **Delete collapse values** — `opacity: 0/1` and `maxHeight: 0/200px` inline logic stays in `collapseStyle` (only the `transition:` declaration moves to CSS)
- **Button `disabled` attribute** — `disabled={isPending || atLimit}` already sets the HTML attribute ✅
- **`buttonVariants` disabled utilities** — `disabled:opacity-50 disabled:pointer-events-none` already in CVA base class ✅
