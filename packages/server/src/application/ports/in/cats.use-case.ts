import { Cat, CatId, CatNotFound } from "@effect-cats/domain";
import { Context, Effect } from "effect";

export class CatsServicePort extends Context.Tag("Cats/Service")<
  CatsServicePort,
  {
    readonly getAllCats: Effect.Effect<ReadonlyArray<Cat>, never>;
    readonly getCatById: (id: CatId) => Effect.Effect<Cat, CatNotFound>;
    readonly createCat: (
      name: string,
      breed: string,
      age: number,
    ) => Effect.Effect<Cat, never>;
    readonly updateCat: (
      id: CatId,
      data: Partial<Omit<Cat, "id">>,
    ) => Effect.Effect<Cat, CatNotFound>;
    readonly deleteCat: (id: CatId) => Effect.Effect<void, CatNotFound>;
  }
>() {}
