import { HttpApiBuilder } from "@effect/platform";
import { CatsApi } from "@template/domain/CatsApi";
import { Effect, Layer } from "effect";
import { CatsRepository } from "./CatsRepository.js";

export const CatsApiLive = HttpApiBuilder.group(CatsApi, "cats", (handlers) =>
  Effect.gen(function* (_) {
    const catsRepo = yield* _(CatsRepository);
    return handlers
      .handle("getAllCats", () => catsRepo.getAll)
      .handle("getCatById", ({ path: { id } }) => catsRepo.getById(id))
      .handle("createCat", ({ payload: { name, breed, age } }) => catsRepo.create(name, breed, age))
      .handle("updateCat", ({ path: { id }, payload }) => catsRepo.update(id, payload))
      .handle("deleteCat", ({ path: { id } }) => catsRepo.remove(id));
  })
);
