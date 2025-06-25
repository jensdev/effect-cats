import { Effect, Layer, Schema } from "effect";
import { assert, assertEquals } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";

import { Cat, CatId, CatNotFound } from "@effect-cats/domain";

// Service Port and Application Service imports
import { CatsServicePort } from "./CatsServicePort.ts";
import { CatsApplicationServiceLive } from "./CatsApplicationService.ts";
import { CatsRepositoryPort } from "./CatsRepositoryPort.ts";

// We'll use this Partial type for providing mocks for the repository.
type MockRepoPartial = Partial<CatsRepositoryPort["Type"]>;

const runEffectTest = <E, A>(
  effectToRun: Effect.Effect<A, E, CatsServicePort>, // The effect now needs CatsServicePort
  mockRepoPartialImpl: MockRepoPartial = {}, // Default to empty mock
) => {
  // Create a full mock implementation for the repository
  const fullMockImpl: CatsRepositoryPort["Type"] = {
    getAll: Effect.die("getAll not implemented in mock"),
    getById: (id: CatId) =>
      Effect.die(`getById(${id}) not implemented in mock`),
    create: (name: string, breed: string, age: number) =>
      Effect.die(`create(${name}, ${breed}, ${age}) not implemented in mock`),
    update: (id: CatId, data: Partial<Omit<Cat, "id">>) =>
      Effect.die(
        `update(${id}, ${JSON.stringify(data)}) not implemented in mock`,
      ),
    remove: (id: CatId) => Effect.die(`remove(${id}) not implemented in mock`),
    ...mockRepoPartialImpl, // Override defaults with provided mocks
  };

  // Layer for the mock repository
  const mockCatsRepositoryLayer = Layer.succeed(
    CatsRepositoryPort,
    CatsRepositoryPort.of(fullMockImpl),
  );

  // Provide CatsApplicationServiceLive which depends on CatsRepositoryPort,
  // and then provide the mock repository layer to CatsApplicationServiceLive.
  // CatsApplicationServiceLive provides the implementation for CatsServicePort.
  const testLayer = Layer.provide(
    CatsApplicationServiceLive, // This provides CatsServicePort
    mockCatsRepositoryLayer,    // This provides CatsRepositoryPort to CatsApplicationServiceLive
  );

  // Provide the testLayer (which includes the service and its mock dependency) to the effect to run.
  const providedEffect = Effect.provide(effectToRun, testLayer);

  return Effect.runPromise(providedEffect);
};

describe("CatsApplicationService (using CatsServicePort)", () => {
  it("getAllCats should return an empty array when repository is empty", async () => {
    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsServicePort); // Use CatsServicePort
      const cats = yield* _(service.getAllCats);
      assertEquals(cats.length, 0);
    });

    await runEffectTest(testEffect, {
      getAll: Effect.succeed([] as ReadonlyArray<Cat>),
    });
  });

  it("getAllCats should return cats from the repository", async () => {
    const sampleCats: ReadonlyArray<Cat> = [
      new Cat({
        id: Schema.decodeUnknownSync(CatId)(1),
        name: "Whiskers",
        breed: "Siamese",
        age: 2,
      }),
      new Cat({
        id: Schema.decodeUnknownSync(CatId)(2),
        name: "Shadow",
        breed: "Maine Coon",
        age: 5,
      }),
    ];

    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsServicePort); // Use CatsServicePort
      const cats = yield* _(service.getAllCats);
      assertEquals(cats, sampleCats);
    });

    await runEffectTest(testEffect, {
      getAll: Effect.succeed(sampleCats),
    });
  });

  it("getCatById should return a cat when found", async () => {
    const catId = Schema.decodeUnknownSync(CatId)(3);
    const sampleCat = new Cat({
      id: catId,
      name: "Felix",
      breed: "Tabby",
      age: 3,
    });

    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsServicePort); // Use CatsServicePort
      const cat = yield* _(service.getCatById(catId));
      assertEquals(cat, sampleCat);
    });

    await runEffectTest(testEffect, {
      getById: (id: CatId) =>
        id === catId
          ? Effect.succeed(sampleCat)
          : Effect.die("Unexpected ID in getById mock"),
    });
  });

  it("getCatById should return CatNotFound error when cat is not found", async () => {
    const nonExistentCatId = Schema.decodeUnknownSync(CatId)(99);

    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsServicePort); // Use CatsServicePort
      return yield* _(service.getCatById(nonExistentCatId));
    }).pipe(
      Effect.match({
        onFailure: (error) => {
          assertEquals(error._tag, "CatNotFound");
          if (error._tag === "CatNotFound") {
            assertEquals((error as CatNotFound).id, nonExistentCatId);
          } else {
            assert(
              false,
              "Error was not CatNotFound, or _tag is missing/incorrect.",
            );
          }
        },
        onSuccess: (_cat) => {
          assert(
            false,
            "Expected CatNotFound error to be thrown but got success",
          );
        },
      }),
    );

    await runEffectTest(testEffect, {
      getById: (_id: CatId) =>
        Effect.fail(new CatNotFound({ id: nonExistentCatId })),
    });
  });
});
