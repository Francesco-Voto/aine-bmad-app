# Story 5.2: Frontend Dockerfile (Multi-Stage, Nginx, Non-Root)

Status: done

## Story

As a developer,
I want the frontend containerized with a production Nginx build,
So that the React SPA is served correctly with API proxying and SPA fallback.

## Context & Analysis

### What Already Works

| Item | State |
|---|---|
| `client/package.json` `build` script | ✅ `tsc -b && vite build` → outputs to `client/dist/` |
| `client/dist/` | ✅ Already generated (from prior dev work); Docker Stage 1 will regenerate it cleanly |
| React SPA routing | ✅ Client-side routing in place; requires SPA fallback (`try_files $uri /index.html`) |
| API calls | ✅ All API calls use `/api/*` relative paths — no hardcoded ports |
| Any existing `client/Dockerfile` | ❌ **MISSING** — must create |
| Nginx configuration | ❌ **MISSING** — must create `client/nginx.conf` |
| Non-root Nginx user | ❌ **MISSING** — Nginx default runs as root; must switch to non-root |

### Multi-Stage Build Architecture

**Stage 1 — Build (`node:22-alpine`):**
```
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig*.json ./
COPY src/ ./src/
RUN npm run build             # dist/ produced
```

**Stage 2 — Serve (`nginx:alpine`):**
```
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### Nginx Configuration

The Nginx config must:
1. Serve static files from `/usr/share/nginx/html`
2. SPA fallback: `try_files $uri /index.html` for any non-file path
3. Proxy `/api/*` to the backend service name `server:3000` (Compose network alias)
4. Listen on port 80

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend service
    location /api/ {
        proxy_pass http://server:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

The backend service name `server` must match the service name in `docker-compose.yml` (Story 5.3).

### Non-Root Nginx

`nginx:alpine` includes a built-in `nginx` user. To run as non-root:
- Use `USER nginx` directive (the `nginx` user is already created in the `nginx:alpine` image)
- Nginx must bind to port 80 — on `nginx:alpine` this works as the `nginx` user via the master process trick (master binds port, workers run as `nginx`)
- Alternatively: use port 8080 and `USER nginx` fully unprivileged

The standard `nginx:alpine` approach: keep port 80, configure Nginx to write temp/pid files to world-writable paths so the non-root worker process can operate. The `nginx:alpine` image pre-configures this when `USER nginx` is set.

The Nginx config must also ensure `pid` and temp paths are writable:
```nginx
# In the http block or as directives:
# (nginx:alpine handles this when USER nginx is used)
```

Use `USER nginx` after copying files.

### Frontend Build Context

The `client/` directory is the Docker build context. Files to exclude in `.dockerignore`:
- `node_modules/`
- `dist/`
- `coverage/`

---

## Acceptance Criteria

1. **Given** `client/Dockerfile`, **When** the build stages are reviewed, **Then** Stage 1 uses `node:22-alpine` to run `npm ci && npm run build`; Stage 2 uses `nginx:alpine` and copies `/dist` to `/usr/share/nginx/html`.

2. **Given** the Nginx configuration at `client/nginx.conf`, **When** it is reviewed, **Then** it serves on port 80, has SPA fallback (`try_files $uri $uri/ /index.html`), and proxies `/api/*` to `http://server:3000/api/`.

3. **Given** the built image, **When** the running container's process is inspected, **Then** the Nginx worker process does not run as root (uses the `nginx` user).

4. **Given** `docker build -t todo-client ./client` is run from the monorepo root, **When** the build completes, **Then** it exits with code 0 and no errors.

5. **Given** the container starts on port 80, **When** `http://localhost:80` (or `http://localhost`) is requested, **Then** the React app HTML (`index.html`) is served.

---

## Tasks / Subtasks

### Task 1: Create `client/nginx.conf` (AC: 2, 5)

Create `client/nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — all unmatched paths serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API reverse proxy to backend service
    location /api/ {
        proxy_pass http://server:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Task 2: Create `client/Dockerfile` (AC: 1, 3, 4)

Create `client/Dockerfile`:

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY src/ ./src/

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Use nginx user (non-root, pre-created in nginx:alpine)
USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Task 3: Create `client/.dockerignore` (AC: 4)

Create `client/.dockerignore`:

```
node_modules
dist
coverage
*.log
```

### Task 4: Verify build locally (AC: 4, 5)

From the monorepo root:
```bash
docker build -t todo-client ./client
# Verify image builds successfully (exit code 0)
```

Note: Full end-to-end verification (API proxying) happens in Story 5.3 when the Compose stack is running. The standalone test only confirms the image builds and serves the HTML.
