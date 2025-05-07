import { Context, Effect, HashMap, Layer, Ref } from "effect";
import { Cat, CatId } from "../domain/cats";
import { CatNotFoundError } from "../domain/errors";

export class Cats extends Context.Tag("Cats")<
  Cats,
  {
    readonly findById: (id: string) => Effect.Effect<Cat, CatNotFoundError>;
    readonly persist: (cat: Cat) => Effect.Effect<string>;
    readonly findAll: () => Effect.Effect<ReadonlyArray<Cat>>;
  }
>() {}

export const makeCats = Effect.gen(function* () {
  const cats = yield* Ref.make(HashMap.empty<CatId, Cat>());

  const findById = Effect.fn("Cats.findById")(function* (id: string) {
    yield* Effect.log(`findById${id}`).pipe(Effect.annotateLogs({ id }));

    return yield* Ref.get(cats).pipe(
      Effect.flatMap(HashMap.get(id)),
      Effect.catchTag(
        "NoSuchElementException",
        () => new CatNotFoundError({ id }),
      ),
    );
  });

  const persist = Effect.fn("Cats.persist")(function* (cat: Cat) {
    yield* Effect.log(`persist cat ${cat}`).pipe(Effect.annotateLogs({ cat }));
    return yield* Effect.succeed("Saved");
  });

  const findAll = Effect.fn("Cats.findAll")(function* () {
    yield* Effect.log("findAll cats");
    return yield* Ref.get(cats).pipe(
      Effect.map(HashMap.values),
      Effect.map(Array.from),
    );
  });

  return {
    findById,
    persist,
    findAll,
  } as const; // Using "as const" to keep the types readonly and strict
});

export const CatsLayer = Layer.effect(Cats, makeCats);
