import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { api } from "@effect-cats/domain";
import { Config, Effect } from "effect";

const baseUrlConfig = Config.string("BASE_URL").pipe(
  Config.withDefault("http://localhost:3000"),
);

const program = Effect.gen(function* () {
  const baseUrl = yield* baseUrlConfig;
  const client = yield* HttpApiClient.make(api, {
    baseUrl,
  });
  const result = yield* Effect.either(client.cats.getAllCats());

  if (result._tag === "Left") {
    yield* Effect.logError("Error fetching cats:", result.left);
  } else {
    // Keep console.log for successful output as it's typical for CLIs
    console.log(result.right);
  }
});

Effect.runFork(program.pipe(Effect.provide(FetchHttpClient.layer)));
