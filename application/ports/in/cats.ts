import { Context, Effect } from "effect";
import { CatId } from "../../../domain/value-objects/cat.ts";
import { Cat } from "../../../domain/entities/cat.ts";
import { CatNotFound } from "../../../domain/errors/cat-not-found.ts";
import { CatInvalid } from "../../../domain/errors/cat-invalid.ts";

export class CatsServicePort extends Context.Tag("Cats/Service")<
  CatsServicePort,
  {
    readonly getAllCats: Effect.Effect<ReadonlyArray<Cat>, never>;
    readonly getCatById: (id: CatId) => Effect.Effect<Cat, CatNotFound>;
    readonly createCat: (
      name: string,
      breed: string,
      birthDate: Date,
      deathDate?: Date,
    ) => Effect.Effect<Cat, CatInvalid>;
    readonly updateCat: (
      id: CatId,
      data: Partial<Omit<Cat, "id">>,
    ) => Effect.Effect<Cat, CatNotFound>;
    readonly deleteCat: (id: CatId) => Effect.Effect<void, CatNotFound>;
  }
>() { }
