import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api";
import { Bbox } from "../schema/Bbox.ts";
import { ParcelCollection } from "../schema/Parcel.ts";

// HttpApi contract shared by apps/api (implements it) and apps/web (calls it).

export class SystemGroup extends HttpApiGroup.make("system", { topLevel: true }).add(
  HttpApiEndpoint.get("health", "/health", { success: HttpApiSchema.NoContent }),
) {}

export class ParcelsGroup extends HttpApiGroup.make("parcels")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: { bbox: Bbox },
      success: ParcelCollection,
    }),
  )
  .prefix("/parcels") {}

export class VinomatrixApi extends HttpApi.make("vinomatrix").add(SystemGroup).add(ParcelsGroup) {}
