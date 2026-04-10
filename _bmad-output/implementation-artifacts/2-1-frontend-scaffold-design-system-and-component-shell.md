# Story 2.1: Frontend Scaffold, Design System & Component Shell

Status: done

## Story

As a developer,
I want the React frontend to start cleanly with a complete design token system, Tailwind CSS 4, and a PageShell component,
so that all subsequent UI stories have a consistent visual foundation ready to build on.

## Acceptance Criteria

1. **Given** `npm run dev` is run in `client/`, **When** the Vite 8.x dev server starts, **Then** the browser renders the app with no console errors; React 19.x, TanStack Query 5.x, and Tailwind CSS 4.x are all active
2. **Given** the Vite dev server is running, **When** a request is made to `/api/*`, **Then** Vite proxies it to `http://localhost:3000` transparently (added to `vite.config.ts`)
3. **Given** the app loads, **When** the browser parses `globals.css`, **Then** all 11 color tokens, the full typography scale, and spacing tokens are defined as CSS custom properties on `:root` and Tailwind CSS 4 is imported
4. **Given** the CSS loads, **When** the browser renders text, **Then** Sintony font is loaded via a Google Fonts `@import` with `font-display: swap`; the body `font-family` fallback stack is `'Sintony', 'Inter', system-ui, -apple-system, sans-serif`
5. **Given** shadcn/ui components are required, **When** the dev agent adds them, **Then** `Input`, `Button`, and `Checkbox` source files exist in `client/src/components/ui/` customized to use the project's CSS custom property tokens (not hardcoded colors)
6. **Given** `App.tsx` renders `<PageShell>`, **When** the browser displays the shell, **Then** it shows a centered layout with `max-width: 560px`, an `<h1>` title at `font-size: var(--text-lg)`, and a `1px solid var(--color-border)` horizontal divider below the heading
7. **Given** the app is running and PageShell is visible, **When** Chrome DevTools MCP takes a screenshot and inspects computed styles, **Then** `--color-bg` is `#f8fafc`, `--color-accent` is `#334155`, and Sintony appears as the first font in the `font-family` computed stack on `body`
8. **Given** the `PageShell` component exists, **When** the Vitest + RTL test suite runs, **Then** `PageShell.test.tsx` snapshot test passes and `npm run test --workspace=client` exits zero

## Tasks / Subtasks

- [x] Task 1: Configure Vite proxy (AC: 2)
  - [x] Open `client/vite.config.ts` — currently has `plugins: [react()]` only, no `server` block
  - [x] Add `server: { proxy: { '/api': 'http://localhost:3000' } }` to the Vite config
  - [x] Confirm the exported config still satisfies TypeScript (no type errors)

- [x] Task 2: Create `client/src/globals.css` with full design token system (AC: 3, 4)
  - [x] Create `client/src/globals.css` (rename/replace the existing empty `client/src/index.css` — update the import in `main.tsx` if renaming)
  - [x] First line: `@import "tailwindcss";` — this is Tailwind **v4** CSS-first config; there is **no** `tailwind.config.js`
  - [x] Second block: `@import url('https://fonts.googleapis.com/css2?family=Sintony:wght@400;700&display=swap');`
  - [x] Define all 11 color tokens on `:root`:
    ```css
    :root {
      --color-bg: #f8fafc;
      --color-surface: #ffffff;
      --color-border: #e2e8f0;
      --color-border-focus: #94a3b8;
      --color-text-primary: #0f172a;
      --color-text-secondary: #64748b;
      --color-text-disabled: #94a3b8;
      --color-accent: #334155;
      --color-accent-hover: #1e293b;
      --color-error: #e11d48;
      --color-error-subtle: #fff1f2;
    }
    ```
  - [x] Define typography tokens on `:root`:
    ```css
    :root {
      --text-xs: 0.75rem;
      --text-sm: 0.875rem;
      --text-base: 1rem;
      --text-lg: 1.125rem;
      --text-input: 1rem; /* fixed 16px — prevents iOS Safari zoom */
    }
    ```
  - [x] Define spacing tokens on `:root`:
    ```css
    :root {
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-6: 24px;
      --space-8: 32px;
    }
    ```
  - [x] Set global base styles on `body`:
    ```css
    body {
      font-family: 'Sintony', 'Inter', system-ui, -apple-system, sans-serif;
      background-color: var(--color-bg);
      color: var(--color-text-primary);
      font-size: var(--text-base);
    }
    ```

- [x] Task 3: Wrap app with `QueryClientProvider` in `main.tsx` (AC: 1)
  - [x] Open `client/src/main.tsx` — currently renders `<App />` in StrictMode with NO QueryClientProvider
  - [x] Import `QueryClient` and `QueryClientProvider` from `@tanstack/react-query`
  - [x] Create `const queryClient = new QueryClient()` before the render call
  - [x] Wrap `<App />` with `<QueryClientProvider client={queryClient}>` inside the existing `StrictMode`

- [x] Task 4: Add shadcn/ui component source files (AC: 5)
  - [x] Create directory `client/src/components/ui/`
  - [x] Add `Button.tsx` — shadcn/ui `Button` component using the project's CSS tokens:
    - Uses `--color-accent` for background, `--color-accent-hover` for hover background, `--color-surface` for text
    - Variant support: at minimum `default` (accent-filled) and `ghost` (transparent)
    - Use `cva` (class-variance-authority) if already installed; otherwise inline variant logic
    - Border radius: 6px
    - Padding: `var(--space-3)` vertical, `var(--space-4)` horizontal
  - [x] Add `Input.tsx` — shadcn/ui `Input` component using the project's CSS tokens:
    - Border: `1px solid var(--color-border)`
    - Focus ring: `outline: 2px solid var(--color-border-focus)` with `2px` offset
    - Font size: `var(--text-input)` (16px — prevents iOS Safari zoom)
    - Background: `var(--color-surface)`
    - Placeholder color: `var(--color-text-secondary)`
    - Border radius: 6px
    - Padding: `var(--space-2)` vertical, `var(--space-3)` horizontal
  - [x] Add `Checkbox.tsx` — shadcn/ui `Checkbox` using Radix UI `@radix-ui/react-checkbox`:
    - Uses `--color-accent` for checked fill background
    - Unchecked border: `1px solid var(--color-border)` on white background
    - Checked state uses a white checkmark SVG icon inside the accent-colored square
    - Size: 18×18px
    - Border radius: 4px
    - Focus ring: 2px offset, `--color-border-focus`
  - [x] Verify `@radix-ui/react-checkbox` is installed; if not run `npm install @radix-ui/react-checkbox --workspace=client`
  - [x] Check if `class-variance-authority` and `clsx` + `tailwind-merge` are installed for the shadcn/ui utilities; install if missing
  - [x] Create `client/src/lib/utils.ts` with the standard shadcn `cn()` helper:
    ```ts
    import { clsx, type ClassValue } from 'clsx';
    import { twMerge } from 'tailwind-merge';
    export function cn(...inputs: ClassValue[]) {
      return twMerge(clsx(inputs));
    }
    ```

- [x] Task 5: Create `PageShell` component (AC: 6)
  - [x] Create `client/src/components/PageShell.tsx`
  - [x] Props: `{ title: string; children: React.ReactNode }`
  - [x] Layout: centered container, `max-width: 560px`, `margin: 0 auto`
  - [x] Padding: `var(--space-8)` top/bottom, `var(--space-4)` left/right (mobile); `var(--space-8)` all sides (desktop via media query or Tailwind responsive class)
  - [x] Renders `<h1>` with `font-size: var(--text-lg)` and `font-weight: 500` using the `title` prop
  - [x] Renders a `<div>` or `<hr>` divider `1px solid var(--color-border)` below the heading
  - [x] Renders `{children}` below the divider
  - [x] Background of the inner content area: `var(--color-surface)` or transparent (page background is `--color-bg`)

- [x] Task 6: Update `App.tsx` to use `PageShell` (AC: 6)
  - [x] Import `PageShell` from `./components/PageShell`
  - [x] Replace the `<div>Todo App</div>` placeholder with `<PageShell title="Todo">` wrapping an empty fragment or placeholder `<p>` for now
  - [x] Current App.tsx content: `export default function App() { return <div>Todo App</div>; }`

- [x] Task 7: Verify with Chrome DevTools MCP (AC: 7)
  - [x] Dev server running at http://localhost:5174; Chrome DevTools MCP navigated to page
  - [x] Screenshot confirms PageShell visible: "Todo" h1 heading, 1px border divider, `--color-bg` (#f8fafc) background
  - [x] Computed CSS on `:root`: `--color-bg: #f8fafc` ✓, `--color-accent: #334155` ✓, `--color-border: #e2e8f0` ✓, `--color-surface: #ffffff` ✓, `--color-error: #e11d48` ✓
  - [x] Computed `font-family` on `body`: `Sintony, Inter, system-ui, -apple-system, sans-serif` — Sintony is first ✓
  - [x] Console messages: only 3 Vite HMR debug/info messages — zero errors ✓

- [x] Task 8: Write PageShell snapshot test (AC: 8)
  - [x] Create `client/src/components/PageShell.test.tsx`
  - [x] Import `render` from `@testing-library/react` and `{ describe, it, expect }` from `vitest`
  - [x] Test 1: snapshot — passes, snapshot written
  - [x] Test 2: heading present — `screen.getByRole('heading', { level: 1, name: 'My Heading' })` passes
  - [x] Test 3: children rendered — `screen.getByRole('button', { name: 'Click me' })` passes
  - [x] `npm test --workspace=client -- --run` exits 0, all 3 tests pass

## Dev Notes

### CRITICAL: Tailwind CSS v4 Differs From v3

**Tailwind 4 is already installed** (`tailwindcss@4.1.4`). The config is **CSS-first** — there is NO `tailwind.config.js` in this project.

The correct setup:
```css
/* globals.css — CORRECT for Tailwind v4 */
@import "tailwindcss";

/* Then your custom properties, fonts, etc. */
```

**Do NOT do any of the following** (v3 patterns that will break):
- Create `tailwind.config.js` or `tailwind.config.ts`
- Add `@tailwind base; @tailwind components; @tailwind utilities;` directives
- Use `content: [...]` configuration
- Add Tailwind PostCSS plugin separately — Vite 8 handles this automatically via `@tailwindcss/vite`

### shadcn/ui Install Method

shadcn/ui components are **copied into the project as source files**, not installed as an npm package. There is no `npx shadcn-ui init` or similar command — write the component source directly in `client/src/components/ui/`.

The components should use the project's CSS custom property tokens (`var(--color-accent)` etc.) rather than Tailwind color classes like `bg-slate-700`, to keep styling centralized in `globals.css`.

### Vite Proxy — Current State

`client/vite.config.ts` currently has NO proxy configured:
```ts
// current state
export default defineConfig({
  plugins: [react()],
})
```

After Task 1 it should have:
```ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
```

### main.tsx — Current State

Currently renders:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

After Task 3, `QueryClientProvider` must wrap `<App />`. Also update the CSS import if you rename `index.css` to `globals.css`.

### index.css / globals.css

The current `client/src/index.css` is **empty**. You can either:
- Rename it to `globals.css` and update the `main.tsx` import accordingly, OR
- Keep it as `index.css` and add all the CSS there

Either approach is fine; just be consistent with the import in `main.tsx`.

### App.tsx — Current State

```tsx
export default function App() {
  return <div>Todo App</div>
}
```

Replace with `PageShell`. This component will be incrementally built up through Stories 2.2–2.5.

### Installed Package Versions (confirmed)

| Package | Version |
|---|---|
| react | 19.2.4 |
| react-dom | 19.2.4 |
| vite | 8.0.4 |
| typescript | 5.8.3 |
| tailwindcss | 4.1.4 |
| @tanstack/react-query | 5.74.4 |
| vitest | 3.1.2 |
| @testing-library/react | 16.3.0 |
| @testing-library/jest-dom | 6.6.3 |

No package installs are needed for Tailwind, React, Vite, or TanStack Query. You may need to install:
- `@radix-ui/react-checkbox` (for the Checkbox component)
- `class-variance-authority` (for Button variants)
- `clsx` + `tailwind-merge` (for the `cn()` utility)

Check first with `cat client/package.json` before installing.

### Test Infrastructure (client)

- Test runner: Vitest 3.1.2
- Config: `client/vitest.config.ts`
- Setup file: `client/src/test-setup.ts` — already imports `@testing-library/jest-dom`
- Run command: `npm run test --workspace=client`
- Snapshot files land in `client/src/components/__snapshots__/` (auto-created by Vitest)

### Design System Reference

Color tokens (all 11):
- `--color-bg: #f8fafc` (slate-50) — page background
- `--color-surface: #ffffff` — inputs, cards
- `--color-border: #e2e8f0` (slate-200) — borders, dividers
- `--color-border-focus: #94a3b8` (slate-400) — focus rings
- `--color-text-primary: #0f172a` (slate-900) — headings, task text
- `--color-text-secondary: #64748b` (slate-500) — placeholders, metadata
- `--color-text-disabled: #94a3b8` (slate-400) — completed task text
- `--color-accent: #334155` (slate-700) — buttons, checkbox fill
- `--color-accent-hover: #1e293b` (slate-800) — hover states
- `--color-error: #e11d48` (rose-600) — error messages
- `--color-error-subtle: #fff1f2` (rose-50) — error background

Typography tokens:
- `--text-xs: 0.75rem` (12px, lh 1.5) — timestamps, metadata
- `--text-sm: 0.875rem` (14px, lh 1.5) — helper text, placeholders
- `--text-base: 1rem` (16px, lh 1.6) — task text (primary content)
- `--text-lg: 1.125rem` (18px, weight 500, lh 1.4) — app title / heading
- `--text-input: 1rem` (16px fixed — prevents iOS Safari zoom)

Spacing tokens:
- `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--space-8: 32px`

### Architecture References

- Architecture doc: `_bmad-output/planning-artifacts/architecture.md`
- UX spec: `_bmad-output/planning-artifacts/ux-design-specification.md` (§8 Design Tokens, §9 Component Library)
- Design direction: **Direction B — Structured** (card-per-task, white surface, slate palette)
- PageShell max-width: `560px`, centered via `margin: 0 auto`
- List items (later stories): white card `border: 1px solid var(--color-border)`, `border-radius: 6px`, padding `12px 14px`, `margin-bottom: 6px`

### Working Directory

All `npm` commands are run from the repo root unless specified. The monorepo uses npm workspaces (`client/` and `server/`).

### Definition of Done

- [x] `npm run dev --workspace=client` starts with no console errors
- [x] `/api/*` requests are proxied to `localhost:3000`
- [x] All 11 color tokens, typography tokens, and spacing tokens are in globals.css
- [x] Sintony font loads with `font-display: swap`
- [x] `Button.tsx`, `Input.tsx`, `Checkbox.tsx` exist in `client/src/components/ui/`
- [x] `PageShell.tsx` renders with correct max-width, heading, and divider
- [x] Chrome DevTools MCP confirms `--color-bg: #f8fafc`, `--color-accent: #334155`, Sintony first in font stack, zero console errors
- [x] `PageShell.test.tsx` snapshot test passes
- [x] `npm run test --workspace=client` exits zero (3 tests pass)
- [x] `npm run typecheck` from repo root exits zero

## Dev Agent Record

- **Completed by:** GitHub Copilot (Claude Sonnet 4.6)
- **Date:** 2025-01-15
- **Key decisions:**
  - Used inline `style` props (not Tailwind classes) for color tokens to keep tokens in `globals.css` as single source of truth
  - `Input` focus ring applied via `onFocus`/`onBlur` handlers because CSS-in-JS approach; avoids needing extra Tailwind plugin config for arbitrary CSS vars in focus ring
  - `App.tsx` uses empty fragment `<></>` as placeholder children (TypeScript strict mode rejects JSX-only comments as children)
  - Snapshot written in `client/src/components/__snapshots__/PageShell.test.tsx.snap`
- **Packages installed this story:** `@radix-ui/react-checkbox`, `class-variance-authority`, `clsx`, `tailwind-merge` (all in client workspace)

## Review Findings

**Reviewed by:** GitHub Copilot (Claude Sonnet 4.6) — 2026-04-09
**Review mode:** full

### Patches Applied (2)

**P1 — `Input.tsx`: `{...props}` spread overrode focus-ring handlers**
- `onFocus`/`onBlur` were declared explicitly but then spread again via `{...props}`, so any consumer passing these would silently replace the focus-ring wrappers.
- Fix: destructured `onFocus` and `onBlur` from props; removed them from the spread; called the forwarded handlers inside the wrapper.

**P2 — `Checkbox.tsx`: same spread-override bug; consumer `onFocus`/`onBlur` were never forwarded**
- Same root cause as P1, with the additional defect that consumer focus/blur handlers were swallowed even in normal usage (the original handlers had no `props.onFocus?.(e)` call).
- Fix: same pattern as P1 — destructured + forwarded both handlers.

### Dismissed (2)

- **D1** — Focus ring fires on click (not just keyboard), unlike Button's `focus-visible` approach. Intentional per dev notes.
- **D2** — `client/src/index.css` empty dead file not deleted. Harmless; out of scope for this story.

### All ACs: ✅ Pass
