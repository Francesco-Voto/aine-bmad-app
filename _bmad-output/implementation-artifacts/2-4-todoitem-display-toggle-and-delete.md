# Story 2.4: TodoItem — Display, Toggle & Delete

Status: done

## Story

As a user,
I want to see each task as a card, toggle its completion, and delete it,
So that I can manage my list fluidly.

## Acceptance Criteria

1. **Given** an active todo item, **When** `TodoItem` renders, **Then** it shows white bg, `1px solid var(--color-border)` border, 6px radius, `12px 14px` padding, `6px` margin-bottom, with layout `[Checkbox][text flex-1][Delete ✕]` at full opacity
2. **Given** a completed todo item, **When** `TodoItem` renders, **Then** task text has strikethrough + `opacity: 0.6` + `color: var(--color-text-disabled)` — distinguished from active state without relying on color alone
3. **Given** the card is hovered, **When** the CSS hover state applies, **Then** the card border shifts to `#cbd5e1` (slate-300) and the delete button transitions from `opacity: 0` to `opacity: 1`
4. **Given** the delete button at rest, **When** the DOM is inspected, **Then** the button is present in the DOM with `opacity: 0` (not `display: none`) and has `aria-label="Delete: {task text}"`; the checkbox has `aria-label="Complete: {task text}"`
5. **Given** the user clicks the checkbox, **When** the toggle mutation fires, **Then** the item immediately reflects the new `completed` state (optimistic); on API success `queryClient.invalidateQueries({ queryKey: ['todos'] })` is called; on failure the item reverts to its previous state
6. **Given** the user clicks the delete button, **When** the delete mutation fires, **Then** the item immediately collapses with `opacity 150ms` + `max-height 200ms ease-out` (optimistic); on failure the item reappears
7. **Given** Chrome DevTools MCP is available, **When** active and completed items are screenshotted side-by-side, **Then** strikethrough and opacity difference are visible; accessibility tree confirms ARIA labels; delete button present in DOM at `opacity: 0` at rest
8. **Given** RTL tests, **When** interactions are simulated, **Then** completed item shows strikethrough class/style; delete triggers mutation; toggle sends correct payload; optimistic state applies before API response resolves

## Tasks / Subtasks

- [x] Task 1: Create `TodoItem` component (AC: 1, 2, 3, 4)
  - [x] Create `client/src/components/TodoItem.tsx`
  - [x] Props: `{ todo: Todo }`; import `Todo` from `../api/types`
  - [x] Import `Checkbox` from `./ui/Checkbox` and `useQueryClient` from `@tanstack/react-query`
  - [x] Import `toggleTodo` and `deleteTodo` from `../api/todos`
  - [x] **Card layout** — outer `<li>` (no role override here; `TodoList` sets `role="listitem"` on the `<li>` wrapper):
    - `style`: `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: 6px`, `padding: 12px 14px`, `margin-bottom: 6px`
    - Add a CSS class for the hover border shift and delete button reveal (see Task 2)
    - Flex row: `display: flex`, `align-items: center`, `gap: var(--space-3)`
  - [x] **Checkbox** (first column):
    - Render `<Checkbox checked={todo.completed} onCheckedChange={handleToggle} aria-label={\`Complete: ${todo.text}\`} />`
  - [x] **Text** (middle, `flex: 1`):
    - Active: `color: var(--color-text-primary)`, `font-size: var(--text-base)`
    - Completed: add `text-decoration: line-through`, `opacity: 0.6`, `color: var(--color-text-disabled)`
    - Apply completed styles conditionally based on `todo.completed`
  - [x] **Delete button** (last column):
    - `<button>` with `aria-label={\`Delete: ${todo.text}\`}`
    - At rest: `opacity: 0`, transition `opacity 150ms`
    - On parent hover: `opacity: 1` (via CSS class, see Task 2)
    - Content: `✕` (×) or an SVG close icon — keep it simple
    - No border, transparent bg, `cursor: pointer`, `color: var(--color-text-secondary)`
    - On click: `handleDelete()`

- [x] Task 2: Add `TodoItem` CSS to `globals.css` (AC: 3, 4)
  - [x] Open `client/src/globals.css`
  - [ ] Append the hover CSS for the card and delete button reveal:
    ```css
    .todo-card {
      transition: border-color 150ms;
    }

    .todo-card:hover {
      border-color: #cbd5e1; /* slate-300 */
    }

    .todo-card .delete-btn {
      opacity: 0;
      transition: opacity 150ms;
    }

    .todo-card:hover .delete-btn {
      opacity: 1;
    }
    ```
  - [x] Apply `className="todo-card"` to the card `<div>` element in `TodoItem`
  - [x] Apply `className="delete-btn"` to the delete `<button>` in `TodoItem`

- [x] Task 3: Implement toggle mutation with optimistic update (AC: 5)
  - [x] Inside `TodoItem`, use `useMutation` from `@tanstack/react-query`:
    ```ts
    const queryClient = useQueryClient();
    const toggleMutation = useMutation({
      mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
        toggleTodo(id, completed),
      onMutate: async ({ id, completed }) => {
        await queryClient.cancelQueries({ queryKey: ['todos'] });
        const previous = queryClient.getQueryData<Todo[]>(['todos']);
        queryClient.setQueryData<Todo[]>(['todos'], (old) =>
          old?.map((t) => (t.id === id ? { ...t, completed } : t)) ?? []
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(['todos'], context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
      },
    });
    ```
  - [x] `handleToggle` callback: `toggleMutation.mutate({ id: todo.id, completed: !todo.completed })`

- [x] Task 4: Implement delete mutation with optimistic collapse (AC: 6)
  - [x] Add local React state for collapse animation: `const [collapsed, setCollapsed] = React.useState(false)`
  - [x] Add `deleteMutation` using `useMutation`:
    ```ts
    const deleteMutation = useMutation({
      mutationFn: (id: number) => deleteTodo(id),
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: ['todos'] });
        const previous = queryClient.getQueryData<Todo[]>(['todos']);
        setCollapsed(true); // starts the CSS collapse animation
        queryClient.setQueryData<Todo[]>(['todos'], (old) =>
          old?.filter((t) => t.id !== id) ?? []
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        setCollapsed(false);
        if (context?.previous) {
          queryClient.setQueryData(['todos'], context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
      },
    });
    ```
  - [x] `handleDelete` callback: `deleteMutation.mutate(todo.id)`
  - [x] Apply collapse styles to the card `<div>` based on `collapsed` state:
    - When `collapsed === false`: `opacity: 1`, `maxHeight: '200px'`, transitions on `opacity 150ms` and `max-height 200ms ease-out`
    - When `collapsed === true`: `opacity: 0`, `maxHeight: '0'`, `overflow: 'hidden'`, `marginBottom: 0`, `padding: 0`

- [x] Task 5: Replace placeholder `<div>` in `TodoList` with `<TodoItem>` (AC: 1)
  - [x] Open `client/src/components/TodoList.tsx`
  - [x] Import `TodoItem` from `./TodoItem`
  - [x] Replace the placeholder `<div>` inside each `<li>` with `<TodoItem todo={todo} />`
  - [x] Remove the inline styles from the `<li>` wrapper (the card styles now live in `TodoItem`)
  - [x] The current `<li>` block to replace:
    ```tsx
    <li key={todo.id} role="listitem">
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          padding: '12px 14px',
          marginBottom: 6,
        }}
      >
        {todo.text}
      </div>
    </li>
    ```
  - [x] Replace with:
    ```tsx
    <li key={todo.id} role="listitem">
      <TodoItem todo={todo} />
    </li>
    ```

- [x] Task 6: Verify with Chrome DevTools MCP (AC: 7)
  - [x] Ensure both server and client dev servers are running
  - [x] Navigate to `http://localhost:5173` in Chrome DevTools MCP
  - [x] Seed a few todos (active and completed) via the Postman collection or `curl`:
    ```bash
    curl -X POST http://localhost:3000/api/todos -H 'Content-Type: application/json' -d '{"text":"Buy groceries"}'
    curl -X POST http://localhost:3000/api/todos -H 'Content-Type: application/json' -d '{"text":"Walk the dog"}'
    curl -X PATCH http://localhost:3000/api/todos/1 -H 'Content-Type: application/json' -d '{"completed":true}'
    ```
  - [x] Take a screenshot showing active and completed cards side-by-side — confirm strikethrough and opacity difference
  - [x] Inspect the accessibility tree — confirm `aria-label="Complete: Buy groceries"` on the checkbox, `aria-label="Delete: Buy groceries"` on the delete button
  - [x] Inspect DOM — confirm delete button has `opacity: 0` at rest (not `display: none`)
  - [x] Hover a card in DevTools and confirm the delete button becomes visible

- [x] Task 7: Write RTL tests for `TodoItem` (AC: 8)
  - [x] Create `client/src/components/TodoItem.test.tsx`
  - [x] Mock `@tanstack/react-query` mutations:
    - Use `vi.mock('@tanstack/react-query', async (importOriginal) => { ... })` to wrap the original module and spy on `useMutation`; OR
    - Provide a real `QueryClientProvider` with a mocked `fetch` (preferred — more realistic)
  - [x] **Preferred approach:** provide `QueryClientProvider` wrapper + mock `fetch` globally so mutations send real API calls that resolve/reject from the mock
  - [x] Create `renderWithQuery` helper (same as in `TodoList.test.tsx`):
    ```tsx
    function renderWithQuery(ui: React.ReactElement) {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
    }
    ```
  - [x] Test 1 — active item renders correctly:
    - render `<TodoItem todo={{ id: 1, text: 'Buy milk', completed: false, createdAt: '...' }} />`
    - assert `screen.getByText('Buy milk')` is visible
    - assert checkbox has `aria-label="Complete: Buy milk"`
    - assert delete button has `aria-label="Delete: Buy milk"`
    - assert text does NOT have `text-decoration: line-through` (check inline style or absence of completed class)
  - [x] Test 2 — completed item renders with strikethrough:
    - render `<TodoItem todo={{ id: 1, text: 'Walk dog', completed: true, createdAt: '...' }} />`
    - assert the text element has `style` containing `textDecoration: 'line-through'`
    - assert text has `opacity: 0.6` or `color: var(--color-text-disabled)`
  - [x] Test 3 — toggle calls mutation with correct payload:
    - mock `fetch` to resolve with `{ ok: true, json: async () => ({ id: 1, text: 'Buy milk', completed: true, createdAt: '...' }) }`
    - render active `<TodoItem todo={...} />`
    - `await userEvent.click(screen.getByRole('checkbox'))`
    - assert `fetch` was called with `'/api/todos/1'`, method `'PATCH'`, body `JSON.stringify({ completed: true })`
  - [x] Test 4 — delete button triggers delete mutation:
    - mock `fetch` to resolve with `{ ok: true, status: 204, json: async () => ({}) }`
    - render `<TodoItem todo={{ id: 2, text: 'Walk dog', completed: false, createdAt: '...' }} />`
    - `await userEvent.click(screen.getByLabelText('Delete: Walk dog'))`
    - assert `fetch` was called with `'/api/todos/2'`, method `'DELETE'`
  - [x] Run `npm run test --workspace=client` — must exit zero

## Dev Notes

### Current Placeholder in `TodoList.tsx` (to be replaced in Task 5)

Each `<li>` in `TodoList.tsx` currently renders:
```tsx
<li key={todo.id} role="listitem">
  <div
    style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 6,
      padding: '12px 14px',
      marginBottom: 6,
    }}
  >
    {todo.text}
  </div>
</li>
```
Task 5 replaces this with `<TodoItem todo={todo} />`.

### Optimistic Update Pattern (TanStack Query v5)

The `onMutate` / `onError` / `onSettled` pattern is the standard TanStack Query v5 approach for optimistic updates.

Key steps:
1. `onMutate`: cancel in-flight queries → snapshot previous data → apply optimistic change → return snapshot
2. `onError`: restore snapshot from context
3. `onSettled`: always invalidate to confirm with server

For `toggleTodo`, the optimistic update flips `completed` in the cache immediately. For `deleteTodo`, the item is removed from the cache optimistically and the CSS collapse animation starts simultaneously.

### Delete Collapse Animation

The collapse is driven by React state (`collapsed`), not CSS-only, because the item needs to disappear from the list after the animation:
- `collapsed = false` (default): `opacity: 1`, `maxHeight: '200px'` — item visible
- `collapsed = true` (after delete click): `opacity: 0`, `maxHeight: '0'`, `overflow: 'hidden'`, `padding: 0`, `marginBottom: 0`

The TanStack Query optimistic update removes the item from the cache data immediately so it won't re-appear after the animation. The CSS transition handles the visual smoothness.

### `Checkbox` Component API

The `Checkbox` component in `client/src/components/ui/Checkbox.tsx` is based on `@radix-ui/react-checkbox`. The key prop is `onCheckedChange: (checked: boolean | 'indeterminate') => void`. Cast to boolean in `handleToggle`:
```ts
const handleToggle = (checked: boolean | 'indeterminate') => {
  if (typeof checked === 'boolean') {
    toggleMutation.mutate({ id: todo.id, completed: checked });
  }
};
```

The `checked` prop accepts `boolean | 'indeterminate'` — pass `todo.completed` directly.

### `userEvent` in Tests

`@testing-library/user-event@14.6.1` is installed. Use the setup pattern:
```ts
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.click(screen.getByRole('checkbox'));
```

### Delete Button Accessibility

The delete button has `opacity: 0` at rest and `opacity: 1` on hover. It must NOT use `display: none` or `visibility: hidden` — those would remove it from the accessibility tree. `opacity: 0` keeps the button focusable and available to keyboard users and screen readers, which is the correct pattern for hover-reveal actions.

The `aria-label` must include the task text to disambiguate multiple delete buttons: `aria-label={\`Delete: ${todo.text}\`}`.

### Installed Packages (confirmed)

- `@radix-ui/react-checkbox@1.3.3` — already installed
- `@tanstack/react-query@5.74.4` — already installed
- `@testing-library/user-event@14.6.1` — already installed

No new packages needed.

### Working Directory

All `npm` commands from the repo root. `npm run test --workspace=client` for client tests only.

### Definition of Done

- [x] `client/src/components/TodoItem.tsx` exists with full layout, checkbox, text, delete button
- [x] Active item: full opacity, no strikethrough
- [x] Completed item: strikethrough + `opacity: 0.6` + `--color-text-disabled`
- [x] Card hover: border shifts to slate-300, delete button reveals
- [x] Delete button: `opacity: 0` at rest, in DOM (not `display: none`), `aria-label="Delete: {text}"`
- [x] Checkbox: `aria-label="Complete: {text}"`
- [x] Toggle mutation: optimistic update + revert on error + invalidate on settled
- [x] Delete mutation: optimistic collapse animation + revert on error
- [x] `globals.css` has `.todo-card` and `.delete-btn` CSS
- [x] `TodoList.tsx` uses `<TodoItem todo={todo} />` instead of the placeholder `<div>`
- [x] Chrome DevTools MCP screenshot confirms visual and accessibility requirements
- [x] `TodoItem.test.tsx` passes all 4 tests
- [x] `npm run test --workspace=client` exits zero
- [x] `npm run typecheck` from repo root exits zero

## Dev Agent Record

### Agent: GitHub Copilot (Claude Sonnet 4.6)

**Implementation notes:**
- Created `client/src/components/TodoItem.tsx` with `<div>` root (not `<li>` — avoids nested `<li>` HTML error from TodoList wrapper)
- Toggle mutation: TanStack Query v5 optimistic pattern — `onMutate` snapshots and applies, `onError` reverts, `onSettled` invalidates
- Delete mutation: `collapsed` state drives CSS collapse (`maxHeight: 0`, `opacity: 0`, `overflow: hidden`); cache filtered optimistically
- Added `.todo-card` / `.delete-btn` CSS to `client/src/globals.css` for hover border + delete reveal
- Updated `TodoList.tsx`: added `TodoItem` import, replaced placeholder `<div>` with `<TodoItem todo={todo} />`
- Chrome DevTools verified: active vs completed screenshot ✅, `aria-label` on checkbox and delete ✅, `opacity: 0` not `display: none` on delete ✅
- Created `client/src/components/TodoItem.test.tsx` — 4 RTL tests using QueryClientProvider + mocked `fetch`
- Updated `TodoList.test.tsx` to use `QueryClientProvider` wrapper for populated state test (needed after TodoItem introduced `useQueryClient`)
- All 18 client tests pass, TypeScript typecheck clean

## Review Findings

**Reviewed by:** GitHub Copilot (Claude Sonnet 4.6) — 2026-04-10
**Review mode:** full

### Patches Applied (1)

**P1 — `TodoItem.tsx`: collapse animation was instant — `transition` missing from collapsed branch**
- `collapseStyle` only included `transition: 'opacity 150ms, max-height 200ms ease-out'` in the `collapsed=false` branch. When `setCollapsed(true)` fired, the transition property was removed from inline style in the same frame as the opacity/maxHeight change, so browsers saw no transition to apply — the item disappeared instantly.
- Fix: added `transition: 'opacity 150ms, max-height 200ms ease-out'` to the `collapsed=true` branch as well, so the property is present during both the hide and show transitions.

### Dismissed (1)

- **D1** — `TodoList.test.tsx` loading/empty/error tests use bare `render` instead of `renderWithQuery`. No defect — `useTodos` is fully mocked so `useQueryClient` is never reached in those paths.

### All ACs: ✅ Pass
