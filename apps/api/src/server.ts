import { VinomatrixApi } from "@vinomatrix/domain/api";
import { HttpApiBuilder } from "effect/http-api";

// HTTP routes for the whole API. main.ts serves them; tests call them in memory.
export const ApiRoutes = HttpApiBuilder.layer(VinomatrixApi);
