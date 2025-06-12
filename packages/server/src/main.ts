import { createServer } from "node:http";
import { HttpApiBuilder, HttpMiddleware } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { ApiLive } from "./Api.js";
import { CatsRepositoryLive } from "./CatsRepository.js";
import { CatsServiceLive } from "./CatsService.js"; // Import CatsServiceLive

// Create a combined layer for the application services
const AppLive = Layer.provide(CatsServiceLive, CatsRepositoryLive);

const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(ApiLive),
  // Layer.provide(CatsRepositoryLive), // CatsRepositoryLive is now provided to CatsServiceLive
  Layer.provide(AppLive), // Provide the combined AppLive which includes CatsServiceLive
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);

Layer.launch(HttpLive).pipe(NodeRuntime.runMain);
