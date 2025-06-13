import { Cat, CatId, CatNotFound } from "@effect-cats/domain";
import { Array, Context, Effect, Layer, Option } from "effect";

// Create a context tag for the repository
export class CatsRepository extends Context.Tag("Cats/Repository")<
  CatsRepository,
  {
    readonly getAll: Effect.Effect<ReadonlyArray<Cat>, never>;
    readonly getById: (id: CatId) => Effect.Effect<Cat, CatNotFound>;
    readonly create: (
      name: string,
      breed: string,
      age: number,
    ) => Effect.Effect<Cat, never>;
    readonly update: (
      id: CatId,
      data: Partial<Omit<Cat, "id">>,
    ) => Effect.Effect<Cat, CatNotFound>;
    readonly remove: (id: CatId) => Effect.Effect<void, CatNotFound>;
  }
>() {}

// Implement an in-memory version of the repository
export const CatsRepositoryLive = Layer.sync(CatsRepository, () => {
  let catsStore: Map<number, Cat> = new Map();
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
    create: (name: string, breed: string, age: number) =>
      Effect.sync(() => {
        const id = getNextId();
        const newCat = new Cat({ id, name, breed, age });
        catsStore.set(id, newCat);
        return newCat;
      }).pipe(
        Effect.withSpan("CatsRepository/create", {
          attributes: { "cat.name": name, "cat.breed": breed, "cat.age": age },
        }),
      ),
    update: (id: CatId, data: Partial<Omit<Cat, "id">>) =>
      Effect.gen(function* (_) {
        const cat = yield* _(
          Option.fromNullable(catsStore.get(id)),
          Effect.mapError(() => new CatNotFound({ id })),
        );
        const updatedCat = new Cat({ ...cat, ...data, id: cat.id }); // Ensure id is not changed
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
});
