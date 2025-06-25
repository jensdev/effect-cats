import { createServer } from "node:http";
import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Config, Effect, Layer } from "effect";

import { CatsApplicationServiceLive } from "./CatsApplicationService.ts"; // Import CatsApplicationServiceLive
import { CatsRepositoryAdapterInMemoryLive } from "./CatsRepositoryAdapter.ts";
import { catsApiLiveGroup } from "./CatsApiImpl.ts";
import { healthApiLiveGroup } from "./HealthApiImpl.ts";
import { api } from "@effect-cats/domain";

// Create a combined layer for the application services
const AppLive = Layer.provide(
  CatsApplicationServiceLive, // Use CatsApplicationServiceLive
  CatsRepositoryAdapterInMemoryLive,
);
// This will be the main export for the server to build the API
const ApiLive = HttpApiBuilder.api(api).pipe(
  Layer.provide(catsApiLiveGroup),
  Layer.provide(healthApiLiveGroup),
);

const PORT = Config.number("PORT").pipe(Config.withDefault(3000));

const HttpLive = Effect.gen(function* (_) {
  const port = yield* _(PORT);
  return HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
    Layer.provide(HttpApiSwagger.layer()),
    Layer.provide(ApiLive),
    Layer.provide(AppLive),
    Layer.provide(NodeHttpServer.layer(createServer, { port })),
  );
}).pipe(Layer.unwrapEffect);

Layer.launch(HttpLive).pipe(NodeRuntime.runMain);
