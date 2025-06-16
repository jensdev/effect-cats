import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { CatsApi } from "@effect-cats/domain";
import { Config, Effect } from "effect";

// Define the configuration for the baseUrl
const baseUrlConfig = Config.string("BASE_URL").pipe(
  Config.withDefault("http://localhost:3000"),
);

// Create a program that derives and uses the client
const program = Effect.gen(function* () {
  const baseUrl = yield* baseUrlConfig;
  // Derive the client
  const client = yield* HttpApiClient.make(CatsApi, {
    baseUrl,
  });
  // Call the `getUser` endpoint
  const result = yield* Effect.either(client.cats.getAllCats());

  if (result._tag === "Left") {
    // Handle error
    console.error("Error fetching cats:", result.left);
  } else {
    // Handle success
    console.log(result.right);
  }
});

// Provide a Fetch-based HTTP client and run the program
Effect.runFork(program.pipe(Effect.provide(FetchHttpClient.layer)));
