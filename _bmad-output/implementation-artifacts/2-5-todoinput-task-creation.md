# Story 2.5: TodoInput — Task Creation

Status: done

## Story

As a user,
I want to type a task and press Enter (or tap Add) to instantly see it in my list,
So that task capture is immediate and effortless.

## Acceptance Criteria

1. **Given** the app loads, **When** the page renders, **Then** `TodoInput` is autofocused; placeholder text reads `"Add a task…"`; the compound container shows white bg with `1px solid var(--color-border)` border and 8px radius
2. **Given** the user presses Enter or taps the Add button, **When** the input is empty or whitespace-only, **Then** a subtle shake animation plays on the input, focus is retained, and the mutation is not called
3. **Given** the input reaches 400 characters (80% of 500), **When** the user continues typing, **Then** a character counter appears (`{n}/500`); at 500 characters the counter turns `var(--color-error)` and the submit is blocked
4. **Given** a valid task text, **When** the user submits, **Then** the task is optimistically prepended to the list before API response; input clears and refocuses immediately
5. **Given** the API confirms success, **When** the mutation settles, **Then** `queryClient.invalidateQueries({ queryKey: ['todos'] })` is called to confirm server state
6. **Given** the submit button is in-flight, **When** the mutation is pending, **Then** the button has `opacity: 0.5`, `cursor: not-allowed`, and the `disabled` attribute
7. **Given** Chrome DevTools MCP is available, **When** screenshots are taken, **Then** default, focused, and character-counter states are captured; `aria-label="Add task form"` confirmed on the `<form>` in the accessibility tree
8. **Given** RTL tests, **When** interactions are simulated, **Then** empty submit does not call mutation; valid submit calls mutation with correct payload; input clears after success; character counter appears at threshold and blocks submit at limit

## Tasks / Subtasks

- [x] Task 1: Create `TodoInput` component (AC: 1, 2, 3, 6)
  - [x] Create `client/src/components/TodoInput.tsx`
  - [x] Import `Input` from `./ui/Input` and `Button` from `./ui/Button`
  - [x] Import `useMutation`, `useQueryClient` from `@tanstack/react-query`
  - [x] Import `createTodo` from `../api/todos` and `Todo` from `../api/types`
  - [x] Local state:
    - `const [text, setText] = React.useState('')`
    - `const [shaking, setShaking] = React.useState(false)`
  - [x] **Container** — `<form aria-label="Add task form" onSubmit={handleSubmit}>`:
    - `display: flex`, `align-items: center`
    - `background: var(--color-surface)`
    - `border: 1px solid var(--color-border)`
    - `border-radius: 8px`
    - `padding: 6px 6px 6px 14px`
    - On focus-within shift border to `var(--color-border-focus)` — use the CSS class approach (see Task 2)
  - [x] **Input field** — use the `Input` component:
    - `value={text}`, `onChange={(e) => setText(e.target.value)}`
    - `placeholder="Add a task…"` (note the ellipsis `…` not `...`)
    - `autoFocus`
    - `maxLength={500}` (hard browser limit matches server limit)
    - `aria-label="Task text"` (the form already has its own label)
    - Override `Input`'s border/bg to transparent so the compound container shows its own border:
      ```tsx
      style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none' }}
      ```
      Pass directly as `style` prop — `Input` forwards these via `...props`
    - Apply `className={shaking ? 'shake' : ''}` for the shake animation
  - [x] **Character counter** — render only when `text.length >= 400`:
    - `<span>` with text `{text.length}/500`
    - Normal color: `var(--color-text-secondary)`, `font-size: var(--text-xs)`
    - When `text.length >= 500`: color switches to `var(--color-error)`
    - Position: inline after the input, before the button
  - [x] **Add button** — use the `Button` component:
    - Text: `"Add"`
    - `type="submit"`
    - `disabled={isPending || text.length >= 500}`
    - When `isPending`: wrap in a `<span style={{ opacity: 0.5 }}>` or apply inline style directly: `style={{ opacity: isPending ? 0.5 : 1, cursor: isPending ? 'not-allowed' : 'pointer' }}`
    - The `Button` component already handles `disabled:opacity-50` via Tailwind — but add `cursor: not-allowed` explicitly when `isPending`

- [x] Task 2: Handle shake animation and focus-within border in `globals.css` (AC: 2)
  - [x] Open `client/src/globals.css`
  - [x] Append the shake keyframes and a container focus-within style:
    ```css
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-6px); }
      40%       { transform: translateX(6px); }
      60%       { transform: translateX(-4px); }
      80%       { transform: translateX(4px); }
    }

    .shake {
      animation: shake 0.35s ease-in-out;
    }

    .input-container:focus-within {
      border-color: var(--color-border-focus);
    }
    ```
  - [x] Apply `className="input-container"` to the `<form>` element in `TodoInput`
  - [x] The `Input` component uses inline styles for its own border — override them to `none` inside `TodoInput` so only the container border is visible

- [x] Task 3: Implement create mutation with optimistic prepend (AC: 4, 5)
  - [x] Inside `TodoInput`, implement the `useMutation` for creating a todo:
    ```ts
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
      mutationFn: (text: string) => createTodo(text),
      onMutate: async (newText) => {
        await queryClient.cancelQueries({ queryKey: ['todos'] });
        const previous = queryClient.getQueryData<Todo[]>(['todos']);
        // Prepend an optimistic item with a temporary negative id
        const optimisticTodo: Todo = {
          id: Date.now() * -1,
          text: newText,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        queryClient.setQueryData<Todo[]>(['todos'], (old) => [optimisticTodo, ...(old ?? [])]);
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
  - [x] `handleSubmit` function:
    ```ts
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || trimmed.length === 0) {
        setShaking(true);
        return;
      }
      mutate(trimmed, {
        onSuccess: () => {
          setText('');
          // refocus the input after clearing
        },
      });
    };
    ```
  - [x] After a successful mutation, clear `text` to `''` and refocus the input. Use a `ref` on the `Input` component: `const inputRef = React.useRef<HTMLInputElement>(null)` and call `inputRef.current?.focus()` in `onSuccess`
  - [x] The `Input` component uses `React.forwardRef` — pass the ref: `<Input ref={inputRef} ... />`

- [x] Task 4: Handle shake animation end (AC: 2)
  - [x] When `shaking` becomes `true`, use `onAnimationEnd` on the input — or a `useEffect` with a timeout — to reset it back to `false` after the animation completes so the shake can fire again on repeated empty submits:
    ```tsx
    <Input
      className={shaking ? 'shake' : ''}
      onAnimationEnd={() => setShaking(false)}
      ...
    />
    ```
  - [x] The `Input` component forwards all `...props` so `onAnimationEnd` will reach the underlying `<input>` element

- [x] Task 5: Integrate `TodoInput` into `App.tsx` above `TodoList` (AC: 1)
  - [x] Open `client/src/App.tsx`
  - [x] Import `TodoInput` from `./components/TodoInput`
  - [x] Render `<TodoInput />` above `<TodoList />` inside `<PageShell>`, separated by `var(--space-6)` gap:
    ```tsx
    export default function App() {
      return (
        <PageShell title="Todo">
          <TodoInput />
          <div style={{ height: 'var(--space-6)' }} />
          <TodoList />
        </PageShell>
      );
    }
    ```
  - [x] Alternatively, wrap both in a flex column container with `gap: var(--space-6)` — either approach is fine

- [x] Task 6: Verify with Chrome DevTools MCP (AC: 7)
  - [x] Start both server and client dev servers
  - [x] Navigate to `http://localhost:5173`
  - [x] Take a screenshot of the **default state** — confirm input is autofocused, placeholder `"Add a task…"` is visible, compound container has border and 8px radius
  - [x] Click into the input and take a screenshot of the **focused state** — confirm container border shifts to `var(--color-border-focus)` (`#94a3b8`)
  - [x] Type 400+ characters and take a screenshot showing the **character counter**
  - [x] Inspect the accessibility tree — confirm `<form>` with `aria-label="Add task form"`, `<input>` with `aria-label="Task text"`, `<button>` with accessible name `"Add"`
  - [x] Submit the form with a valid task — confirm the task is optimistically prepended to the list and the input clears

- [x] Task 7: Write RTL tests for `TodoInput` (AC: 8)
  - [x] Create `client/src/components/TodoInput.test.tsx`
  - [x] Mock `fetch` globally; provide `QueryClientProvider` wrapper
  - [x] Create `renderWithQuery` helper:
    ```tsx
    function renderWithQuery(ui: React.ReactElement) {
      const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
    }
    ```
  - [x] Test 1 — renders with autofocus and placeholder:
    - render `<TodoInput />`
    - assert `screen.getByPlaceholderText('Add a task…')` is in the document
    - assert the input is the focused element: `expect(document.activeElement).toBe(screen.getByPlaceholderText('Add a task…'))`
  - [x] Test 2 — empty submit does not call mutation:
    - mock `fetch` as `vi.fn()`
    - render `<TodoInput />`
    - `await userEvent.click(screen.getByRole('button', { name: 'Add' }))`
    - assert `fetch` was NOT called
  - [x] Test 3 — whitespace-only submit does not call mutation:
    - render `<TodoInput />`
    - `await userEvent.type(screen.getByPlaceholderText('Add a task…'), '   ')`
    - `await userEvent.click(screen.getByRole('button', { name: 'Add' }))`
    - assert `fetch` was NOT called
  - [x] Test 4 — valid submit calls mutation with trimmed text:
    - mock `fetch` to resolve with `{ ok: true, status: 201, json: async () => ({ id: 10, text: 'Buy milk', completed: false, createdAt: '...' }) }`
    - render `<TodoInput />`
    - `await userEvent.type(screen.getByPlaceholderText('Add a task…'), 'Buy milk')`
    - `await userEvent.click(screen.getByRole('button', { name: 'Add' }))`
    - assert `fetch` was called with `'/api/todos'`, method `'POST'`, body `JSON.stringify({ text: 'Buy milk' })`
  - [x] Test 5 — input clears after successful submit:
    - (continuing from Test 4 or a fresh render with mock)
    - after `await waitFor(() => expect(screen.getByPlaceholderText('Add a task…')).toHaveValue(''))`
  - [x] Test 6 — character counter appears at 400 chars:
    - render `<TodoInput />`
    - type a 400-character string: `await userEvent.type(input, 'a'.repeat(400))`
    - assert `screen.getByText('400/500')` is in the document
  - [x] Test 7 — submit blocked at 500 chars (button disabled):
    - type a 500-character string
    - assert `screen.getByRole('button', { name: 'Add' })` has the `disabled` attribute
    - assert `fetch` was NOT called when clicking the disabled button
  - [x] Run `npm run test --workspace=client` — must exit zero

## Dev Notes

### Current App.tsx (to be updated in Task 5)

```tsx
import { PageShell } from './components/PageShell';
import { TodoList } from './components/TodoList';

export default function App() {
  return (
    <PageShell title="Todo">
      <TodoList />
    </PageShell>
  );
}
```

After Task 5, `<TodoInput />` renders above `<TodoList />`.

### Input Component API

`client/src/components/ui/Input.tsx` is a `React.forwardRef` component that accepts all standard `HTMLInputElement` props. It applies its own inline border/bg styles. Inside `TodoInput`, override those to make the input visually borderless so only the compound container border shows:
```tsx
<Input
  ref={inputRef}
  style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none' }}
  placeholder="Add a task…"
  autoFocus
  ...
/>
```
The `Input` component spreads `...props` to the underlying `<input>`, so the `style` prop merges with (and overrides) its inline styles when passed — actually, since both `Input` and the passed `style` prop use the same `style` attribute, pass the override via the `style` prop and it will take precedence as the last assignment. Confirm this works in the browser (Task 6).

### Button Component API

`client/src/components/ui/Button.tsx` uses `cva` with `disabled:opacity-50` in the base class. The `disabled` attribute on the HTML button will trigger `pointer-events-none` and `opacity-50` automatically via Tailwind classes. For `isPending`, apply `cursor: not-allowed` explicitly since the `disabled` prop is only set when `text.length >= 500` during optimistic pending state — the button is not truly `disabled` during in-flight but should appear so.

Actually, set `disabled={isPending || text.length >= 500}` — this covers both cases cleanly. The `Button` component's `disabled:opacity-50` then handles the visual feedback.

### Optimistic Prepend Pattern

The optimistic todo uses a negative `Date.now() * -1` as a temporary `id`. After `invalidateQueries` fires on settled, the server response replaces the optimistic item with the real one from the server. The real item has a valid positive integer `id`.

This is safe because `TodoItem` keys by `todo.id` in `TodoList` — when the query refetches, React reconciles and replaces the optimistic item. No duplicate will appear as long as invalidation fires.

### `useRef` for Input Refocus

The `Input` component is `React.forwardRef`, so pass a `ref` to get access to the underlying `<input>` DOM node:
```tsx
const inputRef = React.useRef<HTMLInputElement>(null);
// ...
<Input ref={inputRef} ... />
// In onSuccess:
setText('');
inputRef.current?.focus();
```

### Character Counter Threshold

The counter shows at **400 chars** (80% of 500), not at 500. This gives the user advance notice before hitting the limit. At exactly 500 chars, the counter turns error color and the submit button is disabled.

### Shake Animation Reset

The `shake` CSS class triggers a 0.35s animation. After it ends, `onAnimationEnd` fires and sets `shaking` back to `false`. This allows repeated empty submits to each trigger the shake without getting stuck:
```tsx
<Input
  className={shaking ? 'shake' : ''}
  onAnimationEnd={() => setShaking(false)}
  ...
/>
```
The `Input` component passes through all event handlers and className via `React.forwardRef` and `...props`.

### `userEvent.type` Performance in Tests

Typing 400 or 500 characters with `userEvent.type` can be slow in tests. An alternative is to use `fireEvent.change` which is synchronous:
```ts
import { fireEvent } from '@testing-library/react';
const input = screen.getByPlaceholderText('Add a task…');
fireEvent.change(input, { target: { value: 'a'.repeat(400) } });
```
Either approach works; `fireEvent.change` is faster for large strings.

### Installed Packages (confirmed)

- `@testing-library/user-event@14.6.1` — installed
- `@tanstack/react-query@5.74.4` — installed
- All UI components from Stories 2.1–2.4 already exist

No new packages needed.

### Working Directory

All `npm` commands from the repo root. `npm run test --workspace=client` for client tests only.

### Definition of Done

- [x] `client/src/components/TodoInput.tsx` exists with compound container, `Input`, character counter, `Button`
- [x] Input is autofocused on render; placeholder `"Add a task…"`
- [x] Empty/whitespace submit shows shake animation, does not call mutation
- [x] Character counter appears at 400 chars; turns error color at 500; submit blocked at 500
- [x] Valid submit: optimistic prepend, input clears, input refocuses, mutation fires with trimmed text
- [x] On settled: `queryClient.invalidateQueries({ queryKey: ['todos'] })` called
- [x] Button `disabled` + `opacity: 0.5` + `cursor: not-allowed` when `isPending`
- [x] `globals.css` has `@keyframes shake`, `.shake`, and `.input-container:focus-within` rules
- [x] `App.tsx` renders `<TodoInput />` above `<TodoList />`
- [x] Chrome DevTools MCP screenshots confirm all states; accessibility tree has `aria-label="Add task form"`
- [x] `TodoInput.test.tsx` passes all 7 tests
- [x] `npm run test --workspace=client` exits zero
- [x] `npm run typecheck` from repo root exits zero

## Dev Agent Record

### Implementation Notes

- Added `id="todo-input"` and `name="text"` to the Input to resolve form field accessibility warning
- `Input` component spreads `{...props}` after its own inline `style`, so passing `style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none' }}` successfully overrides the default border
- Input's `onFocus`/`onBlur` handlers in the `Input` component apply outline styles directly to the DOM node — these are suppressed by the `outline: 'none'` in the passed style override (the `outline` set this way doesn't interfere since we also pass `outline: 'none'` in `style`)
- Optimistic prepend uses `Date.now() * -1` as temporary id; replaced by server on `invalidateQueries` settle

### Tests

- 25/25 tests passed (6 test files)
- `npm run typecheck` clean (client + server)

### Completion Date: 2026-04-10

## Review Findings

**Reviewed by:** GitHub Copilot (Claude Sonnet 4.6) — 2026-04-10
**Review mode:** full

### Patches Applied (1)

**P1 — `TodoInput.test.tsx`: `vi.restoreAllMocks()` in `beforeEach` does not clean up `vi.stubGlobal` stubs**
- `vi.restoreAllMocks()` only restores `vi.spyOn` mocks; it does not unstub globals set with `vi.stubGlobal`. A stale `fetch` stub from one test could leak into a subsequent test that doesn't re-stub it.
- Fix: replaced `beforeEach(() => vi.restoreAllMocks())` with `afterEach(() => vi.unstubAllGlobals())`, matching the pattern in `useTodos.test.tsx` and `TodoItem.test.tsx`.

### Dismissed (1)

- **D1** — `Input`'s `onFocus` focus-ring handler fires inside `TodoInput` but the `style={{ outline: 'none' }}` override applies on React re-renders (not on focus events), so no visible flicker. Intentional design where `input-container:focus-within` provides the visual focus signal instead.

### All ACs: ✅ Pass
