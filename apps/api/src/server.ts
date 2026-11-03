import { VinomatrixApi } from "@vinomatrix/domain/api";
import { Layer } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { ParcelsHttp } from "./parcels/http.ts";
import { SystemHttp } from "./system/http.ts";

// HTTP routes for the whole API. Still needs a ParcelRepo: main.ts provides PostGIS, tests a fake.
export const ApiRoutes = HttpApiBuilder.layer(VinomatrixApi).pipe(
  Layer.provide([ParcelsHttp, SystemHttp]),
);
