import { HttpApi } from "@effect/platform";
import { catsApiGroup } from "./CatsApi.ts";
import { healthApiGroup } from "./HealthApi.ts";

export * from "./Cats.ts";
export * from "./CatsApi.ts";
export * from "./HealthApi.ts";

export const api = HttpApi.make("myApi").add(catsApiGroup).add(healthApiGroup);
