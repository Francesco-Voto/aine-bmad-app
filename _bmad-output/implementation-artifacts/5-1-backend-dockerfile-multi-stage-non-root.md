# Story 5.1: Backend Dockerfile (Multi-Stage, Non-Root)

Status: done

## Story

As a developer,
I want the backend containerized with a production-ready multi-stage Dockerfile,
So that it runs securely and efficiently in any Docker environment.

## Context & Analysis

### What Already Works

| Item | State |
|---|---|
| `server/src/index.ts` | ✅ Fastify 5.x server; listens on `PORT` env var; `DB_PATH` env var for SQLite path |
| `server/package.json` `build` script | ✅ `tsc` → compiles to `dist/`; `main` = `dist/index.js`; `start` = `node dist/index.js` |
| `server/tsconfig.json` `outDir` | ✅ `"outDir": "dist"`, `"rootDir": "src"` — build output is `server/dist/` |
| `GET /health` endpoint | ✅ Returns `200 { "status": "ok", "db": "ok" }` |
| `better-sqlite3` native module | ⚠️ Native addon — requires `npm ci` with matching Node version in run stage |
| Any existing `server/Dockerfile` | ❌ **MISSING** — must create |
| Non-root user config | ❌ **MISSING** — must add via `addgroup`/`adduser` + `USER` directive |

### Multi-Stage Build Architecture

The Dockerfile uses two stages:

**Stage 1 — Build (`node:22-alpine`):**
```
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # install ALL deps (including dev)
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build             # tsc → dist/
```

**Stage 2 — Production (`node:22-alpine`):**
```
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev         # prod deps only (includes better-sqlite3 native build)
```

The native `better-sqlite3` addon must be built in Stage 2 (same Node version/arch as the run image) — do **not** copy `node_modules` from Stage 1 across stages. Run `npm ci --omit=dev` fresh in Stage 2.

### Non-Root User

Alpine Linux pattern:
```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```
The `USER` directive must appear **after** all file copies and `npm ci` (which may need to write to `~/.npm`). The data directory mounted at runtime is owned by root; `DB_PATH` should point to `/app/data/todos.db` which is a volume mount — ensure the mount is writable by the non-root user (handled in Compose via `chmod` or by using a named volume).

### Environment Variables

No hardcoded values in the Dockerfile:

| Var | Example value at runtime |
|---|---|
| `PORT` | `3000` |
| `DB_PATH` | `/app/data/todos.db` |
| `NODE_ENV` | `production` |

`ENV` directives in the Dockerfile set sensible defaults; all are overridable at `docker run` / `docker-compose` time.

### Logging

The server already logs request method and path via Fastify's built-in logger. No task content is logged (Fastify logs route + status, not request body by default). No additional changes needed for logging AC.

---

## Acceptance Criteria

1. **Given** `server/Dockerfile`, **When** the build stages are reviewed, **Then** Stage 1 uses `node:22-alpine` to run `npm ci && npm run build` (tsc → `dist/`); Stage 2 uses `node:22-alpine` and copies only `dist/` and installs production `node_modules` via `npm ci --omit=dev`.

2. **Given** the built image, **When** the running container's process is inspected (`docker exec <id> ps aux`), **Then** the Node process does not run as root (UID is not 0).

3. **Given** `PORT`, `DB_PATH`, and `NODE_ENV` are supplied as env vars at `docker run` time, **When** the container starts, **Then** the server starts on the configured port with no hardcoded values in the Dockerfile for those vars.

4. **Given** `docker build -t todo-server ./server` is run from the monorepo root, **When** the build completes, **Then** it exits with code 0 and no errors.

5. **Given** the container runs with `-v $(pwd)/data:/app/data` and correct env vars, **When** `GET /health` is called, **Then** it returns `200 { "status": "ok", "db": "ok" }`.

6. **Given** `docker logs <container>` is run after a request hits the server, **When** the output is reviewed, **Then** request method and path are logged; no task content (request body) appears in the logs.

---

## Tasks / Subtasks

### Task 1: Create `server/Dockerfile` (AC: 1, 2, 3, 4, 5, 6)

The project is a monorepo — the build context is the **monorepo root** (`docker build -t todo-server -f server/Dockerfile .`), not `./server`. This means paths inside the Dockerfile are relative to the root. `better-sqlite3` is a native addon requiring `python3`, `make`, and `g++` at compile time.

Create `server/Dockerfile`:

```dockerfile
# Stage 1: Build
# Build context: monorepo root (docker build -t todo-server -f server/Dockerfile .)
FROM node:22-alpine AS build
WORKDIR /app

# Alpine needs python3 + make + g++ for native addons (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy root workspace manifests
COPY package.json package-lock.json tsconfig.base.json ./
COPY server/package.json ./server/package.json

# Install all deps (dev included) for the server workspace — runs node-gyp
RUN npm ci -w server

# Copy server source and build config
COPY server/tsconfig.json ./server/tsconfig.json
COPY server/src/ ./server/src/

# Compile TypeScript → server/dist/
RUN cd server && npx tsc

# Stage 2: Production
FROM node:22-alpine AS production

# Build tools needed for better-sqlite3 native compilation; removed after
RUN apk add --no-cache python3 make g++ \
 && addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Restore workspace structure for npm ci to resolve deps correctly
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json

# Install production deps only (runs node-gyp for better-sqlite3)
RUN npm ci -w server --omit=dev

# Remove build tools — slims the final image
RUN apk del python3 make g++

# Copy compiled output from build stage
COPY --from=build /app/server/dist ./server/dist

# Create data directory with correct ownership for volume mount
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data

USER appuser

ENV PORT=3000
ENV DB_PATH=/app/data/todos.db
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server/dist/index.js"]
```

### Task 2: Create root `.dockerignore` for backend builds (AC: 4)

Since the build context is the monorepo root, create or update `.dockerignore` at the **monorepo root** (not inside `server/`):

```
node_modules
server/node_modules
client/node_modules
server/dist
client/dist
**/.env
**/*.log
coverage
data
```

### Task 3: Verify build locally (AC: 4, 5)

From the monorepo root:
```bash
docker build -t todo-server -f server/Dockerfile .
docker run --rm \
  -e PORT=3000 \
  -e DB_PATH=/app/data/todos.db \
  -e NODE_ENV=production \
  -v $(pwd)/data:/app/data \
  -p 3000:3000 \
  todo-server
# In another terminal:
curl http://localhost:3000/health
# Expected: {"status":"ok","db":"ok"}
```

Verify non-root: `docker exec <id> ps aux` — UID should not be 0.
