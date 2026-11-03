import { Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/http";
import { afterAll, describe, expect, it } from "vitest";
import { ApiRoutes } from "./server.ts";

describe("ApiRoutes", () => {
  const { handler, dispose } = HttpRouter.toWebHandler(
    ApiRoutes.pipe(Layer.provide(HttpServer.layerServices)),
  );
  afterAll(dispose);

  it("answers 404 for routes outside the contract", async () => {
    const response = await handler(new Request("http://localhost/nope"));
    expect(response.status).toBe(404);
  });
});
