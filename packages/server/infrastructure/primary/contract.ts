import { HttpApi } from "@effect/platform";
import { catsApiGroup } from "./cats.contract.ts";
import { healthApiGroup } from "./health.contract.ts";

export const contract = HttpApi.make("myApi").add(catsApiGroup).add(
  healthApiGroup,
);
