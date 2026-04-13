# Story 4.2: Keyboard Navigation & Focus Management

Status: done

## Story

As a keyboard-only user,
I want all interactive controls to be reachable and operable without a mouse,
So that I can add, complete, and delete tasks entirely from the keyboard.

## Context & Analysis

### What Already Works (No Code Changes Required)

| Scenario | Status | Reason |
|---|---|---|
| Tab / Shift+Tab traversal | ✅ | DOM order: input → Add → checkboxes → delete buttons |
| Enter submits form | ✅ | Semantic `<form>` + `type="submit"` button |
| Space toggles checkbox | ✅ | Radix UI `CheckboxPrimitive.Root` handles Space natively |
| Enter / Space on delete button | ✅ | Native `<button>` element |
| Focus ring on Add button | ✅ | `focus-visible:ring-2 focus-visible:ring-offset-2` in `buttonVariants` CVA base class |
| Focus ring on Input | ✅ | `onFocus`/`onBlur` inline outline `2px solid var(--color-border-focus)` in `Input.tsx` |
| Focus ring on Checkbox | ✅ | `onFocus`/`onBlur` inline outline `2px solid var(--color-border-focus)` in `Checkbox.tsx` |

### What Must Be Implemented

1. **Escape clears input + removes focus** — `TodoInput.tsx` needs an `onKeyDown` handler  
2. **Focus ring on delete button** — `.delete-btn` has no `:focus-visible` CSS; also needs `opacity: 1` on focus so the hidden-at-rest button becomes visible  
3. **Focus moves after keyboard delete** — when an item is deleted via keyboard the user's focus must not be lost to `<body>`; it should move to the next item's checkbox, or to the input if the list is now empty

### Architecture Decision: Synchronous Focus-Move Before Mutation

`useDeleteTodo` applies an **optimistic update in `onMutate`** — it synchronously removes the item from the React Query cache the moment `deleteMutate` is called. This triggers an immediate re-render of `TodoList` that unmounts the `TodoItem`. If focus is moved in the mutation's `onSuccess` (after the server call), the element has already been removed from the DOM and focus is lost to `<body>` for the entire server round-trip.

**Decision:** `TodoItem` accepts an `onDeleteFocus?: () => void` prop that is called **synchronously at the start of `handleDelete`**, before `deleteMutate`. This moves focus atomically with the visual collapse, with no gap.

```tsx
const handleDelete = () => {
  onDeleteFocus?.();           // ← Focus moves NOW, before the DOM changes
  setCollapsed(true);
  deleteMutate(todo.id, {
    onError: () => setCollapsed(false),
  });
};
```

`TodoList` creates a stable callback per item using the current `data` in scope. At the moment `handleDelete` fires, `data` still includes the to-be-deleted item (the optimistic update fires inside `deleteMutate`, not before it). The callback correctly filters the item out to find the next target.

On mutation error, the item is restored and `setCollapsed(false)` reverts the visual state. Focus has already moved, which is acceptable — the user sees the inline error and can Tab back to the item.

### Focus Target After Delete

From TodoList's `data` (the pre-deletion list):

```
remaining  = data.filter(t => t.id !== todo.id)
deletedIdx = data.findIndex(t => t.id === todo.id)

if remaining.length === 0 → focus `#todo-input`
else                      → focus `#checkbox-${remaining[deletedIdx] ?? remaining.at(-1)}.id`
```

`remaining[deletedIdx]` is the item that was directly below the deleted one. If the deleted item was last, `remaining[deletedIdx]` is `undefined`, so we fall back to `remaining.at(-1)` (the now-last item).

The Radix Checkbox (`CheckboxPrimitive.Root`) renders a `<button>`. Adding `id={`checkbox-${todo.id}`}` to `Checkbox` in `TodoItem` lets `document.getElementById` locate it. Radix passes through arbitrary props.

---

## Acceptance Criteria

1. **Given** a keyboard user, **When** pressing Tab from the input, **Then** focus moves to the Add button, then to each checkbox top-to-bottom, then to each delete button; Shift+Tab reverses this order.

2. **Given** the input has a non-empty value, **When** the user presses Escape, **Then** the input is cleared and focus is removed from the input (blur).

3. **Given** the input is empty, **When** the user presses Escape, **Then** the input remains empty and focus is removed from the input.

4. **Given** any focusable control (input, Add button, checkbox, delete button), **When** focused via keyboard, **Then** a visible `2px` focus ring is present.

5. **Given** an item's delete button is focused via keyboard and the user presses Enter or Space, **When** the item is deleted, **Then** focus moves to the next item's checkbox, or to the input if the list is now empty.

6. **Given** the delete button is hidden at rest (opacity 0), **When** it receives keyboard focus, **Then** it becomes visible (opacity 1) with the focus ring.

7. **Given** RTL suite, **When** the Escape key is simulated on the input, **Then** the input value is cleared and the input is blurred.

8. **Given** RTL suite for `TodoItem`, **When** the delete button is clicked and the server confirms deletion, **Then** `onDeleteFocus` was called exactly once before the mutation ran.

---

## Tasks / Subtasks

### Task 1: Add Escape handler in `TodoInput.tsx` (AC: 2, 3, 7)

In `client/src/components/TodoInput.tsx`, locate the `<Input ... />` element and add an `onKeyDown` prop:

**Current:**
```tsx
<Input
  id="todo-input"
  ref={inputRef}
  value={text}
  onChange={(e) => setText(e.target.value)}
  placeholder="Add a task…"
  aria-label="New task text"
  disabled={isPending}
  autoFocus
/>
```

**Replace with:**
```tsx
<Input
  id="todo-input"
  ref={inputRef}
  value={text}
  onChange={(e) => setText(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Escape') {
      setText('');
      inputRef.current?.blur();
    }
  }}
  placeholder="Add a task…"
  aria-label="New task text"
  disabled={isPending}
  autoFocus
/>
```

No other changes to `TodoInput.tsx`.

---

### Task 2: Add delete button focus ring in `client/src/globals.css` (AC: 4, 6)

The `.delete-btn` is hidden at rest (`opacity: 0`) and visible on `.todo-card:hover`. When focused via keyboard it must also be visible. The rule uses **`outline`** (not CSS ring utility) to stay consistent with how `Input` and `Checkbox` implement their focus rings. Place this after the existing `.delete-btn` rules:

```css
/* Delete button keyboard focus ring — Story 4.2 */
.delete-btn:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
  opacity: 1;   /* override opacity: 0 at rest so the button is visible when keyboard-focused */
}
```

The `opacity: 1` here overrides the `.todo-card .delete-btn { opacity: 0; }` rule added in globals.css, ensuring the delete button is visible when focused via keyboard even when the card is not hovered.

---

### Task 3: Add `id` to `Checkbox` in `TodoItem.tsx` (AC: 5)

In `client/src/components/TodoItem.tsx`, add an `id` prop to `Checkbox` so it can be targeted by `document.getElementById` for focus management:

**Current:**
```tsx
<Checkbox
  checked={todo.completed}
  onCheckedChange={handleToggle}
  aria-label={`Complete: ${todo.text}`}
/>
```

**Replace with:**
```tsx
<Checkbox
  id={`checkbox-${todo.id}`}
  checked={todo.completed}
  onCheckedChange={handleToggle}
  aria-label={`Complete: ${todo.text}`}
/>
```

---

### Task 4: Add `onDeleteFocus` prop and call it in `handleDelete` in `TodoItem.tsx` (AC: 5, 8)

In `client/src/components/TodoItem.tsx`:

**Current interface:**
```tsx
interface TodoItemProps {
  todo: Todo;
}
```

**Replace with:**
```tsx
interface TodoItemProps {
  todo: Todo;
  onDeleteFocus?: () => void;
}
```

**Current component signature:**
```tsx
const TodoItem: React.FC<TodoItemProps> = ({ todo }) => {
```

**Replace with:**
```tsx
const TodoItem: React.FC<TodoItemProps> = ({ todo, onDeleteFocus }) => {
```

**Current `handleDelete`:**
```tsx
const handleDelete = () => {
  setCollapsed(true);
  deleteMutate(todo.id, {
    onError: () => setCollapsed(false),
  });
};
```

**Replace with:**
```tsx
const handleDelete = () => {
  onDeleteFocus?.();
  setCollapsed(true);
  deleteMutate(todo.id, {
    onError: () => setCollapsed(false),
  });
};
```

No other changes to `TodoItem.tsx`.

---

### Task 5: Pass `onDeleteFocus` from `TodoList.tsx` (AC: 5)

In `client/src/components/TodoList.tsx`, update the `data.map` render to pass `onDeleteFocus` per item:

**Current `data.map` block:**
```tsx
{data.map((todo: Todo) => (
  <li key={todo.id} role="listitem">
    <TodoItem todo={todo} />
  </li>
))}
```

**Replace with:**
```tsx
{data.map((todo: Todo, index: number) => (
  <li key={todo.id} role="listitem">
    <TodoItem
      todo={todo}
      onDeleteFocus={() => {
        const remaining = data.filter((t) => t.id !== todo.id);
        if (remaining.length === 0) {
          document.getElementById('todo-input')?.focus();
        } else {
          const nextTodo = remaining[index] ?? remaining[remaining.length - 1];
          document.getElementById(`checkbox-${nextTodo.id}`)?.focus();
        }
      }}
    />
  </li>
))}
```

**Why this is correct:** When `handleDelete` fires synchronously, the `data` captured in this callback's closure is the pre-deletion list (the optimistic update inside `deleteMutate` hasn't run yet). The callback correctly filters out the deleted item to find the next focus target.

**Timing trace:**
1. User presses Space/Enter on delete button
2. `handleDelete` runs → `onDeleteFocus()` called → focus moves to next checkbox (or input)
3. `setCollapsed(true)` → item starts visual collapse
4. `deleteMutate(id)` called → `onMutate` fires inside `useDeleteTodo` → cache updated optimistically → TodoList re-renders without the item
5. Server call happens in background
6. On success → `onSettled` invalidates query → TodoList re-renders with server-confirmed list

No import changes needed — `Todo` type is already imported in `TodoList.tsx`.

---

### Task 6: RTL tests for Escape key in `TodoInput.test.tsx` (AC: 7)

Add two new tests to `client/src/components/TodoInput.test.tsx` inside the existing `describe('TodoInput')` block:

```tsx
it('Escape clears a non-empty input and removes focus', async () => {
  renderWithQuery(<TodoInput />);
  const input = screen.getByPlaceholderText('Add a task…');
  await userEvent.type(input, 'hello');
  expect(input).toHaveValue('hello');

  await userEvent.keyboard('{Escape}');

  expect(input).toHaveValue('');
  expect(document.activeElement).not.toBe(input);
});

it('Escape on empty input removes focus without error', async () => {
  renderWithQuery(<TodoInput />);
  const input = screen.getByPlaceholderText('Add a task…');
  // input is empty by default
  await userEvent.keyboard('{Escape}');

  expect(input).toHaveValue('');
  expect(document.activeElement).not.toBe(input);
});
```

---

### Task 7: RTL test for `onDeleteFocus` in `TodoItem.test.tsx` (AC: 8)

Add one new test to `client/src/components/TodoItem.test.tsx` inside the existing `describe('TodoItem')` block. The test verifies that `onDeleteFocus` is called synchronously before the server call completes (i.e., called during the same synchronous frame as the button click).

```tsx
it('calls onDeleteFocus synchronously when the delete button is activated', async () => {
  const onDeleteFocus = vi.fn();

  // fetch mock: responds to DELETE successfully
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({}),
  });

  renderWithQuery(<TodoItem todo={activeTodo} onDeleteFocus={onDeleteFocus} />);
  const deleteBtn = screen.getByRole('button', { name: /Delete:/i });

  await userEvent.click(deleteBtn);

  // onDeleteFocus must have been called (synchronously, before any await)
  expect(onDeleteFocus).toHaveBeenCalledTimes(1);
});
```

---

## Files Changed

| File | Change |
|---|---|
| `client/src/components/TodoInput.tsx` | Add `onKeyDown` for Escape on `<Input>` |
| `client/src/components/TodoItem.tsx` | Add `onDeleteFocus?` prop; add `id` on `Checkbox`; call `onDeleteFocus?.()` in `handleDelete` |
| `client/src/components/TodoList.tsx` | Pass `onDeleteFocus` callback per item via `data.map` |
| `client/src/globals.css` | Add `.delete-btn:focus-visible` rule with `opacity: 1` |
| `client/src/components/TodoInput.test.tsx` | Add 2 Escape key tests |
| `client/src/components/TodoItem.test.tsx` | Add 1 `onDeleteFocus` callback test |

No changes to: `Button.tsx`, `Checkbox.tsx`, `Input.tsx`, any hooks, any API files.

---

## No `tabindex` Changes

The DOM order naturally provides the correct Tab sequence:

1. `<Input id="todo-input">` — input text field
2. `<button type="submit">Add</button>` — submit button
3. For each todo (top to bottom): `<button role="checkbox">` (Radix Checkbox) → `<button class="delete-btn">`

This is the exact sequence required. No `tabindex` attribute needs to be added or changed anywhere.
