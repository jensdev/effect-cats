import { HttpApiBuilder } from "@effect/platform";
import { CatsApi } from "@effect-cats/domain";
import { Layer } from "effect";
import { CatsApiLive } from "./CatsApiImpl.ts";
import { CatsRepositoryLive } from "./CatsRepository.ts";

// This will be the main export for the server to build the API
export const ApiLive = HttpApiBuilder.api(CatsApi).pipe(
  Layer.provide(CatsApiLive),
  Layer.provide(CatsRepositoryLive), // Provide the repository layer as well
);
