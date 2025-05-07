import { Context, Effect, Layer } from "effect";
import { Cat } from "../domain/cats";
import { CatNotFoundError } from "../domain/errors";
import { CatsData } from "../data-access/cats-data";

export class Cats extends Context.Tag("Cats")<
  Cats,
  {
    readonly findById: (id: string) => Effect.Effect<Cat, CatNotFoundError>;
    readonly persist: (cat: Cat) => Effect.Effect<string>;
    readonly findAll: () => Effect.Effect<ReadonlyArray<Cat>>;
  }
>() {}

export const makeCats = Effect.gen(function* () {
  const catsData = yield* CatsData;

  const findById = Effect.fn("Cats.findById")(function* (id: string) {
    yield* Effect.log(`findById ${id}`).pipe(Effect.annotateLogs({ id }));
    return yield* catsData.findById(id);
  });

  const persist = Effect.fn("Cats.persist")(function* (cat: Cat) {
    yield* Effect.log(`persist cat ${cat.name}`).pipe(Effect.annotateLogs({ catId: cat.id }));
    yield* catsData.persist(cat);
    return yield* Effect.succeed("Saved");
  });

  const findAll = Effect.fn("Cats.findAll")(function* () {
    yield* Effect.log("findAll cats");
    return yield* catsData.findAll();
  });

  return {
    findById,
    persist,
    findAll,
  } as const; // Using "as const" to keep the types readonly and strict
});

export const CatsLayer = Layer.effect(Cats, makeCats);
