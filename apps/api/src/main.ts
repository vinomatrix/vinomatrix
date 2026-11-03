import { createServer } from "node:http";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Config, Layer } from "effect";
import { HttpRouter } from "effect/http";
import { ApiRoutes } from "./server.ts";

const HttpLive = HttpRouter.serve(ApiRoutes).pipe(
  Layer.provide(
    NodeHttpServer.layerConfig(createServer, {
      port: Config.Port("PORT").pipe(Config.withDefault(3000)),
    }),
  ),
);

Layer.launch(HttpLive).pipe(NodeRuntime.runMain);
