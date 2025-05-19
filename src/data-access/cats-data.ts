import { Array, Context, Effect, HashMap, Layer, Ref } from "effect";
import { Cat, CatId } from "../domain/cats";
import { CatNotFoundError } from "../domain/errors";

export class CatsData extends Context.Tag("CatsData")<
  CatsData,
  {
    readonly findById: (id: string) => Effect.Effect<Cat, CatNotFoundError>;
    readonly persist: (cat: Cat) => Effect.Effect<void>;
    readonly findAll: () => Effect.Effect<ReadonlyArray<Cat>>;
    readonly removeById: (id: string) => Effect.Effect<void, CatNotFoundError>;
  }
>() {}

export const makeCatsData = Effect.gen(function* () {
  const catsState = yield* Ref.make(HashMap.empty<CatId, Cat>());

  const findById = (id: string): Effect.Effect<Cat, CatNotFoundError> =>
    Ref.get(catsState).pipe(
      Effect.flatMap(HashMap.get(id as CatId)),
      Effect.catchTag(
        "NoSuchElementException",
        () => new CatNotFoundError({ id }),
      ),
    );

  const persist = (cat: Cat): Effect.Effect<void> =>
    Ref.update(catsState, HashMap.set(cat.id, cat));

  const findAll = (): Effect.Effect<ReadonlyArray<Cat>> =>
    Ref.get(catsState).pipe(
      Effect.map(HashMap.values),
      Effect.map(Array.fromIterable),
    );

  const removeById = (id: string): Effect.Effect<void, CatNotFoundError> =>
    Ref.get(catsState).pipe(
      Effect.flatMap((catsMap) =>
        HashMap.has(catsMap, id as CatId)
          ? Ref.update(catsState, HashMap.remove(id as CatId))
          : Effect.fail(new CatNotFoundError({ id })),
      ),
    );

  return {
    findById,
    persist,
    findAll,
    removeById,
  } as const;
});

export const CatsDataLayer = Layer.effect(CatsData, makeCatsData);
