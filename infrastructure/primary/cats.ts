import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { CatsServicePort } from "../../application/ports/in/cats.ts";
import { contract } from "./contract.ts";

export const catsApiLiveGroup = HttpApiBuilder.group(
  contract,
  "cats",
  (handlers) =>
    Effect.gen(function* () {
      const catsService = yield* CatsServicePort;
      return handlers
        .handle("getAllCats", () => catsService.getAllCats)
        .handle("getCatById", ({ path: { id } }) => catsService.getCatById(id))
        .handle(
          "createCat",
          ({ payload: { name, breed, birthDate } }) =>
            catsService.createCat(name, breed, birthDate),
        )
        .handle(
          "updateCat",
          ({ path: { id }, payload }) => catsService.updateCat(id, payload),
        )
        .handle("deleteCat", ({ path: { id } }) => catsService.deleteCat(id));
    }),
);
