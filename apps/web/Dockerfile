# Web image. Build from the repo root: docker build -f apps/web/Dockerfile .

FROM node:22-alpine AS build
# corepack ships with Node and installs the pnpm version pinned in package.json ("packageManager").
RUN corepack enable
WORKDIR /app
# Manifests first, sources later: the install stays cached until a dependency changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/domain/package.json packages/domain/
# The web app and its workspace dependencies, dev included (Vite builds the bundle), plus the root
# package: vite.config.ts imports vitest/config, which is a root devDependency.
RUN pnpm install --frozen-lockfile --filter "@vinomatrix/web..." --filter vinomatrix
COPY tsconfig.base.json ./
COPY packages/domain/src packages/domain/src
COPY apps/web apps/web
RUN pnpm --filter @vinomatrix/web build

# Final image: static files only, no Node. The unprivileged variant runs nginx as a non-root user on 8080.
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
# busybox wget ships with alpine.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
