import { VinomatrixApi } from "@vinomatrix/domain/api";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

// Liveness only: answers without touching the database.
export const SystemHttp = HttpApiBuilder.group(VinomatrixApi, "system", (handlers) =>
  Effect.succeed(handlers.handle("health", () => Effect.void)),
);
