# Story 6.2: Performance Testing & Analysis

Status: done

## Story

As a developer,
I want the running application profiled for performance bottlenecks,
So that any rendering or network issues are documented and resolved before delivery.

## Context & Analysis

### What to Measure

| Metric | Tool | Target |
|---|---|---|
| LCP (Largest Contentful Paint) | Lighthouse / Chrome DevTools MCP | ≤ 2.5s |
| CLS (Cumulative Layout Shift) | Lighthouse | ≤ 0.1 |
| INP (Interaction to Next Paint) | Lighthouse | ≤ 200ms |
| JS bundle size | Vite build output / DevTools Network | < 200KB gzipped total |
| Long tasks (>50ms) | Chrome DevTools Performance panel | Zero on initial load |
| Lighthouse Performance score | Lighthouse | ≥ 80 |
| Lighthouse Best Practices score | Lighthouse | ≥ 80 |
| Lighthouse SEO score | Lighthouse | ≥ 80 |

### Test Environment

All performance testing runs against the **Docker production stack** (`npm run docker:up:build`), not the Vite dev server. Dev server output is not representative of production performance (no minification, no tree-shaking, hot-reload overhead).

### Known Likely Findings

- **Bundle size**: Radix UI checkbox + React Query + React = ~150–200KB gzipped. Within budget but worth confirming.
- **CLS risk**: The 3-row skeleton loader transitioning to content could cause a layout shift if the skeleton height doesn't match the final item height. Worth measuring.
- **LCP**: On Docker + Nginx static serving, LCP should be fast (sub-second locally). Document the number.
- **SEO**: Missing `<meta name="description">` is a common easy miss. Check `index.html`.

---

## Acceptance Criteria

1. **Given** the Docker stack is running (`npm run docker:up:build`), **When** a Lighthouse audit is run against `http://localhost`, **Then** Performance, Best Practices, and SEO scores are each ≥ 80; all scores are recorded in the dev notes below.

2. **Given** the Lighthouse audit output, **When** any score is below 80, **Then** the specific failing audits are identified and remediated (e.g. missing `<meta>` tag, render-blocking resource, large image).

3. **Given** a Chrome DevTools MCP Performance trace of a page load and a create-todo interaction, **When** the trace is analyzed, **Then** the report documents: LCP value, presence/absence of long tasks, and any main-thread blocking during the create-todo flow.

4. **Given** the Vite build output (`npm run build --workspace=client`), **When** bundle sizes are reviewed, **Then** the total gzipped JS is documented; any chunk > 100KB gzipped is identified and evaluated for code-splitting.

---

## Tasks / Subtasks

### Task 1: Build production images and start stack (AC: 1, 3)

```bash
npm run docker:up:build
# Wait for health: docker compose ps → server should show (healthy)
```

### Task 2: Run Lighthouse audit via Chrome DevTools MCP (AC: 1, 2)

Use the `mcp_chrome-devtool_lighthouse_audit` tool targeting `http://localhost`.

Record scores in dev notes. For any score < 80, identify the specific failing audits and apply fixes:
- Missing `<meta name="description">` → add to `client/index.html`
- Missing `<meta name="viewport">` → add to `client/index.html` if absent
- Any render-blocking resource → investigate and defer/preload

Re-run Lighthouse after fixes to confirm improvement.

### Task 3: Performance trace via Chrome DevTools MCP (AC: 3)

Use `mcp_chrome-devtool_performance_start_trace` / `mcp_chrome-devtool_performance_stop_trace`:
1. Trace page load at `http://localhost`
2. Trace a create-todo interaction (type text, press Enter)

Use `mcp_chrome-devtool_performance_analyze_insight` to identify long tasks and main-thread blocking.

### Task 4: Check bundle size (AC: 4)

```bash
npm run build --workspace=client
# Vite prints chunk sizes with gzip estimates
```

Record in dev notes. If total gzipped JS > 200KB, investigate which chunk is oversized. Common fix: lazy-load routes (not applicable here — single page) or check for accidental inclusion of dev dependencies.

### Task 5: Save report to docs/ (AC: all)

Once all scores and findings are recorded in the Dev Notes section below, save the completed section as a standalone report:

```bash
# Copy the Dev Notes section into docs/performance-report.md
```

The file `docs/performance-report.md` should contain the baseline scores table, any fixes applied, and bundle size findings.

---

## Dev Notes — Performance Findings

### Baseline Scores

| Metric | Score / Value | Pass? |
|---|---|---|
| Lighthouse Performance | 86 | ✅ |
| Lighthouse Best Practices | 100 | ✅ |
| Lighthouse SEO | 100 | ✅ |
| LCP (DevTools, unthrottled) | ~78 ms | ✅ |
| LCP (Lighthouse simulated 3G) | 3.4 s | ⚠️ above 2.5s CWV |
| CLS | 0 | ✅ |
| TBT (INP proxy) | 20 ms | ✅ |
| API round-trip POST /api/todos | ~51 ms | ✅ |
| Long tasks on initial load | 0 | ✅ |
| Total JS gzipped | 85.32 kB | ✅ |

### Issues Found & Remediations

| Issue | Fix | Result |
|---|---|---|
| Missing `<meta name="description">` | Added to `client/index.html` | SEO 82 → 100 |
| Missing `robots.txt` | Created `client/public/robots.txt` | SEO 100 |
| No Nginx cache headers for assets | Added `Cache-Control: max-age=31536000, immutable` for `/assets/` in `nginx.conf` | Cache audit pass |
| Google Fonts render-blocking `@import` | Moved to async `<link rel="preload">` + `preconnect` hints in `index.html`; removed `@import` from `globals.css` | Performance 83 → 86; LCP 3.6s → 3.4s |

### Files Modified
- `client/index.html` — added meta description, preconnect hints, async font loading
- `client/public/robots.txt` — new file
- `client/nginx.conf` — added `/assets/` cache block
- `client/src/globals.css` — removed Google Fonts `@import`
- `docs/performance-report.md` — full report saved
