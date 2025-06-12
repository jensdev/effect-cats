import { Cat, CatId, CatNotFound } from "@effect-cats/domain";
import { Context, Effect, Layer } from "effect";
import { CatsRepository } from "./CatsRepository.js";

// Define the interface for our service
export class CatsService extends Context.Tag("Cats/Service")<
  CatsService,
  {
    readonly getAllCats: Effect.Effect<ReadonlyArray<Cat>, never>;
    readonly getCatById: (id: CatId) => Effect.Effect<Cat, CatNotFound>;
    readonly createCat: (
      name: string,
      breed: string,
      age: number,
    ) => Effect.Effect<Cat, never>;
    readonly updateCat: (
      id: CatId,
      data: Partial<Omit<Cat, "id">>,
    ) => Effect.Effect<Cat, CatNotFound>;
    readonly deleteCat: (id: CatId) => Effect.Effect<void, CatNotFound>;
  }
>() {}

// Implement the service
export const CatsServiceLive = Layer.effect(
  CatsService,
  Effect.gen(function* (_) {
    const repository = yield* _(CatsRepository);

    return {
      getAllCats: repository.getAll,
      getCatById: (id: CatId) => repository.getById(id),
      createCat: (name: string, breed: string, age: number) =>
        repository.create(name, breed, age),
      updateCat: (id: CatId, data: Partial<Omit<Cat, "id">>) =>
        repository.update(id, data),
      deleteCat: (id: CatId) => repository.remove(id),
    };
  }),
);
