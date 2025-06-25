import { Effect } from "effect";
import { CatsServicePort } from "./CatsServicePort.ts"; // Import CatsServicePort
import { HttpApiBuilder } from "@effect/platform";
import { api } from "@effect-cats/domain";

export const catsApiLiveGroup = HttpApiBuilder.group(
  api,
  "cats",
  (handlers) =>
    Effect.gen(function* (_) {
      const catsService = yield* _(CatsServicePort); // Use CatsServicePort
      return handlers
        .handle("getAllCats", () => catsService.getAllCats) // Use CatsServicePort method
        .handle("getCatById", ({ path: { id } }) => catsService.getCatById(id)) // Use CatsServicePort method
        .handle(
          "createCat",
          ({ payload: { name, breed, age } }) =>
            catsService.createCat(name, breed, age), // Use CatsServicePort method
        )
        .handle(
          "updateCat",
          ({ path: { id }, payload }) => catsService.updateCat(id, payload), // Use CatsServicePort method
        )
        .handle("deleteCat", ({ path: { id } }) => catsService.deleteCat(id)); // Use CatsServicePort method
    }),
);
