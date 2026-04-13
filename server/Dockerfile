# Stage 1: Build
# Build context: monorepo root (docker build -t todo-server -f server/Dockerfile .)
FROM node:22-alpine AS build
WORKDIR /app

# Alpine needs python3 + make + g++ for native addons (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy root workspace manifests and base tsconfig
COPY package.json package-lock.json tsconfig.base.json ./
# Copy server workspace manifest
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

RUN apk add --no-cache python3 make g++ \
 && addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Restore workspace structure for npm ci to resolve deps correctly
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json

# Install production deps only (runs node-gyp for better-sqlite3)
RUN npm ci -w server --omit=dev

# Slim down: remove build tools after native compilation
RUN apk del python3 make g++

# Copy compiled TypeScript output from build stage
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
