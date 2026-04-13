# Todo App

A full-stack Todo application — React (Vite) frontend + Fastify backend + SQLite.

## Project Structure

```
todo-app/
├── client/          # React SPA (Vite + TypeScript)
├── server/          # Fastify API (TypeScript + SQLite)
├── e2e/             # Playwright end-to-end tests
└── docs/            # Project documentation
```

## Quick Start

```bash
docker compose up --build   # first run — builds images
docker compose up           # subsequent runs — uses cached images
```

This starts:
- **Frontend** at http://localhost (port 80, Nginx)
- **Backend** at http://localhost:3000 (port 3000, Node.js)

The `docker-compose.override.yml` is auto-merged, setting `NODE_ENV=development` and a dedicated `dev.db`.

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Install dependencies

```bash
npm install
```

### Run the frontend (client)

```bash
cd client
npm run dev
```

Starts Vite dev server at `http://localhost:5173`.

### Run the backend (server)

```bash
cd server
npm run dev
```

Starts the Fastify API (port configured via env).

## Available Scripts (root)

| Script                | Description                         |
| --------------------- | ----------------------------------- |
| `npm run lint`        | Run ESLint across both workspaces   |
| `npm run format`      | Run Prettier across both workspaces |
| `npm run typecheck`   | Type-check both workspaces          |
| `npm run test`        | Run unit tests (client + server)    |
| `npm run test:client` | Run Vitest tests in `client/`       |
| `npm run test:server` | Run Jest tests in `server/`         |
| `npm run test:e2e`    | Run Playwright E2E tests            |
| `npm run test:all`    | Run all tests (unit + E2E)          |
| `npm run docker:up`   | Start Docker stack (detached)       |
| `npm run docker:up:build` | Rebuild images then start       |
| `npm run docker:down` | Stop and remove containers          |
| `npm run docker:logs` | Tail logs from all services         |

## Docker

### Prerequisites

- Docker Engine 24+
- Docker Compose v2 (`docker compose` or `docker-compose`)

### Local development (default)

```bash
docker compose up --build   # first run
docker compose up           # subsequent runs
```

`docker-compose.override.yml` is automatically merged — sets `NODE_ENV=development` and `DB_PATH=/app/data/dev.db`.

### Production-only configuration

```bash
docker compose -f docker-compose.yml up
```

Uses the base `docker-compose.yml` only (no override). `NODE_ENV=production`, `DB_PATH=/app/data/todos.db`.

### Test environment

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d --build
```

Uses a separate SQLite database (`test.db`) in an isolated volume — no data leakage from dev or production.

### Environment variables

All values are overridable via `.env` or shell env vars:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Backend server port (inside container) |
| `DB_PATH` | `/app/data/todos.db` | SQLite database path (inside container) |
| `NODE_ENV` | `production` | Node environment |
| `CLIENT_PORT` | `80` | Host port mapped to frontend container |
| `SERVER_PORT` | `3000` | Host port mapped to backend container |

### Useful commands

```bash
docker compose logs server          # backend logs
docker compose logs client          # nginx logs
docker compose down                 # stop and remove containers (volume persists)
docker compose down -v              # stop + remove containers and volumes (destroys DB)
```
