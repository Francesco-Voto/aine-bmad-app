# Pre-Epic 4 Task: Install `@vitest/coverage-v8`

Status: done

## Story

As a developer,
I want `npm run test:coverage` to produce a coverage report for the client unit tests,
So that we can see our unit test coverage percentage before starting Epic 4.

## Background

`@vitest/coverage-v8` has been deferred since Epic 1's retrospective and carried through Epic 2 without action. The `client/package.json` has `vitest` installed but no coverage provider. Running `vitest --coverage` currently fails with a missing provider error.

Epic 4 begins accessibility and keyboard testing work — having baseline coverage visible helps confirm that any new RTL tests in 4.x stories are actually adding coverage.

## Acceptance Criteria

1. **Given** `@vitest/coverage-v8` is installed, **When** `npm run test:coverage --workspace=client` is run from the monorepo root, **Then** the command exits 0 and prints a coverage table to stdout showing per-file coverage percentages.

2. **Given** the coverage configuration, **When** the report runs, **Then** it covers all files in `client/src/` — components, hooks, and API files.

3. **Given** the existing test suite (37+ tests across 7+ test files), **When** coverage runs, **Then** no existing test breaks and the suite still passes.

4. **Given** the `vite.config.ts`, **When** the coverage provider is configured, **Then** it uses the `v8` provider (not `istanbul`) — `v8` is the Vite-native provider requiring no Babel transform.

---

## Tasks / Subtasks

- [ ] Task 1: Install `@vitest/coverage-v8` in `client/devDependencies`
  - [ ] From monorepo root:
    ```
    npm install --save-dev @vitest/coverage-v8 --workspace=client
    ```
  - [ ] Confirm the package appears in `client/package.json` under `devDependencies`

- [ ] Task 2: Configure coverage in `client/vite.config.ts`
  - [ ] Add a `test` block to the existing `defineConfig` in `client/vite.config.ts`:
    ```ts
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      server: {
        proxy: {
          '/api': 'http://localhost:3000',
        },
      },
      test: {
        environment: 'jsdom',
        coverage: {
          provider: 'v8',
          include: ['src/**/*.{ts,tsx}'],
          exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
        },
      },
    });
    ```
  - [ ] **Note:** If `environment: 'jsdom'` is already configured elsewhere (e.g., in a `vitest.config.ts` or as a vite plugin), keep it consistent with existing config — avoid duplicating it. Check existing config before adding.
  - [ ] The `include` glob covers all source files; `exclude` removes the app entry point and type declaration file which have no meaningful coverage to measure.

- [ ] Task 3: Add `test:coverage` script to `client/package.json`
  - [ ] Add to the `scripts` block:
    ```json
    "test:coverage": "vitest run --coverage"
    ```
  - [ ] Optionally add to root `package.json` scripts for convenience:
    ```json
    "test:coverage": "npm run test:coverage --workspace=client"
    ```

- [ ] Task 4: Verify
  - [ ] Run `npm run test:coverage --workspace=client` — exits 0, prints coverage table
  - [ ] Run `npm run test --workspace=client` — all existing tests still pass (no regressions)

---

## Dev Notes

### Why `v8` not `istanbul`

`@vitest/coverage-v8` uses Node's built-in V8 coverage engine — no Babel transform required, works natively with Vite's Rollup pipeline. `@vitest/coverage-istanbul` requires `@babel/core` which adds dependency weight and can conflict with the project's `esbuild`-based transform. Always prefer `v8` for Vite projects.

### Existing `vite.config.ts` structure

Current file:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

The `test` block is added alongside `plugins` and `server` — it is a Vitest-specific extension to Vite's config that Vite ignores when building.

### Coverage target expectation

This task does NOT set a coverage threshold (no `thresholds` config). The goal is to get visibility, not enforce a gate. Epic 4 and 5 stories will decide if a threshold is appropriate.

### Files to Change

| File | Action |
|---|---|
| `client/package.json` | Modify — add `@vitest/coverage-v8` to devDependencies; add `test:coverage` script |
| `client/vite.config.ts` | Modify — add `test.coverage` config block |
| `package.json` (root) | Modify (optional) — add `test:coverage` workspace shortcut |

No component or test file changes.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log
