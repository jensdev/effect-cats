import { Effect } from "effect";
import { CatsService } from "./CatsService.ts"; // Import CatsService
import { HttpApiBuilder } from "@effect/platform";
import { api } from "@effect-cats/domain";

export const catsApiLiveGroup = HttpApiBuilder.group(
  api,
  "cats",
  (handlers) =>
    Effect.gen(function* (_) {
      const catsService = yield* _(CatsService); // Use CatsService
      return handlers
        .handle("getAllCats", () => catsService.getAllCats) // Use CatsService method
        .handle("getCatById", ({ path: { id } }) => catsService.getCatById(id)) // Use CatsService method
        .handle(
          "createCat",
          ({ payload: { name, breed, age } }) =>
            catsService.createCat(name, breed, age), // Use CatsService method
        )
        .handle(
          "updateCat",
          ({ path: { id }, payload }) => catsService.updateCat(id, payload), // Use CatsService method
        )
        .handle("deleteCat", ({ path: { id } }) => catsService.deleteCat(id)); // Use CatsService method
    }),
);
