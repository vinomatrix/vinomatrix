import { HttpApi } from "effect/http-api";

// HttpApi contract shared by apps/api (implements it) and apps/web (calls it).
export class VinomatrixApi extends HttpApi.make("vinomatrix") {}
