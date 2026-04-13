# Accessibility Audit Report — WCAG 2.1 AA

**Date:** 2026-04-13
**Environment:** Docker production stack (`npm run docker:up:build`) — Nginx 1.29 serving minified Vite build
**Target URL:** http://localhost
**Tools:** Lighthouse MCP (desktop, navigation mode) · axe-core/playwright v4.11 (`wcag2a`, `wcag2aa` tags) · Chrome DevTools accessibility tree snapshot

---

## Lighthouse Accessibility Score

| Run | Score | Pass (≥ 95)? |
|---|---|---|
| Baseline | 100 | ✅ |

Zero failing audits. All 48 audits passed.

---

## Accessibility Tree Observations

Snapshot captured via Chrome DevTools MCP against the populated-list state.

| Expectation | Observed | Pass? |
|---|---|---|
| Page has a level-1 heading | `heading "Todo" level="1"` | ✅ |
| One `<main>` landmark | `main` role present | ✅ |
| Live region for todo list | `generic live="polite" relevant="additions text"` | ✅ |
| Form has accessible name | `form "Add a task"` | ✅ |
| Input has accessible name | `textbox "Task text"` | ✅ |
| Add button has accessible name | `button "Add"` | ✅ |
| Each todo has a labelled checkbox | `checkbox "Complete: <task text>"` | ✅ |
| Each todo has a labelled delete button | `button "Delete: <task text>"` | ✅ |

No structural issues. Landmark structure, list semantics, and interactive element labelling are all correct.

---

## axe-core Results

Spec: `e2e/tests/accessibility.spec.ts` — 3 tests, tags `wcag2a` + `wcag2aa`, run against Docker production stack.

| State | Pass? | Violations (serious/critical) |
|---|---|---|
| Empty list | ✅ | 0 |
| Populated list (2 active todos) | ✅ | 0 |
| Completed todo state | ✅ | 0 |

---

## Issue Found & Remediated

### `color-contrast` — serious (WCAG 1.4.3 AA)

| Field | Value |
|---|---|
| Rule | `color-contrast` |
| Impact | serious |
| Element | `.todo-text` (completed todo `<span>`) |
| Root cause | `color: var(--color-text-disabled)` (`#94a3b8`) combined with `opacity: 0.6` produced an effective contrast of **2.26:1** against `#ffffff` (required: 4.5:1) |

**Fix applied:**
- `client/src/globals.css`: darkened `--color-text-disabled` from `#94a3b8` to `#6b7280` (4.6:1 on white)
- `client/src/components/TodoItem.tsx`: removed `opacity: 0.6` from completed text style
- `client/src/components/TodoItem.test.tsx`: removed the `opacity` assertion to match

**Result:** contrast ratio 2.26:1 → **4.6:1** ✅ — axe `color-contrast` violation resolved.

---

## Summary

| Check | Result |
|---|---|
| Lighthouse Accessibility | **100** ✅ |
| axe — empty state | **0 violations** ✅ |
| axe — populated state | **0 violations** ✅ |
| axe — completed state | **0 violations** ✅ |
| Accessibility tree structure | **Correct** ✅ |

Zero outstanding violations. All WCAG 2.1 AA checks pass.
