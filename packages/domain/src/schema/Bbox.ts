import { Schema, SchemaTransformation } from "effect";

const Longitude = Schema.FiniteFromString.check(Schema.isBetween({ minimum: -180, maximum: 180 }));
const Latitude = Schema.FiniteFromString.check(Schema.isBetween({ minimum: -90, maximum: 90 }));

type Encoded = readonly [string, string, string, string];

// WGS84 bounding box as [minLon, minLat, maxLon, maxLat], the order MapLibre's getBounds().toArray() flattens to.
export const BboxTuple = Schema.Tuple([Longitude, Latitude, Longitude, Latitude]).check(
  Schema.makeFilter(
    ([minLon, minLat, maxLon, maxLat]) =>
      (minLon < maxLon && minLat < maxLat) || "expected minLon < maxLon and minLat < maxLat",
  ),
);

// Query-string form: `bbox=minLon,minLat,maxLon,maxLat`. A wrong number of parts fails the tuple.
export const Bbox = Schema.String.pipe(
  Schema.decodeTo(
    BboxTuple,
    SchemaTransformation.transform({
      decode: (text) => text.split(",") as unknown as Encoded,
      encode: (parts) => parts.join(","),
    }),
  ),
);
export type Bbox = typeof Bbox.Type;
