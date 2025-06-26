import { Array, Effect, Layer, Option } from "effect";
import { CatsRepositoryPort } from "../../application/ports/out/cat.repository.ts";
import { Cat } from "../../domain/entities/cat.ts";
import { CatNotFound } from "../../domain/errors/cat-not-found.ts";
import { CatId } from "../../domain/value-objects/cat.ts";

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
      getById: (id: CatId) =>
        Option.fromNullable(catsStore.get(id)).pipe(
          Effect.mapError(() => new CatNotFound({ id })),
          Effect.withSpan("CatsRepository/getById", {
            attributes: { "cat.id": id },
          }),
        ),
      create: (name: string, breed: string, birthDate: Date) =>
        Effect.sync(() => {
          const id = getNextId();
          const newCat = new Cat({ id, name, breed, birthDate });
          catsStore.set(id, newCat);
          return newCat;
        }).pipe(
          Effect.withSpan("CatsRepository/create", {
            attributes: {
              "cat.name": name,
              "cat.breed": breed,
              "cat.birthDate": birthDate.toISOString(),
            },
          }),
        ),
      update: (id: CatId, data: Partial<Omit<Cat, "id" | "age">>) =>
        Effect.gen(function* (_) {
          const cat = yield* _(
            Option.fromNullable(catsStore.get(id)),
            Effect.mapError(() => new CatNotFound({ id })),
          );
          // Ensure the original cat ID is preserved, only other fields are updated.
          const updatedCat = new Cat({ ...cat, ...data, id: cat.id });
          catsStore.set(id, updatedCat);
          return updatedCat;
        }).pipe(
          Effect.withSpan("CatsRepository/update", {
            attributes: { "cat.id": id },
          }),
        ),
      remove: (id: CatId) =>
        Effect.if(catsStore.has(id), {
          onTrue: () => Effect.sync(() => void catsStore.delete(id)),
          onFalse: () => Effect.fail(new CatNotFound({ id })),
        }).pipe(
          Effect.withSpan("CatsRepository/remove", {
            attributes: { "cat.id": id },
          }),
        ),
    };
  },
);
