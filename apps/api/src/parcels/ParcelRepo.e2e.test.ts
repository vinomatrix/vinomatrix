import { ParcelCollection } from "@vinomatrix/domain/schema";
import { Effect, Layer, Schema } from "effect";
import { HttpRouter, HttpServer } from "effect/http";
import { SqlClient } from "effect/sql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PgLive } from "../db/Db.ts";
import { ApiRoutes } from "../server.ts";
import { ParcelRepo } from "./ParcelRepo.ts";

// HTTP → handler → ParcelRepo → PostGIS, against a migrated database (`pnpm db:migrate`).
// Test parcels sit near Basel, far from the NE vineyards, and are removed afterwards.

const runSql = (statement: (sql: SqlClient.SqlClient) => Effect.Effect<unknown, unknown>) =>
  Effect.runPromise(
    Effect.flatMap(SqlClient.SqlClient, statement).pipe(Effect.provide(PgLive), Effect.orDie),
  );

const removeTestParcels = () =>
  runSql((sql) => sql`DELETE FROM parcel WHERE source_id LIKE 'TEST_E2E_%'`);

const routesWith = (repo: Layer.Layer<ParcelRepo, never, SqlClient.SqlClient>) =>
  HttpRouter.toWebHandler(
    ApiRoutes.pipe(
      Layer.provide(repo),
      Layer.provide(PgLive),
      Layer.provide(HttpServer.layerServices),
      Layer.orDie,
    ),
  );

const BASEL = "/parcels?bbox=7.57,47.55,7.61,47.57";

describe.skipIf(!process.env.DATABASE_URL)("GET /parcels against PostGIS", () => {
  const api = routesWith(ParcelRepo.layer);
  const limitedToOne = routesWith(ParcelRepo.make(1));

  const getParcels = async (handler: typeof api.handler, path: string) => {
    const response = await handler(new Request(`http://localhost${path}`));
    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    return Schema.decodeUnknownSync(ParcelCollection)(body);
  };

  beforeAll(async () => {
    await removeTestParcels();
    await runSql(
      (sql) => sql`
        INSERT INTO parcel (source_id, geom, surface_m2) VALUES
          ('TEST_E2E_1', ST_Multi(ST_MakeEnvelope(2611000, 1267000, 2611010, 1267010, 2056)), 100),
          ('TEST_E2E_2', ST_Multi(ST_MakeEnvelope(2611050, 1267000, 2611060, 1267010, 2056)), 100)
      `,
    );
  });

  afterAll(async () => {
    await removeTestParcels();
    await api.dispose();
    await limitedToOne.dispose();
  });

  it("returns the parcels in the bbox, transformed to WGS84", async () => {
    const collection = await getParcels(api.handler, BASEL);

    expect(collection.features.map((f) => f.id)).toEqual(["TEST_E2E_1", "TEST_E2E_2"]);
    expect(collection.truncated).toBe(false);
    const [lon, lat] = collection.features[0]?.geometry.coordinates[0]?.[0]?.[0] ?? [];
    expect(lon).toBeCloseTo(7.588, 2);
    expect(lat).toBeCloseTo(47.556, 2);
  });

  it("returns nothing for a bbox without parcels", async () => {
    const collection = await getParcels(api.handler, "/parcels?bbox=8.0,46.5,8.01,46.51");
    expect(collection.features).toEqual([]);
  });

  it("cuts at the limit and flags the result as truncated", async () => {
    const collection = await getParcels(limitedToOne.handler, BASEL);

    expect(collection.features.map((f) => f.id)).toEqual(["TEST_E2E_1"]);
    expect(collection.truncated).toBe(true);
  });
});
