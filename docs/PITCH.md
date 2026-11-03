# Vinomatrix — Pitch

> Working name. Final name TBD (GitHub redirects on rename, so we don't block on it).

## 1. Problem & user

**Primary user — the buyer.** Someone standing in front of a shelf (cellar, Migros, a Neuchâtel encavage) with a bottle in hand, wondering: _what will this actually taste like, is it ready to drink, how long can I keep it?_ Labels say "Pinot Noir, Auvernier, 2023" and nothing else useful.

**Secondary user — the collector (premium, later).** Same person at home, with 30–100 bottles, wanting to know what to open tonight and what to leave for 2030.

**Why it doesn't exist yet.** Wine apps are either review aggregators (Vivino: what others think) or cellar spreadsheets. None _explains_ a wine from first principles — grape × soil × climate × winemaking → profile. That reasoning exists in sommelier heads and oenology textbooks, not in software.

## 2. MVP in one sentence

> Pick a Neuchâtel parcel on a map and a grape; get the wine's likely profile (body, acidity, tannin, sweetness, aromatic family), its drinking window, and _why_ — in under 10 seconds, no account needed.

### What the MVP does NOT do

- No user reviews, ratings, or social features
- No label scanning / OCR / barcode
- No price data, no shop integration
- No regions outside Neuchâtel (engine is universal; data is not)
- No native app — responsive web only
- No LLM in the hot path (a rules engine we can explain and test; an LLM may _write the explanation text_ later, behind a feature flag)

## 3. Data

| Layer                                | Source                                                                                                           | Licence / notes                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Vineyard parcels (cadastre viticole) | SITN data via geodienste.ch WFS (MGDM 151.1)                                                                     | Free use with attribution; registration required — see `docs/DATA.md` |
| AOC Neuchâtel zones & communes       | SITN / OFAG                                                                                                      | Open                                                                  |
| Terrain (slope, aspect, altitude)    | swisstopo swissALTI3D                                                                                            | Open government data                                                  |
| Soil                                 | Carte des sols NE / NABODAT where available                                                                      | Check coverage; fallback: manual soil classes per sector              |
| Climate                              | MeteoSwiss normals (Neuchâtel station) + altitude lapse rate                                                     | Open                                                                  |
| Grapes (cépages)                     | Hand-curated table: Pinot Noir, Chasselas, Chardonnay, Pinot Gris, Gamaret, Garanoir, Sauvignon, Gewürztraminer… | Our own                                                               |
| Decoder rules                        | Hand-written, reviewed with an oenologist later                                                                  | Our own; versioned                                                    |

Pipeline (Python, `tools/pipeline`): fetch → clean → compute slope/aspect per parcel → load into PostGIS. Idempotent, runs in CI on a schedule.

## 4. Stack & architecture

```
vinomatrix/                     pnpm monorepo, TypeScript strict everywhere
├── packages/domain             Effect Schema models + decoder engine (pure, 100% tested)
├── apps/api                    Node 22 + @effect/platform HttpApi · PostGIS via @effect/sql-pg · Better Auth
├── apps/web                    Vite + React 19 + TS · react-map-gl (MapLibre) · TanStack Query · Recharts
└── tools/pipeline              Python 3.12 · GDAL/rasterio · psycopg · loads SITN + swissALTI3D into PostGIS
```

**Key design choices**

- **Typed end-to-end**: the HttpApi definition in `packages/domain` is the single source of truth; the React client derives its types from it. No codegen, no drift.
- **Decoder = pure function**: `decode(parcel, grape, vintage, options) → Profile`. Deterministic, snapshot-tested, explainable (every output carries the rules that fired).
- **PostGIS does the geo work**: spatial joins, nearest-station lookups, aspect/slope stats. The app never holds a region in memory.
- **Effect where it pays**: domain, API, data access, error channel. React components stay idiomatic React.
- **Auth is a dependency, not a feature**: Better Auth, passkeys + magic link. Only needed for the cellar.

**Deploy**: web on Cloudflare Pages or Vercel; API + Postgres/PostGIS on Fly.io or Railway (one region, EU). Preview deploys per PR.

## 5. Milestones — 6 weeks, one demo per week

| #   | Week | Demo-able outcome                                                                                                                            |
| --- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | 1    | Monorepo, CI, deploy pipeline live. Map of Neuchâtel vineyards (parcels from SITN) in prod at a public URL.                                  |
| M2  | 2    | Click a parcel → side panel with its facts: commune, AOC, altitude, slope, aspect, soil class. Pipeline computes these in PostGIS.           |
| M3  | 3    | Decoder v1: choose grape (+ vintage) → profile radar + drinking-window curve + "why" list. Engine fully tested.                              |
| M4  | 4    | Auth + cellar: save a bottle (parcel/producer, grape, vintage, qty), list, "drink now / keep" status.                                        |
| M5  | 5    | Polish for the portfolio: landing, README with screenshots/GIF, a11y pass, mobile, optional 3D terrain mode (Cesium/Resium) behind a toggle. |
| M6  | 6    | Buffer. Feedback from one oenologist / encavage; fix the rules they laugh at. Write the blog post / LinkedIn post.                           |

Rule: **production from week 1.** Nothing waits for "complete".

## 6. Success criteria (by mid-December 2026)

- Public URL, works on phone, loads under 2 s on 4G
- `packages/domain` at ≥ 90% coverage, decoder rules documented
- ≥ 40 merged PRs, every one linked to an issue
- README a recruiter understands in 60 seconds
- Shown in ≥ 3 interviews; pinned on GitHub and LinkedIn Featured

## 7. Risks

| Risk                                | Mitigation                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Soil data patchy for NE             | Manual soil classes per sector for MVP; mark as "estimated" in the UI      |
| Decoder rules are wrong             | They will be. Version them, show the "why", get one expert to review in M6 |
| Scope creep (3D, LLM, more regions) | Everything not in M1–M5 goes to a `later` label. No exceptions before M5   |
| Time competes with job applications | 30/70 split, applications in the morning, code after                       |
