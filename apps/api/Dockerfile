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
