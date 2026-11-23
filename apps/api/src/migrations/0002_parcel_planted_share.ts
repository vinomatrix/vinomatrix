import { Effect } from "effect";
import { SqlClient } from "effect/sql";

// Share of each parcel actually planted with vines, computed by tools/pipeline (load_planted_share).
export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  yield* sql`
    ALTER TABLE parcel
      ADD COLUMN planted_share real CHECK (planted_share BETWEEN 0 AND 1)
  `;
  yield* sql`COMMENT ON COLUMN parcel.planted_share IS 'area(parcel ∩ vine land use 701/717) / area(parcel); NULL until the pipeline runs'`;
});
