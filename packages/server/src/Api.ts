import { HttpApiBuilder } from "@effect/platform";
import { CatsApi } from "@effect-cats/domain/CatsApi";
import { Layer } from "effect";
import { CatsApiLive } from "./CatsApiImpl.js";
import { CatsRepositoryLive } from "./CatsRepository.js";

// This will be the main export for the server to build the API
export const ApiLive = HttpApiBuilder.api(CatsApi).pipe(
  Layer.provide(CatsApiLive),
  Layer.provide(CatsRepositoryLive), // Provide the repository layer as well
);
