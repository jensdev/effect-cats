import { Effect } from "effect";
import { CatsService } from "./CatsService.ts";
import { HttpApiBuilder } from "@effect/platform";
import { api } from "@effect-cats/domain";

export const catsApiLiveGroup = HttpApiBuilder.group(
  api,
  "cats",
  (handlers) =>
    Effect.gen(function* (_) {
      const catsService = yield* _(CatsService);
      return handlers
        .handle("getAllCats", () => catsService.getAllCats)
        .handle("getCatById", ({ path: { id } }) => catsService.getCatById(id))
        .handle(
          "createCat",
          ({ payload: { name, breed, age } }) =>
            catsService.createCat(name, breed, age),
        )
        .handle(
          "updateCat",
          ({ path: { id }, payload }) => catsService.updateCat(id, payload),
        )
        .handle("deleteCat", ({ path: { id } }) => catsService.deleteCat(id));
    }),
);
