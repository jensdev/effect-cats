import { createServer } from "node:http";
import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Config, Effect, Layer } from "effect";
import { ApiLive } from "./Api.ts";
import { CatsRepositoryLive } from "./CatsRepository.ts";
import { CatsServiceLive } from "./CatsService.ts"; // Import CatsServiceLive

// Create a combined layer for the application services
const AppLive = Layer.provide(CatsServiceLive, CatsRepositoryLive);

const PORT = Config.number("PORT").pipe(Config.withDefault(3000));

const HttpLive = Effect.gen(function* (_) {
  const port = yield* _(PORT);
  return HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
    Layer.provide(HttpApiSwagger.layer()),
    Layer.provide(ApiLive),
    Layer.provide(AppLive), // Provide the combined AppLive which includes CatsServiceLive
    Layer.provide(NodeHttpServer.layer(createServer, { port })),
  );
}).pipe(Layer.unwrapEffect);

Layer.launch(HttpLive).pipe(NodeRuntime.runMain);
