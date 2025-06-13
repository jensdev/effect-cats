import { HttpApiClient } from "@effect/platform";
import { CatsApi } from "@effect-cats/domain";
import { NodeHttpClient } from "@effect/platform-node";
import { Effect, Layer } from "effect";

// Create a layer for the HttpApiClient
const HttpLive = NodeHttpClient.layer;

// Create the client, providing the base URL
export const client = HttpApiClient.make(
  CatsApi,
  HttpApiClient.baseUrl("http://localhost:3000"),
);

// To use the client, you'd typically provide its layer
// For example: Effect.provide(client.getAllCats, HttpLive)
// Or more commonly, compose it into a larger application layer.

// For direct use in simple scripts if top-level await is available or within an Effect program
// This is a simplified example of how one might run an effect with the client
export const getAllCats = Effect.provide(client.getAllCats, HttpLive);
export const createCat = (cat: Parameters<typeof client.createCat>[0]) => Effect.provide(client.createCat(cat), HttpLive);
