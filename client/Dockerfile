# Stage 1: Build
# Build context: monorepo root (docker build -t todo-client -f client/Dockerfile .)
FROM node:22-alpine AS build
WORKDIR /app

# Copy root workspace manifests and base tsconfig
COPY package.json package-lock.json tsconfig.base.json ./
# Copy client workspace manifest
COPY client/package.json ./client/package.json

# Install all deps for the client workspace
RUN npm ci -w client

# Copy client source and build configs
COPY client/index.html ./client/index.html
COPY client/vite.config.ts ./client/vite.config.ts
COPY client/tsconfig.json ./client/tsconfig.json
COPY client/tsconfig.node.json ./client/tsconfig.node.json
COPY client/vitest.config.ts ./client/vitest.config.ts
COPY client/src/ ./client/src/

# Build the Vite SPA (outputs to client/dist/)
RUN cd client && npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS production

COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# nginx:alpine master binds port 80 (requires root), but worker processes
# already run as the built-in 'nginx' user via the 'user nginx;' directive
# in /etc/nginx/nginx.conf — no USER override needed.

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
