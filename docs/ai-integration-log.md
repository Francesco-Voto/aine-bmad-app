# AI Integration Log — Todo App

**Project:** Todo App  
**Methodology:** BMAD (Business-Minded AI Development)  
**Date range:** 9 April 2026 – 13 April 2026  
**Total epics delivered:** 6 (plus 4 pre-epic tasks)  
**Total stories delivered:** 22 + 4 pre-sprint tasks

---

## Overview

This document logs how AI — through the BMAD multi-agent framework — was used throughout the full project lifecycle: from the initial product brief through planning, architecture, story-level implementation, testing, and Quality Assurance. It covers which agents and MCP servers were used, how test generation worked, where AI-assisted debugging was successful, and where human judgement was essential.

---

## 1. Agent Usage

BMAD orchestrates work through specialized persona agents. Each agent has a defined scope and a preferred prompt structure ("skill"). The table below maps every major task to the agent that completed it.

| Phase | Task | Agent | Skill Invoked |
|---|---|---|---|
| Discovery | Product brief, user journeys, scope decisions | Mary (Analyst) | `bmad-agent-analyst` |
| Planning | PRD creation (33 FRs, 13 NFRs) | John (PM) | `bmad-create-prd` |
| Design | UX specification and component layout | Sally (UX Designer) | `bmad-create-ux-design` |
| Architecture | Technology selection, ADRs, data model, deployment diagram | Winston (Architect) | `bmad-create-architecture` |
| Sprint planning | Epic and story breakdown, sprint-status.yaml | Bob (Scrum Master) | `bmad-create-epics-and-stories`, `bmad-sprint-planning` |
| Story creation | Per-story spec files with tasks, ACs, dev notes | Bob (Scrum Master) | `bmad-create-story` |
| Implementation (all epics) | Writing code for all 22 stories | Amelia (Dev) | `bmad-dev-story` |
| Code review | Post-story adversarial review, deferred-work.md | Quinn (QA) | `bmad-code-review` |
| Retrospectives | Epic retrospectives (Epic 2, Epic 5) | Bob (Scrum Master) | `bmad-retrospective` |
| QA coverage | Test coverage analysis, gap identification | Quinn (QA) | `bmad-agent-qa` |
| Security review | OWASP-aligned security scan and remediation | Amelia (Dev) + Quinn (QA) | `bmad-quick-dev` |
| Documentation | Project context file and implementation readiness report | Paige (Tech Writer) | `bmad-document-project`, `bmad-check-implementation-readiness` |

### Prompts That Worked Best

**Epic-level planning:** Providing the full PRD, architecture, and UX spec as attached context before asking Bob to generate epics produced story breakdowns that required minimal human rework. The key was always front-loading all three documents before any story creation prompt.

**Story implementation with Amelia:** The most reliable prompt pattern was:
> "Dev this story [story file path]"

When context window pressure was high, explicitly adding:
> "The current sprint context file is sprint-status.yaml. The project context is project-context.md. Only implement what is in the story file — do not refactor adjacent code."

…reduced scope creep and unnecessary "improvements" significantly.

**Code review with Quinn:** The adversarial framing ("assume the code is wrong — find at least three issues") consistently surfaced real bugs. More neutral prompts produced confirmatory reviews that missed the TypeScript typing issues catalogued in `deferred-work.md`.

**Retrospectives with Bob:** Providing the completed story files plus the dev notes sections produced retrospectives that accurately identified the patterns (e.g. the optimistic mutation template, the two RTL test strategies) as project standards.

---

## 2. MCP Server Usage

Several MCP servers were active throughout the project. Each served a distinct purpose.

### `mcp_chrome-devtoo` (Chrome DevTools MCP)

Used extensively during **Epic 6 (Quality Assurance)**.

| Task | Tool Used | Outcome |
|---|---|---|
| Lighthouse performance audit (Story 6.2) | `lighthouse_audit` | Scores recorded: Performance 86, Best Practices 100, SEO 100, Accessibility 100. LCP 3.4s under simulated 3G (throttle artifact; 78ms unthrottled) documented in `docs/performance-report.md`. |
| Core Web Vitals measurement (Story 6.2) | `performance_start_trace` / `performance_stop_trace` / `performance_analyze_insight` | TTFB ~5ms, LCP ~78ms, zero long tasks on initial load, POST `/api/todos` round-trip ~51ms — all within NFR targets. |
| Lighthouse accessibility audit (Story 6.3) | `lighthouse_audit` | Score 100/100 confirmed against Docker production stack at `http://localhost`. |
| Accessibility tree inspection (Story 6.3) | `take_snapshot` | Confirmed landmark structure: one `<main>`, `<ul role="list">`, `<button>` for each action element. Identified that the `aria-busy` attribute was on the wrong element (a skeleton child rather than the `aria-live` container) — fix applied in Story 4.3. |
| Screenshot capture (Story 6.2, 6.3) | `take_screenshot` | Used to document the populated state and the error state for the audit trail. |

**How it helped:** The DevTools MCP made it possible to run objective, machine-readable audits without leaving the agent workflow. Attempting to assess performance visually from dev server output would have been unreliable; the MCP produced reproducible numbers against the Docker production stack.

### `mcp_postman`

Used during **Epic 1, Story 1.3** (CRUD API Endpoints, Tests & Postman Collection).

| Task | Tool Used | Outcome |
|---|---|---|
| API contract collection creation | `createCollection`, `createCollectionFolder`, `createCollectionRequest` | Full Postman collection created at `postman/todo-app.collection.json` covering all 5 endpoints (GET /todos, POST /todos, PATCH /todos/:id, DELETE /todos/:id, GET /health). |
| Environment setup | `createEnvironment` | `base_url` variable set to `http://localhost:3000` for local dev and `http://localhost` for Docker stack. |

**How it helped:** The Postman collection became the living contract between frontend and backend teams. Having the MCP generate it directly from the story spec meant the collection matched the actual implementation rather than drifting from a manually maintained spec.

### GitHub Copilot (Inline — VS Code)

Used throughout all epics as a secondary tool for:
- Autocompletion inside implementation created by the BMAD dev agent
- Quick one-off edits (renaming symbols, fixing typos surfaced by lint)
- Real-time error checking via `get_errors` tool after each story file was written

---

## 3. Test Generation

### E2E Tests (Playwright) — Story 3.5

Story 3.5 asked Amelia to generate the complete Playwright E2E suite covering 7 user journey scenarios. The agent produced:

| File | Covers | Generated correctly? |
|---|---|---|
| `e2e/tests/add-todo.spec.ts` | Create task, input clears, persists on reload | ✅ Yes |
| `e2e/tests/empty-state.spec.ts` | Empty state message when no todos exist | ✅ Yes |
| `e2e/tests/complete-todo.spec.ts` | Toggle completion, visual strike-through, persists on reload | ✅ Yes |
| `e2e/tests/delete-todo.spec.ts` | Delete on hover, removal from list, absent after reload | ✅ Yes |
| `e2e/tests/persistence.spec.ts` | Data survives full page reload | ✅ Yes |
| `e2e/tests/mobile-layout.spec.ts` | 375×812 viewport — no horizontal scroll, no overflow | ✅ Yes |
| `e2e/tests/error-state.spec.ts` | `GET /api/todos` intercepted → error state + Retry button | ✅ Yes |
| `e2e/fixtures/db.ts` | `resetDb()` / `seedTodo()` helpers using direct API calls | ✅ Yes |

**What AI did well:** The fixture helper pattern (`resetDb` calling `DELETE` on each seeded todo rather than using a test database) was independently reasoned out by the agent. The agent also correctly chose to target `http://localhost:3000` directly (bypassing the Vite proxy) for database reset calls — an important correctness detail.

**What AI missed:** The first generated version of `error-state.spec.ts` used `page.route()` to intercept network requests but did not restore the original route handler after the retry assertion. This meant the retry test was actually hitting the mock a second time. The bug was caught during the code review pass (Quinn) and fixed before the story was marked done.

### Unit Tests (Vitest + RTL) — Stories 2.3 – 2.5, 3.1 – 3.4

Amelia generated unit test files alongside each component. Two reliable test patterns emerged that the agent followed consistently:

**Pattern 1 — `vi.mock` hook strategy:** Used for `TodoList` (read-only, driven by `useTodos`). The agent correctly identified that mocking the hook was sufficient and that wrapping in a `QueryClientProvider` was unnecessary overhead.

**Pattern 2 — `renderWithQuery` + `vi.stubGlobal('fetch')` strategy:** Used for `TodoItem` and `TodoInput` (mutations + `useQueryClient`). The agent correctly flagged that any component calling `useQueryClient()` must use `renderWithQuery()` or the test crashes silently.

**What AI did well:** Test files were comprehensive across happy paths, error paths, optimistic rollback, and edge cases (empty input, whitespace-only, 500-char boundary). The coverage hit ≥ 70% on the first pass for all component files.

**What AI missed in initial passes:**
- `App.tsx` had no unit test generated (noted in Story 6.1's gap analysis table). The agent treated it as integration-covered by E2E and did not create a dedicated unit test.
- `api/todos.ts` (the API wrapper module) had no direct unit tests. The agent tested it indirectly through component tests that mock `fetch`, but the wrapper's own error handling branches were never exercised in isolation.
- Branch coverage for the `TodoItem` collapse animation CSS class toggle was not covered — this wasn't a behaviour the agent recognised as independently testable without visual assertions.

### Accessibility Tests (axe-core) — Story 6.3

The agent integrated `@axe-core/playwright` into the E2E suite and ran scans across three states (empty, populated, error). Zero violations with serious or critical impact were found in the final scan, confirming that Epic 4's ARIA work was complete.

**What AI did well:** The agent proactively scanned multiple application states rather than just the default page load, which is the common failure mode for axe integrations.

**What AI missed:** The initial axe integration used `checkA11y()` without configuring the `runOnly` rules parameter. This caused the scan to report a large number of "incomplete" results (rules axe couldn't confidently pass or fail) alongside the violations, making the output harder to triage. A human reviewer added `runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }` to filter to the relevant rule set.

---

## 4. Debugging with AI

### Case 1: Nginx Docker DNS Resolution Failure (Story 5.3)

**Problem:** The initial `nginx.conf` used `proxy_pass http://server:3000/api/` directly. When the Docker stack started, Nginx resolved the `server` hostname at startup time. If the `server` container was not yet resolvable (race condition during `docker-compose up`), the proxy silently failed — all API requests returned 502 without any error in the Nginx log.

**AI involvement:** The BMAD dev agent (Amelia) identified the root cause during the Story 5.3 implementation review: Nginx's default DNS resolution happens once at configuration load, not per-request. The fix — using Docker's embedded resolver (`resolver 127.0.0.11 valid=30s`) and a `set $backend` variable to defer resolution to request time — was proposed and implemented by the agent without human prompting.

**Outcome:** Fix applied in `client/nginx.conf`. Documented in the Epic 5 retrospective as a Docker networking subtlety not capturable in the original story spec.

### Case 2: Tailwind v4 CSS-First Configuration (Story 2.1)

**Problem:** The project used Tailwind CSS v4, which introduced a breaking CSS-first configuration model (`@import "tailwindcss"` replacing `tailwind.config.js`, `@theme` blocks, `[property:var(--token)]` syntax for arbitrary properties). The BMAD agent's initial scaffolding attempted to use v3 patterns, producing a stylesheet that applied no utility classes.

**AI involvement:** Once the agent was prompted with the explicit fact that v4 was in use and its key breaking changes, it correctly refactored the CSS, defined the 11 design tokens in an `@theme` block, and documented the differences in the story dev notes for future reference.

**Outcome:** The v4 orientation cost approximately half a story's worth of rework in Story 2.1. All subsequent stories (2.3–4.4) required no Tailwind configuration corrections.

### Case 3: `aria-busy` on Wrong Element (Story 4.3)

**Problem:** The `TodoList` component set `aria-busy="true"` on a skeleton `<div>` child during loading, but not on the `aria-live="polite"` container element itself. Screen readers require `aria-busy` on the live region element to suppress announcements during loading.

**AI involvement:** The bug was found by the BMAD agent during the Story 4.3 ARIA audit, cross-referencing the ARIA spec against the current component tree. The agent generated the exact diff needed (moving `aria-busy` to the outer `<div aria-live="polite">` and making it dynamic based on `isLoading`).

**Outcome:** Fix applied. Accessibility score confirmed at 100/100 post-fix.

### Case 4: `renderWithQuery` Migration (Story 3.4)

**Problem:** Story 3.4 added a retry mechanism to `TodoList`, which required `useQueryClient()` inside the component. Existing `TodoList` tests used bare `render()` without a `QueryClientProvider`. After the refactor, tests failed silently with "No QueryClient set" errors that were easily confused with component logic failures.

**AI involvement:** The agent correctly identified the failure mode from the error message, cross-referenced the RTL testing strategy documented in `project-context.md`, and migrated all existing `TodoList` tests from bare `render()` to `renderWithQuery()` as part of the story implementation — without being explicitly instructed to do so.

**Outcome:** Test suite green after migration. The pattern was documented in `project-context.md` as a project rule: `"If a component is refactored to add useQueryClient(), ALL existing tests for that component must be updated."`.

### Case 5: TypeScript Non-Optional `db` Declaration (Deferred)

**Problem:** `FastifyInstance` was augmented with `db: Database.Database` (non-optional). The decoration only happens when the DB init succeeds at startup. If DB init fails silently, CRUD handlers access `app.db` with type safety but crash at runtime. TypeScript provides no warning.

**AI involvement:** The code review agent (Quinn) identified this as a type-safety gap during the Story 1.2 review. The issue was logged in `deferred-work.md` twice (from reviews of Story 1.2 and 1.3) as a recurring concern.

**Outcome:** The fix was deferred — the agent correctly judged that the right resolution (optional decoration with an explicit DB-unavailable error path) was a larger refactor requiring a dedicated story. The deferral log is documented in `_bmad-output/implementation-artifacts/deferred-work.md`. **Human judgement was required** to make the explicit risk-acceptance decision to ship with the known gap.

---

## 5. Limitations Encountered

### 5.1 Framework Version Drift

**What AI struggled with:** BMAD agents have strong knowledge of stable framework versions. Tailwind CSS v4 (released late 2024) and Fastify v5 (released late 2024) introduced breaking changes that the agent's knowledge did not fully reflect. In both cases, the agent needed explicit correction before producing correct code.

**Where human expertise was critical:** Knowing _which_ versions were installed (from `package.json`) and understanding the specific breaking change surface (v4 CSS-first model for Tailwind, v5 plugin API for Fastify) was necessary to write a precise correction prompt.

### 5.2 Docker/Nginx Operational Subtleties

**What AI struggled with:** Story 5 exposed multiple Docker/Nginx behaviours that are not well-represented in documentation and must be learned operationally:
- Build context must be the monorepo root for workspaces, not the individual service directory
- Nginx's `USER` directive conflicts with the master process needing to bind port 80
- Named volumes avoid host permission issues that bind mounts expose for non-root container users

**Where human expertise was critical:** The story templates written by Bob (Scrum Master) initially encoded incorrect assumptions on all three points, producing Dockerfiles that failed on first build. A developer familiar with Docker's layer caching semantics and user/permission model was needed to identify the root causes before the agent could fix them.

### 5.3 Test Gap Awareness

**What AI struggled with:** The agent did not spontaneously identify that `App.tsx` and `api/todos.ts` had no unit tests. Coverage gaps at the module level (as opposed to branch coverage within a tested module) were only discovered when Story 6.1 explicitly asked for a gap analysis against the coverage report.

**Where human expertise was critical:** Knowing _what kind_ of coverage matters for the project (branch coverage vs. integration coverage vs. E2E coverage) required human framing. The agent was reliable at implementing tests once the gap was identified, but not at proactively auditing for untested units.

### 5.4 Deferral Decision-Making

**What AI struggled with:** The agent consistently flagged technical debt and deferred issues (e.g. the non-optional `db` type, the `@vitest/coverage-v8` missing package, the ARIA label discrepancy) in code review and dev notes. However, it did not make risk-acceptance decisions. It logged problems and left the decision open.

**Where human expertise was critical:** Deciding which deferred items were acceptable to ship (because the failure path was recoverable) and which required immediate remediation (because they could cause silent data loss or security exposure) was a product/engineering judgment call that required the project lead.

### 5.5 Multi-Step Interdependency Reasoning

**What AI struggled with:** When a story had a subtle dependency on a decision made in a much earlier story (e.g. Nginx DNS resolution depending on `server/Dockerfile`'s non-root user setup, which depended on the named volume decision), the agent sometimes missed the chain on the first pass.

**Where human expertise was critical:** Architecture-level reasoning about multi-service interactions during development (not at design time) required a human to hold the full system state in mind and prompt the agent with the relevant context from prior stories.

### 5.6 Performance Under Simulated Throttle

**What AI struggled with:** The Lighthouse LCP of 3.4s under simulated 3G throttle was initially flagged as a failing metric. The agent correctly identified the bottleneck (render-blocking Google Fonts CSS, 311ms under throttle) but recommended self-hosting fonts as a fix — a change that would alter the visual design outside the scope of the project.

**Where human expertise was critical:** Distinguishing between a real-world performance issue (which the unthrottled 78ms LCP figure showed was not a problem) and a synthetic test artifact required human judgment. The decision to document the discrepancy rather than change the design was made by the project lead.

---

## Summary

| Category | AI Strength | Human Critical |
|---|---|---|
| Agent usage | Consistent output when given scoped, well-formed story files | Defining story scope; deciding what to defer |
| MCP usage | Producing machine-readable audits (Lighthouse, axe, Postman) that would otherwise require manual tooling | Interpreting ambiguous results (throttled vs. unthrottled LCP) |
| Test generation | Happy paths, error paths, optimistic rollback, fixture helpers | Identifying which modules need unit tests vs. relying on E2E coverage |
| Debugging | Root cause identification for well-documented problems (ARIA, React Query patterns) | Novel failure modes in Docker networking, framework version boundaries |
| Limitations | Reliable self-logging of deferred issues and technical debt | Risk-acceptance decisions; framework version boundary knowledge |
