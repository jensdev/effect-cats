import { Cat, CatId, CatNotFound } from "@effect-cats/domain";
import { Context, Effect, Layer } from "effect";
import { CatsRepository } from "./CatsRepository.ts";

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
      getAllCats: Effect.logDebug("getAllCats called").pipe(
        Effect.flatMap(() => repository.getAll),
        Effect.tap((cats) => Effect.logInfo(`Retrieved ${cats.length} cats`)),
        Effect.withSpan("CatsService/getAllCats"),
      ),
      getCatById: (id: CatId) =>
        Effect.logDebug(`getCatById called with id: ${id}`).pipe(
          Effect.flatMap(() => repository.getById(id)),
          Effect.tap((cat) => Effect.logInfo(`Retrieved cat: ${cat.name}`)),
          Effect.tapErrorTag("CatNotFound", (e) =>
            Effect.logWarning(`Cat with id: ${e.id} not found`),
          ),
          Effect.withSpan("CatsService/getCatById", {
            attributes: { "cat.id": id },
          }),
        ),
      createCat: (name: string, breed: string, age: number) =>
        Effect.logDebug(`createCat called with name: ${name}`).pipe(
          Effect.flatMap(() => repository.create(name, breed, age)),
          Effect.tap((cat) =>
            Effect.logInfo(`Created cat: ${cat.name} with id: ${cat.id}`),
          ),
          Effect.withSpan("CatsService/createCat", {
            attributes: {
              "cat.name": name,
              "cat.breed": breed,
              "cat.age": age,
            },
          }),
        ),
      updateCat: (id: CatId, data: Partial<Omit<Cat, "id">>) =>
        Effect.logDebug(`updateCat called with id: ${id}`).pipe(
          Effect.flatMap(() => repository.update(id, data)),
          Effect.tap((cat) => Effect.logInfo(`Updated cat: ${cat.name}`)),
          Effect.tapErrorTag("CatNotFound", (e) =>
            Effect.logWarning(`Cat with id: ${e.id} not found during update`),
          ),
          Effect.withSpan("CatsService/updateCat", {
            attributes: { "cat.id": id, "cat.updateData": true },
          }),
        ),
      deleteCat: (id: CatId) =>
        Effect.logDebug(`deleteCat called with id: ${id}`).pipe(
          Effect.flatMap(() => repository.remove(id)),
          Effect.tap(() =>
            Effect.logInfo(`Attempted to delete cat with id: ${id}`),
          ),
          Effect.tapErrorTag("CatNotFound", (e) =>
            Effect.logWarning(`Cat with id: ${e.id} not found for deletion`),
          ),
          Effect.withSpan("CatsService/deleteCat", {
            attributes: { "cat.id": id },
          }),
        ),
    };
  }),
);
