import { Array, Context, Effect, HashMap, Layer, Ref } from "effect";
import { Cat, CatId } from "../domain/cats";
import { CatNotFoundError } from "../domain/errors";

/**
 * Interface for a collection of operations to access and persist cats.
 * It is implemented by `makeCatsData`.
 *
 * @see makeCatsData
 */
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

  /**
   * Finds a cat by its ID.
   * @param id The ID of the cat to find.
   * @returns An Effect that resolves to the Cat if found, or fails with a CatNotFoundError.
   */
  const findById = (id: string): Effect.Effect<Cat, CatNotFoundError> =>
    Ref.get(catsState).pipe(
      Effect.flatMap(HashMap.get(id as CatId)),
      Effect.catchTag(
        "NoSuchElementException",
        () => new CatNotFoundError({ id }),
      ),
    );

  /**
   * Persists a cat to the data store.
   * If a cat with the same ID already exists, it will be overwritten.
   * @param cat The cat to persist.
   * @returns An Effect that resolves when the cat has been persisted.
   */
  const persist = (cat: Cat): Effect.Effect<void> =>
    Ref.update(catsState, HashMap.set(cat.id, cat));

  /**
   * Retrieves all cats from the data store.
   * @returns An Effect that resolves to a readonly array of all cats.
   */
  const findAll = (): Effect.Effect<ReadonlyArray<Cat>> =>
    Ref.get(catsState).pipe(
      Effect.map(HashMap.values),
      Effect.map(Array.fromIterable),
    );

  /**
   * Removes a cat from the data store by its ID.
   * @param id The ID of the cat to remove.
   * @returns An Effect that resolves if the cat is successfully removed, or fails with a CatNotFoundError if the cat is not found.
   */
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
