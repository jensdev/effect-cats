import { Context, Effect } from "effect";
import { CatId } from "../../../domain/value-objects/cat.ts";
import { Cat } from "../../../domain/entities/cat.ts";
import { CatNotFound } from "../../../domain/errors/cat-not-found.ts";

export class CatsRepositoryPort extends Context.Tag("Cats/Repository")<
  CatsRepositoryPort,
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
