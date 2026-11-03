import {
  type Bbox,
  MAX_PARCELS_PER_REQUEST,
  MultiPolygon,
  type ParcelCollection,
  type ParcelFeature,
  ParcelId,
} from "@vinomatrix/domain/schema";
import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/sql";

const ParcelRow = Schema.Struct({
  id: ParcelId,
  geometry: Schema.fromJsonString(MultiPolygon),
  surface_m2: Schema.NullOr(Schema.Int),
});
const decodeRows = Schema.decodeUnknownEffect(Schema.Array(ParcelRow));

const toCollection = (
  features: readonly ParcelFeature[],
  maxFeatures: number,
): ParcelCollection => ({
  type: "FeatureCollection",
  features: features.slice(0, maxFeatures),
  truncated: features.length > maxFeatures,
});

// Outbound port for parcels (ADR 0001). SQL and decoding failures are defects: the API answers 500.
export class ParcelRepo extends Context.Service<
  ParcelRepo,
  {
    readonly findByBbox: (bbox: Bbox) => Effect.Effect<ParcelCollection>;
  }
>()("vinomatrix/ParcelRepo") {
  // PostGIS adapter. Geometry is stored in EPSG:2056 and transformed to 4326 here, at the edge.
  static readonly make = (maxFeatures: number) =>
    Layer.effect(
      ParcelRepo,
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;

        const findByBbox = Effect.fn("ParcelRepo.findByBbox")(function* ([
          minLon,
          minLat,
          maxLon,
          maxLat,
        ]: Bbox) {
          // One extra row tells us whether the result was cut.
          const rows = yield* sql`
            SELECT source_id AS id,
                   ST_AsGeoJSON(ST_Transform(geom, 4326), 6) AS geometry,
                   surface_m2
            FROM parcel
            WHERE ST_Intersects(
              geom,
              ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 2056)
            )
            ORDER BY source_id
            LIMIT ${maxFeatures + 1}
          `.pipe(Effect.orDie);
          const parcels = yield* decodeRows(rows).pipe(Effect.orDie);
          return toCollection(
            parcels.map(({ id, geometry, surface_m2 }) => ({
              type: "Feature" as const,
              id,
              geometry,
              properties: { surfaceM2: surface_m2 },
            })),
            maxFeatures,
          );
        });

        return ParcelRepo.of({ findByBbox });
      }),
    );

  static readonly layer = ParcelRepo.make(MAX_PARCELS_PER_REQUEST);

  // In-memory adapter for handler tests: returns the given features for any bbox.
  static readonly layerMemory = (features: readonly ParcelFeature[]) =>
    Layer.succeed(
      ParcelRepo,
      ParcelRepo.of({
        findByBbox: () => Effect.succeed(toCollection(features, MAX_PARCELS_PER_REQUEST)),
      }),
    );
}
