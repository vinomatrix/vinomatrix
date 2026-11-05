import { VinomatrixApi } from "@vinomatrix/domain/api";
import type { Bbox, ParcelCollection } from "@vinomatrix/domain/schema";
import { Effect, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/http";
import { HttpApiClient } from "effect/http-api";

// The only place the web app touches Effect: a client generated from the shared contract,
// exposed to TanStack Query as plain promises. In dev, Vite proxies /api to the API server.
const client = HttpApiClient.make(VinomatrixApi, {
  baseUrl: import.meta.env.VITE_API_URL ?? "/api",
});

const runtime = ManagedRuntime.make(FetchHttpClient.layer);

export const fetchParcels = (bbox: Bbox, signal?: AbortSignal): Promise<ParcelCollection> =>
  runtime.runPromise(
    Effect.flatMap(client, (api) => api.parcels.list({ query: { bbox } })),
    { signal },
  );
