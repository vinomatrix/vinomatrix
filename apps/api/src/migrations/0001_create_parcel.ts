import { Effect } from "effect";
import { SqlClient } from "effect/sql";

// Vineyard parcels loaded by tools/pipeline (load_parcels). Geometry stays in LV95 (EPSG:2056).
export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  // The local image enables PostGIS already; managed databases may not.
  yield* sql`CREATE EXTENSION IF NOT EXISTS postgis`;
  yield* sql`
    CREATE TABLE parcel (
      source_id text PRIMARY KEY,
      geom geometry(MultiPolygon, 2056) NOT NULL,
      surface_m2 integer,
      source_updated_on date,
      loaded_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  yield* sql`COMMENT ON COLUMN parcel.source_id IS 'identificateur from the NE vineyard cadastre (MGDM 151.1)'`;
  yield* sql`CREATE INDEX parcel_geom_idx ON parcel USING GIST (geom)`;
});
