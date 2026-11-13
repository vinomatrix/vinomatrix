# API image. Build from the repo root: docker build -f apps/api/Dockerfile .

# Node 22 runs .ts directly (type stripping), so there is no build stage.
FROM node:22-alpine AS base
# corepack ships with Node and installs the pnpm version pinned in package.json ("packageManager").
RUN corepack enable
WORKDIR /app

FROM base AS deps
# Manifests first, sources later: this layer and the install below stay cached
# until a dependency changes, not on every code change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/domain/package.json packages/domain/
# The API and its workspace dependencies (the trailing "..."), production only, exactly as locked.
RUN pnpm install --frozen-lockfile --prod --filter "@vinomatrix/api..."

# Final image: Node, the installed node_modules and the sources. pnpm and its store stay behind in deps.
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app ./
COPY packages/domain/src packages/domain/src
COPY apps/api/src apps/api/src
# Files stay owned by root: the process can read the code but not change it.
USER node
WORKDIR /app/apps/api
EXPOSE 3000
# Liveness only: /health does not touch the database. busybox wget ships with alpine.
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/health || exit 1
# Migrate with this image's code, then serve. A failed migration exits non-zero, so the container
# never turns healthy and a rolling deploy keeps the previous version (Coolify's pre-deployment
# command would run the *old* container's migrations). `exec` replaces sh, so node is PID 1 and
# receives SIGTERM directly. Assumes a single instance: several replicas would migrate concurrently.
CMD ["sh", "-c", "node src/db/migrate.ts && exec node src/main.ts"]
