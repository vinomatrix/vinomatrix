# Backlog — initial issues

Format: `- [ ] <title> · labels · acceptance criteria`. Create these with `gh issue create`, assign each to its milestone. Milestones: M1 … M6 as in PITCH.md, due dates one week apart starting from the day the repo is created.

## Labels to create

```
area:web  area:api  area:domain  area:pipeline  area:infra
type:feat  type:fix  type:chore  type:docs
later  good-first
```

## M1 — Map in prod

- [ ] Scaffold pnpm monorepo (packages/domain, apps/api, apps/web, tools/pipeline) · area:infra type:chore · `pnpm i && pnpm check && pnpm test` green on an empty workspace; shared tsconfig/eslint/prettier.
- [ ] CI: GitHub Actions running check + test on PR · area:infra type:chore · Status check required on `main`; cache pnpm store.
- [ ] Docker compose with PostGIS 16 for local dev · area:infra type:chore · `pnpm db:up` exposes 5432; healthcheck; README section.
- [ ] Pipeline skeleton (uv, ruff, pytest) with `pipeline sync` CLI · area:pipeline type:chore · `uv run pipeline sync --dry-run` lists steps; tests pass.
- [ ] Pipeline step: fetch Neuchâtel vineyard parcels from SITN WFS → GeoJSON (EPSG:2056) · area:pipeline type:feat · Cached file, row count logged, licence/attribution recorded in `docs/DATA.md`.
- [ ] Pipeline step: load parcels into PostGIS table `parcel` · area:pipeline type:feat · Idempotent (upsert on source id); spatial index; `SELECT count(*)` > 0.
- [ ] API: `GET /health` and `GET /parcels?bbox=` returning GeoJSON FeatureCollection (EPSG:4326) · area:api type:feat · HttpApi contract in domain; bbox validated by Schema; limits to 5k features; e2e test against PostGIS.
- [ ] Web: Vite + React app with MapLibre map centred on Neuchâtel vineyards · area:web type:feat · swisstopo light basemap; parcels layer from API; loads < 2 s on 4G throttle.
- [ ] Deploy: web to Cloudflare Pages/Vercel, API + PostGIS to Fly.io/Railway, preview per PR · area:infra type:feat · Public URL in README; env vars documented; pipeline run once against prod DB.
- [ ] README v1 (what, stack, run locally, live link) · type:docs · A stranger can run it locally in 10 minutes following only the README.

## M2 — Parcel facts

- [ ] Pipeline: download swissALTI3D tiles covering NE vineyards · area:pipeline type:feat · Tiles cached; coverage check for every parcel.
- [ ] Pipeline: compute per-parcel altitude (mean), slope (mean, °) and aspect (circular mean, °) · area:pipeline type:feat · Stored on `parcel`; unit tests on a synthetic DEM; aspect sign convention documented (CLAUDE.md Geo).
- [ ] Pipeline: AOC / commune attribution per parcel (spatial join) · area:pipeline type:feat · 100% of parcels attributed or flagged.
- [ ] Pipeline: soil class per parcel (from NE soil map where available; fallback manual sectors) · area:pipeline type:feat · `soil_class`, `soil_source ∈ {map, estimated}`; coverage reported.
- [ ] Domain: `Parcel` schema with facts (altitude, slope, aspect, soil, aoc, commune) · area:domain type:feat · Schema + decode/encode tests.
- [ ] API: `GET /parcels/:id` with facts · area:api type:feat · 404 typed error; e2e test.
- [ ] Web: click parcel → side panel with facts, aspect shown as compass rose · area:web type:feat · Keyboard reachable; mobile → bottom sheet; "estimated" badge on soil when applicable.
- [ ] Web: URL state (`?parcel=…`) so a parcel is shareable · area:web type:feat · Reload restores selection and viewport.

## M3 — Decoder v1

- [ ] Domain: `Grape` table (NE cépages) with intrinsic traits · area:domain type:feat · ≥ 8 grapes; each trait sourced in `docs/DATA.md`.
- [ ] Domain: `DecodeInput` / `DecodeResult` / `Profile` schemas · area:domain type:feat · Profile axes: body, acidity, tannin, sweetness, aromatic family, drinking window (from, peak, to).
- [ ] Domain: rules engine — `decode()` applies named rules, returns fired rule ids + explanations · area:domain type:feat · Deterministic; snapshot per rule; coverage ≥ 90% on package.
- [ ] Domain: first 15 rules (grape baseline, altitude → acidity, aspect → ripeness/body, slope/soil → structure, vintage adjustment) · area:domain type:feat · Each rule has `explain()` in FR; `docs/RULES_CHANGELOG.md` started.
- [ ] API: `POST /decode` · area:api type:feat · Validated input; returns DecodeResult; e2e test.
- [ ] Web: grape + vintage picker in the side panel · area:web type:feat · Disabled grapes not planted in that AOC are greyed with a tooltip.
- [ ] Web: profile radar chart (Recharts) · area:web type:feat · Accessible table fallback (`<details>`); tokens for colours.
- [ ] Web: drinking-window curve (now marker, peak) · area:web type:feat · Respects vintage; tooltip in FR.
- [ ] Web: "Pourquoi ?" list from fired rules · area:web type:feat · Each item expandable; copyable text.

## M4 — Auth + cellar

- [ ] API: Better Auth with passkeys + magic link, sessions in Postgres · area:api type:feat · Sign-in flow e2e; no passwords stored.
- [ ] Domain: `Bottle` schema (parcel or free text producer, grape, vintage, qty, notes) · area:domain type:feat · Schema tests.
- [ ] API: cellar CRUD `GET/POST/PATCH/DELETE /cellar/bottles` scoped to user · area:api type:feat · Authorisation tests (user A cannot read user B).
- [ ] Web: sign-in UI (FR) · area:web type:feat · Works on mobile; error states.
- [ ] Web: "Ajouter à ma cave" from a decoded wine · area:web type:feat · Optimistic update with TanStack Query.
- [ ] Web: cellar list with status chip (à boire / garder / apogée) computed from decoder · area:web type:feat · Sort by status/vintage; empty state.

## M5 — Portfolio polish

- [ ] Landing section above the map (one sentence, one CTA) · area:web type:feat
- [ ] README v2: screenshots, GIF, architecture diagram, data attribution · type:docs
- [ ] Accessibility pass (axe clean, focus order, contrast) · area:web type:fix
- [ ] Performance budget enforced in CI (bundle size, LCP on preview) · area:infra type:chore
- [ ] Optional: 3D terrain mode with Cesium/Resium behind a toggle · area:web type:feat later · Only if M1–M4 done by day 28.
- [ ] Error tracking (Sentry free tier) + basic analytics (Plausible) · area:infra type:chore

## M6 — Buffer & feedback

- [ ] Session with one oenologist / encavage; log their corrections as issues · type:docs
- [ ] Rules v1.1 from feedback · area:domain type:fix
- [ ] Blog post / LinkedIn post: "Decoding Neuchâtel wine from open geodata" · type:docs

## later (do not schedule)

- Other regions (Vaud, Valais, Piemonte) · later
- LLM-written explanations behind feature flag · later
- Label OCR / barcode · later
- Producer pages · later
- i18n it/de/en · later
- Native wrapper (Capacitor) · later
