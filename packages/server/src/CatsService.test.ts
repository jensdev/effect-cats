import { Effect, Layer, Schema } from "effect"; // Removed Context, Data as they might not be needed directly
import { assert, assertEquals } from "jsr:@std/assert"; // Corrected assert import
import { describe, it } from "jsr:@std/testing/bdd";

// Domain imports - assuming CatNotFound is exported from domain now
import { Cat, CatId, CatNotFound } from "@effect-cats/domain";

// Service and ACTUAL Repository Tag imports
import { CatsService, CatsServiceLive } from "./CatsService.ts";
import { CatsRepository } from "./CatsRepository.ts"; // CRUCIAL: Assumes this file exports the Tag

// The mock implementation's type should ideally match the actual service interface provided by CatsRepository
// This line assumes CatsRepository has an 'of' static method and its first parameter is the service impl
// If CatsRepository is just a Tag<Interface>, this will need adjustment.
// For now, let's define a similar structure to what CatsRepository.of might expect.

// We'll use this Partial type for providing mocks.

const runEffectTest = <E, A>(
  effectToRun: Effect.Effect<A, E, CatsService>, // The effect needs CatsService
  // UPDATE: Use Partial<CatsRepository["Type"]>
  mockRepoPartialImpl: Partial<CatsRepository["Type"]> = {}, // Default to empty mock
) => {
  // Create a full mock implementation by merging partial mock with defaults that throw
  // UPDATE: Use CatsRepository["Type"]
  const fullMockImpl: CatsRepository["Type"] = {
    getAll: Effect.die("getAll not implemented in mock"),
    getById: (id: CatId) =>
      Effect.die(`getById(${id}) not implemented in mock`),
    create: (name, breed, age) =>
      Effect.die(`create(${name}, ${breed}, ${age}) not implemented in mock`),
    update: (id, data) =>
      Effect.die(
        `update(${id}, ${JSON.stringify(data)}) not implemented in mock`,
      ),
    remove: (id: CatId) => Effect.die(`remove(${id}) not implemented in mock`),
    ...mockRepoPartialImpl, // Override defaults with provided mocks
  };

  // This is the critical part:
  // It assumes CatsRepository is a Tag for a service that can be constructed with CatsRepository.of()
  // or if CatsRepository is Tag<Interface>, then it should be CatsRepository (the Tag itself)
  // and the second argument is the implementation (fullMockImpl).
  // The instruction `CatsRepository.of(fullMockImpl)` implies CatsRepository is a class or object with `of`.
  // Let's assume CatsRepository is a TagClass-like object.
  const mockCatsRepositoryLayer = Layer.succeed(
    CatsRepository,
    CatsRepository.of(fullMockImpl), // Construct the service implementation
  );

  const testLayer = Layer.provide(CatsServiceLive, mockCatsRepositoryLayer);
  const providedEffect = Effect.provide(effectToRun, testLayer);

  return Effect.runPromise(providedEffect);
};

describe("CatsService (Refined)", () => {
  it("getAllCats should return an empty array when repository is empty", async () => {
    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsService);
      const cats = yield* _(service.getAllCats);
      assertEquals(cats.length, 0);
    });

    await runEffectTest(testEffect, {
      getAll: Effect.succeed([] as ReadonlyArray<Cat>),
    });
  });

  it("getAllCats should return cats from the repository", async () => {
    const sampleCats: ReadonlyArray<Cat> = [
      new Cat({ id: Schema.decodeUnknownSync(CatId)(1), name: "Whiskers", breed: "Siamese", age: 2 }),
      new Cat({ id: Schema.decodeUnknownSync(CatId)(2), name: "Shadow", breed: "Maine Coon", age: 5 }),
    ];

    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsService);
      const cats = yield* _(service.getAllCats);
      assertEquals(cats, sampleCats);
    });

    await runEffectTest(testEffect, {
      getAll: Effect.succeed(sampleCats),
    });
  });

  it("getCatById should return a cat when found", async () => {
    const catId = Schema.decodeUnknownSync(CatId)(3); // Using casting for CatId
    const sampleCat = new Cat({
      id: catId,
      name: "Felix",
      breed: "Tabby",
      age: 3,
    });

    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsService);
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
    const nonExistentCatId = Schema.decodeUnknownSync(CatId)(99); // Using casting for CatId

    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsService);
      return yield* _(service.getCatById(nonExistentCatId));
    }).pipe(
      Effect.match({
        onFailure: (error) => {
          assertEquals(error._tag, "CatNotFound");
          // Ensure CatNotFound has an 'id' property if this assertion is to pass
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
      // Ensure new CatNotFound({id: ...}) matches the actual error structure from the domain
      getById: (_id: CatId) =>
        Effect.fail(new CatNotFound({ id: nonExistentCatId })),
    });
  });
});
