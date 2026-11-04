import { type ParcelFeature, ParcelCollection, ParcelId } from "@vinomatrix/domain/schema";
import { Layer, Schema } from "effect";
import { HttpRouter, HttpServer } from "effect/http";
import { afterAll, describe, expect, it } from "vitest";
import { ParcelRepo } from "./parcels/ParcelRepo.ts";
import { ApiRoutes } from "./server.ts";

const fixture: ParcelFeature = {
  type: "Feature",
  id: Schema.decodeSync(ParcelId)("TEST_1"),
  geometry: {
    type: "MultiPolygon",
    coordinates: [
      [
        [
          [6.9, 46.95],
          [6.91, 46.95],
          [6.91, 46.96],
          [6.9, 46.95],
        ],
      ],
    ],
  },
  properties: { surfaceM2: 1234 },
};

// Same routes as production, with the in-memory ParcelRepo instead of PostGIS.
describe("ApiRoutes (in memory)", () => {
  const { handler, dispose } = HttpRouter.toWebHandler(
    ApiRoutes.pipe(
      Layer.provide(ParcelRepo.layerMemory([fixture])),
      Layer.provide(HttpServer.layerServices),
    ),
  );
  afterAll(dispose);

  const get = (path: string) => handler(new Request(`http://localhost${path}`));

  it("GET /health answers 204", async () => {
    expect((await get("/health")).status).toBe(204);
  });

  it("GET /parcels returns the repo's parcels as a FeatureCollection", async () => {
    const response = await get("/parcels?bbox=6.8,46.9,7.0,47.05");
    expect(response.status).toBe(200);

    const body: unknown = await response.json();
    const collection = Schema.decodeUnknownSync(ParcelCollection)(body);
    expect(collection.features.map((f) => f.id)).toEqual(["TEST_1"]);
    expect(collection.truncated).toBe(false);
  });

  it.each([
    ["missing", "/parcels"],
    ["three numbers", "/parcels?bbox=6.8,46.9,7.0"],
    ["min above max", "/parcels?bbox=7.0,46.9,6.8,47.05"],
    ["not numbers", "/parcels?bbox=a,b,c,d"],
  ])("GET /parcels with a bbox %s answers 400", async (_label, path) => {
    expect((await get(path)).status).toBe(400);
  });

  it("answers 404 for routes outside the contract", async () => {
    expect((await get("/nope")).status).toBe(404);
  });
});
