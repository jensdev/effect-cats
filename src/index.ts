import { DevTools } from "@effect/experimental";
import { NodeRuntime, NodeSocket } from "@effect/platform-node";
import { Effect, Layer, pipe } from "effect";
// import { Cat } from "./domain/cats"; // Cat not directly used here anymore
import { Cats, CatsLayer } from "./services/cats";
import { CatsDataLayer } from "./data-access/cats-data";

const program = Effect.gen(function* () {
  const catsService = yield* Cats;

  // Example: Persist a cat
  // const newCat = new Cat({ id: "cat1" as CatId, name: "Whiskers", age: 2, breed: "Bombay" });
  // yield* catsService.persist(newCat);

  // Example: Find a cat
  const foundCat = yield* catsService.findById("cat1");
  console.log("Found cat:", foundCat);

  // Example: Find all cats
  // const allCats = yield* catsService.findAll();
  // console.log("All cats:", allCats);
});

const AppLayer = Layer.merge(CatsLayer, CatsDataLayer);

//       ┌─── Effect<void, CatNotFoundError, never>
//       ▼
const runnableProgram = program.pipe(Effect.provide(AppLayer));

const DevToolsLive = DevTools.layerWebSocket().pipe(
  Layer.provide(NodeSocket.layerWebSocketConstructor),
);

pipe(runnableProgram, Effect.provide(DevToolsLive), NodeRuntime.runMain);
