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

> **Note:** Docker files are added in Epic 5. Once available, the one-command setup will be:
>
> ```bash
> docker-compose up
> ```

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
