import { Array, Effect, Either, Layer, Option, Schema } from "effect";
import { CatsRepositoryPort } from "../../application/ports/out/cat.repository.ts";
import { Cat } from "../../domain/entities/cat.ts";
import { CatNotFound } from "../../domain/errors/cat-not-found.ts";
import { CatId } from "../../domain/value-objects/cat.ts";
import { CatInvalid } from "../../domain/errors/cat-invalid.ts";

export const CatsRepositoryInMemoryLive = Layer.sync(
  CatsRepositoryPort,
  () => {
    const catsStore: Map<number, Cat> = new Map();
    let nextId = 1;

    const getNextId = (): CatId => CatId.make(nextId++);

    return {
      getAll: Effect.sync(() => Array.fromIterable(catsStore.values())).pipe(
        Effect.withSpan("CatsRepository/getAll"),
      ),
      getById: Effect.fn("CatsRepository/getById")((id: CatId) =>
        Option.fromNullable(catsStore.get(id)).pipe(
          Effect.mapError(() => new CatNotFound({ id })),
        )
      ),
      create: (name: string, breed: string, birthDate: Date, deathDate?: Date) =>
        Effect.gen(function* (_) {
          const id = getNextId();
          const safeMakeCat = Schema.validateEither(Cat)
          return yield* Either.match(
            safeMakeCat({ id, name, breed, birthDate, deathDate }),
            {
              onLeft: (left) => Effect.fail(new CatInvalid({ issue: left.issue })),
              onRight: (right) => {
                catsStore.set(id, right)
                return Effect.succeed(right)
              }
            })
        }),
      update: Effect.fn("CatsRepository/update")(
        (id: CatId, data: Partial<Omit<Cat, "id" | "age">>) =>
          Effect.gen(function* (_) {
            const cat = yield* _(
              Option.fromNullable(catsStore.get(id)),
              Effect.mapError(() => new CatNotFound({ id })),
            );
            // Ensure the original cat ID is preserved, only other fields are updated.
            const updatedCat = new Cat({ ...cat, ...data, id: cat.id });
            catsStore.set(id, updatedCat);
            return updatedCat;
          }),
      ),
      remove: Effect.fn("CatsRepository/remove")((id: CatId) =>
        Effect.if(catsStore.has(id), {
          onTrue: () => Effect.sync(() => void catsStore.delete(id)),
          onFalse: () => Effect.fail(new CatNotFound({ id })),
        })
      ),
    };
  },
);
