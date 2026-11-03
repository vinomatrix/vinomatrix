# CLAUDE.md — Vinomatrix

Read `docs/PITCH.md` first. It defines scope; anything not in M1–M5 is out unless an issue labelled `later` is explicitly pulled in.

## Repo layout

```
packages/domain      Effect Schema + decoder engine. Pure. No I/O, no React, no Node APIs.
apps/api             @effect/platform HttpApi server. PostGIS via @effect/sql-pg. Better Auth.
apps/web             Vite + React 19. MapLibre via react-map-gl. TanStack Query. Recharts.
tools/pipeline       Python 3.12 (uv). Loads SITN / swissALTI3D into PostGIS. Idempotent.
docs/                PITCH.md, BACKLOG.md, ADRs in docs/adr/NNNN-title.md
```

pnpm workspaces. Node 22. TypeScript `strict: true`, `noUncheckedIndexedAccess: true`.

## Commands

```
pnpm i                      install
pnpm dev                    api + web concurrently
pnpm test                   vitest, all packages
pnpm check                  tsc --noEmit + eslint + prettier --check
pnpm db:up                  docker compose up postgis
pnpm db:migrate             run migrations
uv run --project tools/pipeline pipeline sync   # fetch + load geodata
```

Run `pnpm check && pnpm test` before every commit. CI runs the same.

## Conventions

**Effect**

- Domain and API code is Effect. Errors are typed (`Data.TaggedError`), never thrown.
- Services via `Context.Tag` + `Layer`. Dependencies are injected, never imported as singletons.
- Schemas in `packages/domain/src/schema/`. API contract in `packages/domain/src/api/` (HttpApi groups). The web client imports the contract — never hand-writes request/response types.
- No `Effect.runPromise` outside `main.ts` and tests.

**React**

- Idiomatic React. No Effect inside components; the API client (`apps/web/src/api/`) wraps HttpApiClient and exposes plain promises to TanStack Query.
- Function components, hooks, no class components, no Redux.
- Components are small; one per file; colocated `*.test.tsx` where logic exists.
- Styling: CSS modules + design tokens in `apps/web/src/styles/tokens.css`. No Tailwind.

**Decoder engine**

- `decode(input: DecodeInput): DecodeResult` — pure, deterministic.
- Every rule is a named object in `packages/domain/src/rules/` with `id`, `when`, `then`, `explain`. The result lists the ids of rules that fired.
- Add a snapshot test for every rule. Changing a rule's output requires updating the snapshot _and_ a line in `docs/RULES_CHANGELOG.md`.

**Geo**

- Coordinates: WGS84 (EPSG:4326) at API boundary and in GeoJSON; EPSG:2056 (LV95) in PostGIS and the pipeline. Transform at the edge, document it.
- Never load a whole region into memory in the API. Spatial queries live in SQL.

**Python pipeline**

- `uv` for deps, `ruff` for lint/format, `pytest`. Type hints everywhere.
- Each step is a function `step_x(ctx) -> None`, re-runnable. Downloads cached under `tools/pipeline/.cache/` (gitignored).

## Upstream sources

Read-only mirrors of libraries we depend on, cloned under `skills/external/` (gitignored) at the version we install. Declared in `skills/external.json`.

```
pnpm skills:mount [-- name]     shallow clone at the pinned ref (skips if mounted)
pnpm skills:update [-- name]    re-sync to the pinned ref, discarding local edits
pnpm skills:unmount [-- name]   delete the mirror
```

- Effect: start from `skills/external/effect/ai-docs/src/`, never effect.website (it documents v3).
- Never edit a mirror. If one is missing, ask the user to mount it — don't clone it yourself.
- When a dependency bump moves a mirrored library, update its `ref` in `skills/external.json` in the same PR and run `pnpm skills:update -- <name>`.

## Git & GitHub

- Branch per issue: `feat/12-parcel-panel`, `fix/34-aspect-sign`. Never commit on `main`.
- Conventional commits: `feat(web): parcel side panel (#12)`. Reference the issue in the title.
- One PR per issue, small. PR body: what / why / how tested / screenshot if UI.
- Merge commit (no squash). Delete the branch.
- Use `gh` for issues, labels, milestones, PRs. Labels: `area:web`, `area:api`, `area:domain`, `area:pipeline`, `area:infra`, `type:feat`, `type:fix`, `type:chore`, `type:docs`, `later`, `good-first`.

## Definition of done

- Issue acceptance criteria met
- Tests added/updated, `pnpm check && pnpm test` green
- Deployed to preview; link in the PR
- No TODOs left in the diff without an issue number

## Things to avoid

- Adding a dependency when 30 lines will do
- Abstractions before the second use
- "While I'm here" refactors — open an issue instead
- Any work on 3D, LLM explanations, other regions, OCR, pricing, social features before M5

## Language

Code, commits, issues, docs: **English**. UI copy: **French** (strings in `apps/web/src/i18n/fr.ts`; keep the structure ready for `it`/`de`/`en` but ship FR only).
