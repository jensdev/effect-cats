import { Cat, CatId, CatNotFound } from "@effect-cats/domain";
import { Effect, Layer, Option, Context } from "effect"; // Added Context
// Either is not used with Effect.match approach
import { CatsRepository, CatsRepositoryLive } from "./CatsRepository.ts";
import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertStringIncludes, assert } from "jsr:@std/assert"; // Added assert
import { pipe } from "effect/Function";
import * as Array from "effect/Array"; // For Effect's Array.filter


// Helper function to create a CatId
const makeCatId = (id: number): CatId => CatId.make(id);

// Sample cat data for testing
const initialCatsData: Omit<Cat, "id">[] = [
  { name: "Whiskers", breed: "Siamese", age: 2 },
  { name: "Mittens", breed: "Persian", age: 5 },
  { name: "Shadow", breed: "Maine Coon", age: 3 },
  { name: "Luna", breed: "Siamese", age: 2 },
  { name: "Oliver", breed: "Bengal", age: 1 },
  { name: "Leo", breed: "Maine Coon", age: 7 },
  { name: "Bella", breed: "Persian", age: 5 },
  { name: "Smokey", breed: "Siamese", age: 3 },
  { name: "Tiger", breed: "Bengal", age: 1 },
  { name: "Cleo", breed: "Maine Coon", age: 4 },

];

// Define an interface alias for the service type
type ICatsRepository = CatsRepository["Type"];

// Test-specific implementation of CatsRepository for direct instantiation and population
class TestCatsRepositoryImpl implements ICatsRepository {
  private catsStore: Map<number, Cat> = new Map();
  private nextId: number = 1;

  private getNextId(): CatId {
    return CatId.make(this.nextId++);
  }

  prime(catsToCreate: Omit<Cat, "id">[]): void {
    catsToCreate.forEach(catData => {
      const id = this.getNextId();
      // Ensure 'id' is correctly typed as CatId before spreading
      const newCat = new Cat({ ...catData, id: id });
      this.catsStore.set(id as number, newCat);
    });
  }

  getCats(breed?: string, age?: number, name?: string): Effect.Effect<readonly Cat[], never> {
    return Effect.sync(() => {
      const allCats = globalThis.Array.from(this.catsStore.values());
      return Array.filter(allCats, (cat) => { // Using Effect's Array.filter
        let matches = true;
        if (breed) {
          matches = matches && cat.breed.toLowerCase().includes(breed.toLowerCase());
        }
        if (age !== undefined) {
          matches = matches && cat.age === age;
        }
        if (name) {
          matches = matches && cat.name.toLowerCase().includes(name.toLowerCase());
        }
        return matches;
      });
    });
  }

  getById(id: CatId): Effect.Effect<Cat, CatNotFound> {
    const numId = id as number;
    return Option.fromNullable(this.catsStore.get(numId)).pipe(
      Effect.mapError(() => new CatNotFound({ id: numId }))
    );
  }

  create(name: string, breed: string, age: number): Effect.Effect<Cat, never> {
    return Effect.sync(() => {
      const id = this.getNextId();
      const newCat = new Cat({ id, name, breed, age });
      this.catsStore.set(id as number, newCat);
      return newCat;
    });
  }

  update(id: CatId, data: Partial<Omit<Cat, "id">>): Effect.Effect<Cat, CatNotFound> {
    const numId = id as number;
    const catOpt = Option.fromNullable(this.catsStore.get(numId));
    if (Option.isNone(catOpt)) {
      return Effect.fail(new CatNotFound({ id: numId }));
    }
    const updatedCat = new Cat({ ...catOpt.value, ...data, id: catOpt.value.id });
    this.catsStore.set(numId, updatedCat);
    return Effect.succeed(updatedCat);
  }

  remove(id: CatId): Effect.Effect<void, CatNotFound> {
    const numId = id as number;
    if (this.catsStore.has(numId)) {
      this.catsStore.delete(numId);
      return Effect.void;
    }
    return Effect.fail(new CatNotFound({ id: numId }));
  }
}

// Helper to create and provide the repository layer for tests
const createTestEnvironment = (catsToCreate: Omit<Cat, "id">[]) => {
  const testRepo = new TestCatsRepositoryImpl();
  testRepo.prime(catsToCreate);
  return Layer.succeed(CatsRepository, testRepo);
};


describe("CatsRepositoryInMemory", () => {
  describe("getCats", () => {
    const testCats = initialCatsData;

    it("should fetch all cats with no filters", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats());
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die) // Ensure error channel is never
        )
      ) as readonly Cat[];
      assertEquals(result.length, testCats.length);
    });

    it("should filter by breed (exact match)", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats("Siamese"));
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      assertEquals(result.length, 3);
      result.forEach((cat) => assertEquals(cat.breed, "Siamese"));
    });

    it("should filter by breed (case-insensitive partial match)", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats("sIaM"));
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      assertEquals(result.length, 3);
      result.forEach((cat) => assertStringIncludes(cat.breed.toLowerCase(), "siam"));
    });


    it("should filter by age", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats(undefined, 5));
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      assertEquals(result.length, 2);
      result.forEach((cat) => assertEquals(cat.age, 5));
    });

    it("should search by name (case-insensitive, partial match)", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats(undefined, undefined, "whisk"));
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      assertEquals(result.length, 1);
      assertStringIncludes(result[0].name.toLowerCase(), "whisk");
    });

    it("should search by name (full match, different case)", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats(undefined, undefined, "SHADOW"));
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      assertEquals(result.length, 1);
      assertEquals(result[0].name, "Shadow");
    });

    it("should combine multiple filters (breed and name)", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats("Maine Coon", undefined, "leo"));
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      assertEquals(result.length, 2); // Corrected expectation: "Leo" and "Cleo" match "Maine Coon" and contain "leo"
      // Asserting the specific cats found would be more robust, but for now, fixing length.
      // Example: find cat named Leo, find cat named Cleo
      const names = result.map(cat => cat.name);
      assert(names.includes("Leo"), "Expected to find Leo");
      assert(names.includes("Cleo"), "Expected to find Cleo");
      result.forEach(cat => {
        assertEquals(cat.breed, "Maine Coon");
        assertStringIncludes(cat.name.toLowerCase(), "leo");
      });
    });

    it("should combine multiple filters (breed and age)", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats("Siamese", 2));
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      assertEquals(result.length, 2);
      result.forEach(cat => {
          assertEquals(cat.breed, "Siamese");
          assertEquals(cat.age, 2);
      });
    });

    it("should combine multiple filters (name and age)", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats(undefined, 1, "Oliver"));
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      assertEquals(result.length, 1);
      assertEquals(result[0].name, "Oliver");
      assertEquals(result[0].age, 1);
    });

    it("should combine multiple filters (breed, age, and name)", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats("Persian", 5, "mittens"));
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      assertEquals(result.length, 1);
      assertEquals(result[0].breed, "Persian");
      assertEquals(result[0].age, 5);
      assertEquals(result[0].name.toLowerCase(), "mittens");
    });


    it("should return an empty array with filters that yield no results", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats("NonExistentBreed", undefined, "NonExistentName"));
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      assertEquals(result.length, 0);
    });

    it("should return an empty array with age filter that yields no results", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats(undefined, 99)); // Assuming no cat is 99 years old
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      assertEquals(result.length, 0);
    });

    it("should return a known subset for partial name 'a'", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats(undefined, undefined, "a"));
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      // Corrected based on actual data: Shadow, Luna, Bella
      assertEquals(result.length, 3);
      result.forEach(cat => assertStringIncludes(cat.name.toLowerCase(), "a"));
    });

    it("should correctly handle undefined for all filters (same as no filters)", async () => {
      const program: Effect.Effect<readonly Cat[], never, CatsRepository> = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        return yield* _(repo.getCats(undefined, undefined, undefined));
      });
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createTestEnvironment(testCats)),
          Effect.catchAllCause(Effect.die)
        )
      ) as readonly Cat[];
      assertEquals(result.length, testCats.length);
      });
  });
});

describe("CatsRepositoryInMemory - Other Methods (Sanity Checks)", () => {
    const testCatData = { name: "Test Cat", breed: "Tester", age: 1 };

    it("create and getById should work", async () => {
      const program = Effect.gen(function* (_) {
            const repo = yield* _(CatsRepository);
            const createdCat = yield* _(repo.create(testCatData.name, testCatData.breed, testCatData.age));
            const fetchedCat = yield* _(repo.getById(createdCat.id));
            return { createdCat, fetchedCat };
        });

        const result = await Effect.runPromise(
            program.pipe(
                Effect.catchTag("CatNotFound", (e) => Effect.die(e)),
                Effect.provide(createTestEnvironment([])),
                Effect.catchAllCause(Effect.die)
            )
        ) as { createdCat: Cat; fetchedCat: Cat };
        assertEquals(result.fetchedCat, result.createdCat);
        assertEquals(result.fetchedCat.name, testCatData.name);
    });

    it("update should modify a cat", async () => {
      const program = Effect.gen(function* (_) {
            const repo = yield* _(CatsRepository);
            const originalCat = yield* _(repo.create(testCatData.name, testCatData.breed, testCatData.age));
            const updatedData = { name: "Updated Test Cat", age: 2 };
            const updatedCat = yield* _(repo.update(originalCat.id, updatedData));
            const fetchedCat = yield* _(repo.getById(originalCat.id));
            return { updatedCat, fetchedCat };
        });

        const result = await Effect.runPromise(
            program.pipe(
                Effect.catchTag("CatNotFound", (e) => Effect.die(e)),
                Effect.provide(createTestEnvironment([])),
                Effect.catchAllCause(Effect.die)
            )
        ) as { updatedCat: Cat; fetchedCat: Cat };
        assertEquals(result.fetchedCat.name, "Updated Test Cat");
        assertEquals(result.fetchedCat.age, 2);
        assertEquals(result.updatedCat.name, "Updated Test Cat");
    });

    it("remove should delete a cat", async () => {
      let catIdToDelete: CatId | undefined;

      // Program to create and remove a cat
      const setupAndRemoveEffect = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository);
        const catToDelete = yield* _(repo.create(testCatData.name, testCatData.breed, testCatData.age));
        catIdToDelete = catToDelete.id;
        return yield* _(repo.remove(catToDelete.id));
      });

      // First, run the setup and removal. We expect this to succeed.
      await Effect.runPromise(
        setupAndRemoveEffect.pipe(
          Effect.provide(createTestEnvironment([])), // Use a fresh repo for this setup
          Effect.catchAllCause(Effect.die) // Should not fail here
        )
      );

      assert(catIdToDelete !== undefined, "catIdToDelete should be defined after setup");

      // Program to attempt to get the deleted cat and assert outcome using Effect.match
      const verifyRemovalEffect = Effect.gen(function* (_) {
        const repo = yield* _(CatsRepository); // This will use the same testRepo instance if testEnv is reused,
                                          // but createTestEnvironment([]) in the previous step means we need to ensure this step
                                          // uses a repo where the cat *was* deleted.
                                          // The current structure implies createTestEnvironment is called per runPromise,
                                          // which means the repo state is reset.
                                          // To test this properly, we need to use the *same* repo instance.
                                          // The testRepo instance should be created once for this test.

        // For this test, we'll create the testEnv once.
        // This part of the logic will be moved outside and testEnv passed to provide.
        // For now, let's assume this Effect.gen runs in a context where the cat *was* deleted.
        // This will be fixed by creating testEnv once at the start of the 'it' block.

        return yield* _(Effect.match(repo.getById(catIdToDelete!), { // Use non-null assertion as we asserted above
          onFailure: (error: CatNotFound) => {
            assertEquals(error._tag, "CatNotFound");
            assertEquals(error.id, catIdToDelete as number);
            return "assertion_passed"; // Indicate test assertion passed
          },
          onSuccess: (_cat: Cat) => {
            assert(false, "Expected CatNotFound after deletion, but got success");
            return "assertion_failed_unexpected_success"; // Indicate test assertion failed
          }
        }));
      });

      // Create the test environment once for all effects in this test case
      const testEnv = createTestEnvironment([]);
      // Populate the repo (this is what setupAndRemoveEffect does effectively)
      // The issue is that createTestEnvironment([]) creates a *new* repo each time.
      // So, the `verifyRemovalEffect` will run on a *new, empty* repo if we call createTestEnvironment again.

      // Corrected structure:
      // 1. Create a TestCatsRepositoryImpl instance.
      // 2. Create the layer for it.
      // 3. Run the creation and removal effect.
      // 4. Run the verification effect.

      const testRepoInstance = new TestCatsRepositoryImpl();
      const singleTestEnv = Layer.succeed(CatsRepository, testRepoInstance);

      // 1. Create the cat and capture its ID
      const createdCat = await Effect.runPromise(
        Effect.provide(testRepoInstance.create(testCatData.name, testCatData.breed, testCatData.age), singleTestEnv)
      );
      catIdToDelete = createdCat.id;

      // 2. Remove the cat
      await Effect.runPromise(
        Effect.provide(testRepoInstance.remove(catIdToDelete), singleTestEnv).pipe(
          Effect.catchTag("CatNotFound", e => Effect.die(e)) // remove shouldn't fail here
        )
      );

      // 3. Verify removal using Effect.match
      const outcome = await Effect.runPromise(
        Effect.match(testRepoInstance.getById(catIdToDelete), {
          onFailure: (error: CatNotFound) => {
            assertEquals(error._tag, "CatNotFound");
            assertEquals(error.id, catIdToDelete as number);
            return "assertion_passed";
          },
          onSuccess: (_cat: Cat) => {
            assert(false, "Expected CatNotFound after deletion, but got success");
            return "assertion_failed_unexpected_success";
          }
        }).pipe(Effect.provide(singleTestEnv)) // Provide environment to the match effect itself
      );

      assertEquals(outcome, "assertion_passed");
    });
});
