import { VinomatrixApi } from "@vinomatrix/domain/api";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { ParcelRepo } from "./ParcelRepo.ts";

// Inbound adapter for the `parcels` group: the bbox is already decoded by the contract.
export const ParcelsHttp = HttpApiBuilder.group(
  VinomatrixApi,
  "parcels",
  Effect.fn(function* (handlers) {
    const parcels = yield* ParcelRepo;
    return handlers.handle("list", ({ query }) => parcels.findByBbox(query.bbox));
  }),
);
