import { Effect, Layer } from "effect";
import { CatsRepositoryPort } from "../ports/out/cat.repository.ts";
import { CatsServicePort } from "../ports/in/cats.ts";
import { CatId } from "../../domain/value-objects/cat.ts";
import { Cat } from "../../domain/entities/cat.ts";

export const CatsServiceLive = Layer.effect(
  CatsServicePort,
  Effect.gen(function* (_) {
    const repository = yield* _(CatsRepositoryPort);

    return {
      getAllCats: Effect.logDebug("getAllCats called").pipe(
        Effect.flatMap(() => repository.getAll),
        Effect.tap((cats) =>
          Effect.logInfo(`Retrieved ${cats.length} cats`)
        ),
        Effect.withSpan("CatsService/getAllCats"),
      ),
      getCatById: Effect.fn("CatsService/getCatById")((id: CatId) =>
        Effect.logDebug(`getCatById called with id: ${id}`).pipe(
          Effect.flatMap(() => repository.getById(id)),
          Effect.tap((cat) =>
            Effect.logInfo(`Retrieved cat: ${JSON.stringify(cat, null, 2)}`)
          ),
          Effect.tapErrorTag(
            "CatNotFound",
            (e) => Effect.logWarning(`Cat with id: ${e.id} not found`),
          ),
        )
      ),
      createCat: Effect.fn("CatsService/createCat")(
        (name: string, breed: string, birthDate: Date) =>
          Effect.logDebug(`createCat called with name: ${name}`).pipe(
            Effect.flatMap(() => repository.create(name, breed, birthDate)),
            Effect.tap((cat) =>
              Effect.logInfo(`Created cat: ${cat.name} with id: ${cat.id}`)
            ),
          ),
      ),
      updateCat: Effect.fn("CatsService/updateCat")(
        (id: CatId, data: Partial<Omit<Cat, "id" | "age">>) =>
          Effect.logDebug(`updateCat called with id: ${id}`).pipe(
            Effect.flatMap(() => repository.update(id, data)),
            Effect.tap((cat) => Effect.logInfo(`Updated cat: ${cat.name}`)),
            Effect.tapErrorTag(
              "CatNotFound",
              (e) =>
                Effect.logWarning(
                  `Cat with id: ${e.id} not found during update`,
                ),
            ),
          ),
      ),
      deleteCat: Effect.fn("CatsService/deleteCat")((id: CatId) =>
        Effect.logDebug(`deleteCat called with id: ${id}`).pipe(
          Effect.flatMap(() => repository.remove(id)),
          Effect.tap(() =>
            Effect.logInfo(`Attempted to delete cat with id: ${id}`)
          ),
          Effect.tapErrorTag(
            "CatNotFound",
            (e) =>
              Effect.logWarning(`Cat with id: ${e.id} not found for deletion`),
          ),
        )
      ),
    };
  }),
);
