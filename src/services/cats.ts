import { Context, Effect, Layer } from "effect";
import { CatsData } from "../data-access/cats-data";
import { Cat } from "../domain/cats";
import { CatNotFoundError } from "../domain/errors";

/**
 * Represents the main service for managing cat-related operations.
 * This class defines the interface for the Cats service, which is implemented by `makeCats`.
 *
 * @see makeCats
 * @see CatsLayer
 */
export class Cats extends Context.Tag("Cats")<
  Cats,
  {
    readonly findById: (id: string) => Effect.Effect<Cat, CatNotFoundError>;
    readonly persist: (cat: Cat) => Effect.Effect<string>;
    readonly findAll: () => Effect.Effect<ReadonlyArray<Cat>>;
    readonly removeById: (id: string) => Effect.Effect<void, CatNotFoundError>;
  }
>() {}

export const makeCats = Effect.gen(function* () {
  const catsData = yield* CatsData;

  /**
   * Finds a cat by its ID using the CatsData service.
   * Includes logging before and after the data access call.
   * @param id The ID of the cat to find.
   * @returns An Effect that resolves to the Cat if found, or fails with a CatNotFoundError.
   */
  const findById = Effect.fn("Cats.findById")(function* (id: string) {
    yield* Effect.log(`findById ${id}`).pipe(Effect.annotateLogs({ id }));
    return yield* catsData.findById(id);
  });

  /**
   * Persists a cat using the CatsData service.
   * Includes logging before the data access call.
   * @param cat The cat to persist.
   * @returns An Effect that resolves to a success message ("Saved") when the cat has been persisted.
   */
  const persist = Effect.fn("Cats.persist")(function* (cat: Cat) {
    yield* Effect.log(`persist cat ${cat.name}`).pipe(
      Effect.annotateLogs({ catId: cat.id }),
    );
    yield* catsData.persist(cat);
    return yield* Effect.succeed("Saved");
  });

  /**
   * Retrieves all cats using the CatsData service.
   * Includes logging before the data access call.
   * @returns An Effect that resolves to a readonly array of all cats.
   */
  const findAll = Effect.fn("Cats.findAll")(function* () {
    yield* Effect.log("findAll cats");
    return yield* catsData.findAll();
  });

  /**
   * Removes a cat by its ID using the CatsData service.
   * Includes logging before the data access call.
   * @param id The ID of the cat to remove.
   * @returns An Effect that resolves if the cat is successfully removed, or fails with a CatNotFoundError if the cat is not found.
   */
  const removeById = Effect.fn("Cats.removeById")(function* (id: string) {
    yield* Effect.log(`removeById ${id}`).pipe(Effect.annotateLogs({ id }));
    return yield* catsData.removeById(id);
  });

  return {
    findById,
    persist,
    findAll,
    removeById,
  } as const; // Using "as const" to keep the types readonly and strict
});

/**
 * Provides the implementation for the Cats service.
 * This layer wires up the `makeCats` constructor, which itself depends on `CatsData`.
 */
export const CatsLayer = Layer.effect(Cats, makeCats);
