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
    getCats: (_breed?: string, _age?: number, _name?: string) => Effect.die("getCats not implemented in mock"),
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
  // Variables to spy on repository calls
  let getCatsSpy: { calledWith?: { breed?: string; age?: number; name?: string } } = {};

  // Enhanced runEffectTest or direct mock setup might be needed if more complex spying is required.
  // For now, we'll adapt the mockRepoPartialImpl for each test.

  it("getCats should return an empty array when repository is empty (no params)", async () => {
    getCatsSpy = {}; // Reset spy
    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsService);
      const cats = yield* _(service.getCats()); // Call without params
      assertEquals(cats.length, 0);
    });

    await runEffectTest(testEffect, {
      getCats: (breed, age, name) => {
        getCatsSpy.calledWith = { breed, age, name };
        return Effect.succeed([] as ReadonlyArray<Cat>);
      },
    });
    assertEquals(getCatsSpy.calledWith, { breed: undefined, age: undefined, name: undefined });
  });

  it("getCats should return cats from the repository (no params)", async () => {
    getCatsSpy = {}; // Reset spy
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
      const service = yield* _(CatsService);
      const cats = yield* _(service.getCats()); // Call without params
      assertEquals(cats, sampleCats);
    });

    await runEffectTest(testEffect, {
      getCats: (breed, age, name) => {
        getCatsSpy.calledWith = { breed, age, name };
        return Effect.succeed(sampleCats);
      },
    });
    assertEquals(getCatsSpy.calledWith, { breed: undefined, age: undefined, name: undefined });
  });

  it("getCats should call repository.getCats with provided breed, age, and name", async () => {
    getCatsSpy = {}; // Reset spy
    const filterParams = { breed: "Siamese", age: 2, name: "Whiskers" };
    const expectedCats: ReadonlyArray<Cat> = [
      new Cat({ id: Schema.decodeUnknownSync(CatId)(1), ...filterParams }),
    ];

    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsService);
      const cats = yield* _(service.getCats(filterParams.breed, filterParams.age, filterParams.name));
      assertEquals(cats, expectedCats);
    });

    await runEffectTest(testEffect, {
      getCats: (breed, age, name) => {
        getCatsSpy.calledWith = { breed, age, name };
        // Simulate filtering by returning specific cats if params match
        if (breed === filterParams.breed && age === filterParams.age && name === filterParams.name) {
          return Effect.succeed(expectedCats);
        }
        return Effect.succeed([] as ReadonlyArray<Cat>);
      },
    });
    assertEquals(getCatsSpy.calledWith, filterParams);
  });

  it("getCats should call repository.getCats with only breed", async () => {
    getCatsSpy = {}; // Reset spy
    const filterParams = { breed: "Persian" };
    const expectedCats: ReadonlyArray<Cat> = [
      new Cat({ id: Schema.decodeUnknownSync(CatId)(2), name: "Mittens", breed: "Persian", age: 5 }),
    ];

    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsService);
      const cats = yield* _(service.getCats(filterParams.breed));
      assertEquals(cats, expectedCats);
    });

    await runEffectTest(testEffect, {
      getCats: (breed, age, name) => {
        getCatsSpy.calledWith = { breed, age, name };
        if (breed === filterParams.breed && age === undefined && name === undefined) {
          return Effect.succeed(expectedCats);
        }
        return Effect.succeed([] as ReadonlyArray<Cat>);
      },
    });
    assertEquals(getCatsSpy.calledWith, { breed: filterParams.breed, age: undefined, name: undefined });
  });

  it("getCats should call repository.getCats with only age", async () => {
    getCatsSpy = {}; // Reset spy
    const filterParams = { age: 3 };
    const expectedCats: ReadonlyArray<Cat> = [
      new Cat({ id: Schema.decodeUnknownSync(CatId)(3), name: "Shadow", breed: "Maine Coon", age: 3 }),
    ];

    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsService);
      const cats = yield* _(service.getCats(undefined, filterParams.age));
      assertEquals(cats, expectedCats);
    });

    await runEffectTest(testEffect, {
      getCats: (breed, age, name) => {
        getCatsSpy.calledWith = { breed, age, name };
        if (breed === undefined && age === filterParams.age && name === undefined) {
          return Effect.succeed(expectedCats);
        }
        return Effect.succeed([] as ReadonlyArray<Cat>);
      },
    });
    assertEquals(getCatsSpy.calledWith, { breed: undefined, age: filterParams.age, name: undefined });
  });

  it("getCats should call repository.getCats with only name", async () => {
    getCatsSpy = {}; // Reset spy
    const filterParams = { name: "Luna" };
    const expectedCats: ReadonlyArray<Cat> = [
      new Cat({ id: Schema.decodeUnknownSync(CatId)(4), name: "Luna", breed: "Siamese", age: 2 }),
    ];

    const testEffect = Effect.gen(function* (_) {
      const service = yield* _(CatsService);
      const cats = yield* _(service.getCats(undefined, undefined, filterParams.name));
      assertEquals(cats, expectedCats);
    });

    await runEffectTest(testEffect, {
      getCats: (breed, age, name) => {
        getCatsSpy.calledWith = { breed, age, name };
        if (breed === undefined && age === undefined && name === filterParams.name) {
          return Effect.succeed(expectedCats);
        }
        return Effect.succeed([] as ReadonlyArray<Cat>);
      },
    });
    assertEquals(getCatsSpy.calledWith, { breed: undefined, age: undefined, name: filterParams.name });
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
