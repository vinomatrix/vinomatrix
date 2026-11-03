import { Schema } from "effect";

export const ParcelId = Schema.NonEmptyString.pipe(Schema.brand("ParcelId"));
export type ParcelId = typeof ParcelId.Type;
