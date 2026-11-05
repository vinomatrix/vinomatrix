import { VinomatrixApi } from "@vinomatrix/domain/api";
import { Layer } from "effect";
import { HttpMiddleware, HttpRouter } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";
import { ParcelsHttp } from "./parcels/http.ts";
import { SystemHttp } from "./system/http.ts";

// br/gzip by Accept-Encoding. The parcels GeoJSON for the NE vineyards drops from ~1.1 MB to ~250 KB.
const Compression = HttpRouter.middleware(HttpMiddleware.compression(), { global: true });

// HTTP routes for the whole API. Still needs a ParcelRepo: main.ts provides PostGIS, tests a fake.
export const ApiRoutes = Layer.mergeAll(
  HttpApiBuilder.layer(VinomatrixApi).pipe(Layer.provide([ParcelsHttp, SystemHttp])),
  Compression,
);
