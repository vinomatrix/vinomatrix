# 0001 — API architecture: ports & adapters with Effect layers

- Status: accepted
- Date: 2026-11-03

## Context

`apps/api` will read parcels from PostGIS (M1–M2), call the pure decoder (M3), and add auth and a per-user cellar (M4). We want handlers testable without a database, the decoder free of I/O, and the web client typed from the same contract the server implements.

## Decision

Hexagonal architecture (ports & adapters), expressed with Effect primitives rather than a framework:

| Concept           | Where                               | Effect primitive                   |
| ----------------- | ----------------------------------- | ---------------------------------- |
| Core (pure)       | `packages/domain` (schemas, rules)  | plain functions + `Schema`         |
| Inbound port      | `packages/domain/src/api/`          | `HttpApi` / `HttpApiGroup`         |
| Inbound adapter   | `apps/api/src/<feature>/http.ts`    | `HttpApiBuilder.group`             |
| Outbound port     | `apps/api/src/<feature>/<Name>.ts`  | `Context.Service`                  |
| Outbound adapters | same file, static members           | `Layer` (`.layer`, `.layerMemory`) |
| Wiring            | `apps/api/src/server.ts`, `main.ts` | `Layer.provide`, `Layer.launch`    |

Rules:

- A port lives with its consumer, not its implementation. Outbound ports are used only by the API, so they live in `apps/api`; the domain never knows a database exists — it receives data as arguments.
- Ports exist only where there is I/O (database, auth, clock if needed). The decoder is called directly.
- Code is grouped by feature (`parcels/`, `decode/`, `cellar/`), not by layer.
- Handlers are thin: input is already validated by the contract; logic sits in services or the pure domain.
- Errors are typed in each layer and declared on the contract, which maps them to HTTP statuses.
- Spatial work (bbox, `ST_Transform` 2056 → 4326, limits) is SQL inside the PostGIS adapter.
- `main.ts` is the only place that runs effects (`NodeRuntime.runMain`). Tests reuse `server.ts` with in-memory adapters, or real PostGIS for e2e.

## Consequences

- Handler tests need no database: provide `X.layerMemory` instead of `X.layer`. A missing adapter is a compile error, not a runtime one.
- Swapping the HTTP runtime (Node server vs `HttpRouter.toWebHandler` for serverless, see #12) touches only `main.ts`.
- Cost: one service declaration and one layer per external dependency. Kept low by not creating ports for pure code and not adding pass-through "use case" layers.
- Port and adapters are split into separate files only when an adapter grows large or another package needs the port without Postgres.
