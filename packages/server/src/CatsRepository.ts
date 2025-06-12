import { Cat, CatId, CatNotFound } from "@effect-cats/domain";
import { Array, Context, Data, Effect, Layer, Option } from "effect";

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
    getAll: Effect.sync(() => Array.fromIterable(catsStore.values())),
    getById: (id: CatId) =>
      Option.fromNullable(catsStore.get(id)).pipe(
        Effect.mapError(() => new CatNotFound({ id })),
      ),
    create: (name: string, breed: string, age: number) =>
      Effect.sync(() => {
        const id = getNextId();
        const newCat = new Cat({ id, name, breed, age });
        catsStore.set(id, newCat);
        return newCat;
      }),
    update: (id: CatId, data: Partial<Omit<Cat, "id">>) =>
      Effect.gen(function* (_) {
        const cat = yield* _(
          Option.fromNullable(catsStore.get(id)),
          Effect.mapError(() => new CatNotFound({ id })),
        );
        const updatedCat = new Cat({ ...cat, ...data, id: cat.id }); // Ensure id is not changed
        catsStore.set(id, updatedCat);
        return updatedCat;
      }),
    remove: (id: CatId) =>
      Effect.sync(() => {
        if (catsStore.has(id)) {
          catsStore.delete(id);
          return Effect.void;
        }
        return Effect.fail(new CatNotFound({ id }));
      }).pipe(Effect.flatten),
  };
});
