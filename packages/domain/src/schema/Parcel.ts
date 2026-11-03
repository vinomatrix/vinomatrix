import { Schema } from "effect";
import { ParcelId } from "./ParcelId.ts";

// GeoJSON in WGS84 (EPSG:4326), as served by the API.
const Position = Schema.Tuple([Schema.Finite, Schema.Finite]);

export const MultiPolygon = Schema.Struct({
  type: Schema.Literal("MultiPolygon"),
  coordinates: Schema.Array(Schema.Array(Schema.Array(Position))),
});

export const ParcelFeature = Schema.Struct({
  type: Schema.Literal("Feature"),
  id: ParcelId,
  geometry: MultiPolygon,
  properties: Schema.Struct({
    surfaceM2: Schema.NullOr(Schema.Int),
  }),
});
export type ParcelFeature = typeof ParcelFeature.Type;

export const MAX_PARCELS_PER_REQUEST = 5000;

export const ParcelCollection = Schema.Struct({
  type: Schema.Literal("FeatureCollection"),
  features: Schema.Array(ParcelFeature),
  // True when the bbox held more than MAX_PARCELS_PER_REQUEST parcels; the client should zoom in.
  truncated: Schema.Boolean,
});
export type ParcelCollection = typeof ParcelCollection.Type;
