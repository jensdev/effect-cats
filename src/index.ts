import { DevTools } from "@effect/experimental";
import { NodeRuntime, NodeSocket } from "@effect/platform-node";
import { Effect, Layer, pipe, Schema } from "effect";
import { Cat } from "./domain/cats";
import { Cats, CatsLayer } from "./services/cats";

const program = Effect.gen(function* () {
  const cats = yield* Cats;
  const value = yield* cats.findById("cat-test");
  console.log(value);
});

//       ┌─── Effect<void, CatNotFoundError, never>
//       ▼
const runnableProgram = program.pipe(Effect.provide(CatsLayer));

const DevToolsLive = DevTools.layerWebSocket().pipe(
  Layer.provide(NodeSocket.layerWebSocketConstructor),
);

pipe(runnableProgram, Effect.provide(DevToolsLive), NodeRuntime.runMain);
