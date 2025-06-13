import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { CatsApi } from "@effect-cats/domain";
import { Effect } from "effect";

// Create a program that derives and uses the client
const program = Effect.gen(function* () {
  // Derive the client
  const client = yield* HttpApiClient.make(CatsApi, {
    baseUrl: "http://localhost:3000",
  });
  // Call the `getUser` endpoint
  const cats = yield* client.cats.getAllCats();
  console.log(cats);
});

// Provide a Fetch-based HTTP client and run the program
Effect.runFork(program.pipe(Effect.provide(FetchHttpClient.layer)));
