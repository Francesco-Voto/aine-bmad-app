# Pre-Epic 4 Task: Fix Server `npm run dev` Exit Code 1

Status: done

## Story

As a developer,
I want `npm run dev --workspace=server` to start reliably without a `.env` file,
So that `npm run test:e2e` passes from a cold start in CI and locally without manual server setup.

## Background

The server `index.ts` calls `process.exit(1)` if `PORT` or `DB_PATH` env vars are not set. These values come from `server/.env`, which is gitignored and therefore absent in CI. When Playwright's `webServer` tries to start the server with `npm run dev --workspace=server`, the process exits immediately with code 1 before Fastify can listen on `http://localhost:3000/health`.

Locally, `reuseExistingServer: !process.env.CI` is `true`, so Playwright reuses a manually-started server session — masking the problem. In CI (`process.env.CI = true`), `reuseExistingServer` is `false`, so Playwright starts fresh, hits exit code 1, and the entire `test:e2e` run aborts.

The terminal already shows this: `npm run dev` in `server/` → Exit Code: 1.

## Acceptance Criteria

1. **Given** no `server/.env` file exists (CI condition), **When** `npm run dev --workspace=server` runs, **Then** the server starts on the default port (3000) and `http://localhost:3000/health` returns 200 within Playwright's timeout window.

2. **Given** a `server/.env` file does exist with `PORT` and `DB_PATH` values, **When** `npm run dev --workspace=server` runs, **Then** those values override the defaults — existing local dev workflow is unaffected.

3. **Given** `npm run test:e2e` is run with all servers stopped, **When** Playwright starts both webServers fresh, **Then** the suite completes with exit code 0 (cold-start E2E pass).

4. **Given** the `DB_PATH` default, **When** the server writes to SQLite, **Then** the path resolves correctly relative to the working directory that `npm run dev --workspace=server` uses (the `server/` package directory).

---

## Tasks / Subtasks

- [ ] Task 1: Add defaults for `PORT` and `DB_PATH` in `server/src/index.ts`
  - [ ] Change:
    ```ts
    const PORT = process.env.PORT;
    const DB_PATH = process.env.DB_PATH;

    if (!DB_PATH) {
      console.error('Fatal: DB_PATH environment variable is not set');
      process.exit(1);
    }

    if (!PORT) {
      console.error('Fatal: PORT environment variable is not set');
      process.exit(1);
    }
    ```
    To:
    ```ts
    const PORT = process.env.PORT ?? '3000';
    const DB_PATH = process.env.DB_PATH ?? './dev.db';
    ```
  - [ ] Remove the two `if (!DB_PATH)` and `if (!PORT)` fatal exit blocks entirely
  - [ ] Verify the default `DB_PATH` value matches where the SQLite file actually lives relative to the `server/` directory. Check: does `server/dev.db` exist at the repo root level of `server/`? If so `./dev.db` is correct. If it lives in `server/data/`, use `./data/dev.db`.

- [ ] Task 2: Create `server/.env.example` documenting required vars
  - [ ] Create `server/.env.example`:
    ```
    PORT=3000
    DB_PATH=./dev.db
    ```
  - [ ] This file IS committed to git (unlike `.env`) — it serves as documentation for developers and CI setup
  - [ ] Do NOT commit an actual `server/.env` file — it remains gitignored

- [ ] Task 3: Cold-start E2E verification
  - [ ] Stop all running dev servers (kill any `ts-node` / `vite` processes)
  - [ ] From monorepo root, run: `npm run test:e2e`
  - [ ] Confirm: Playwright starts both servers fresh, `http://localhost:3000/health` becomes available, all E2E specs pass, exit code 0

---

## Dev Notes

### Why `./dev.db` as default

When `npm run dev --workspace=server` runs from the monorepo root, npm executes the script with cwd set to the `server/` package directory. So `./dev.db` resolves to `server/dev.db`. Confirm the actual file location before committing — the `server/` directory currently contains `dev.db` at its root.

### No `.env` in CI is intentional

CI environments (GitHub Actions, etc.) set env vars via secrets/env blocks in the workflow YAML, not via `.env` files. By adding defaults, we make the server work in CI without any special configuration — the defaults are correct for the test context (port 3000, local SQLite file).

### The locally observed Exit Code 1

The terminal showing `npm run dev` → Exit Code: 1 in the `server/` directory is the `EADDRINUSE` scenario: a second server instance tries to start on port 3000 while one is already running. The Fastify `listen()` call rejects, the catch block calls `process.exit(1)`. This is not a bug — it's expected behavior when starting a duplicate server. The CI risk is more important to address.

### Files to Change

| File | Action |
|---|---|
| `server/src/index.ts` | Modify — add defaults for PORT and DB_PATH, remove fatal exit guards |
| `server/.env.example` | Create — new documentation file, committed to git |

No changes to `playwright.config.ts`, `server/package.json`, or any client files.

### No server tests affected

The server test suite uses Jest + Supertest with `buildApp()` called directly — it does not go through `index.ts` startup. No server test changes needed.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log
