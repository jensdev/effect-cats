import { Effect, Layer, Option, ReadonlyArray } from "effect";
import { Cat, CatId, CatNotFound } from "@template/domain/CatsApi";
import { CatsRepository, CatsRepositoryLive } from "../src/CatsRepository.js"; // Adjust path as needed
import { describe, it, expect } from "vitest"; // Assuming vitest is the test runner

const testLayer = Layer.provide(CatsRepositoryLive, CatsRepository.Tag);

describe("CatsRepository", () => {
  it("should be empty initially", () =>
    Effect.gen(function* (_) {
      const repo = yield* _(CatsRepository);
      const cats = yield* _(repo.getAll);
      expect(ReadonlyArray.length(cats)).toBe(0);
    }).pipe(Effect.provide(testLayer), Effect.runPromise));

  it("should create a cat and retrieve it", () =>
    Effect.gen(function* (_) {
      const repo = yield* _(CatsRepository);
      const newCat = yield* _(repo.create("Whiskers", "Siamese", 2));
      expect(newCat.name).toBe("Whiskers");
      expect(newCat.breed).toBe("Siamese");
      expect(newCat.age).toBe(2);
      expect(newCat.id).toBeDefined();

      const retrievedCat = yield* _(repo.getById(newCat.id));
      expect(retrievedCat).toEqual(newCat);

      const allCats = yield* _(repo.getAll);
      expect(ReadonlyArray.length(allCats)).toBe(1);
      expect(allCats[0]).toEqual(newCat);
    }).pipe(Effect.provide(testLayer), Effect.runPromise));

  it("should return CatNotFound for a non-existent cat", () =>
    Effect.gen(function* (_) {
      const repo = yield* _(CatsRepository);
      const nonExistentId = CatId(999);
      const error = yield* _(Effect.flip(repo.getById(nonExistentId)));
      expect(error).toBeInstanceOf(CatNotFound);
      if (error instanceof CatNotFound) {
        expect(error.id).toBe(nonExistentId);
      }
    }).pipe(Effect.provide(testLayer), Effect.runPromise));

  it("should update an existing cat", () =>
    Effect.gen(function* (_) {
      const repo = yield* _(CatsRepository);
      const cat = yield* _(repo.create("Mittens", "Tabby", 3));
      const updatedCat = yield* _(repo.update(cat.id, { name: "Shadow" }));

      expect(updatedCat.name).toBe("Shadow");
      expect(updatedCat.breed).toBe("Tabby"); // Breed and age should remain the same
      expect(updatedCat.age).toBe(3);

      const retrievedCat = yield* _(repo.getById(cat.id));
      expect(retrievedCat.name).toBe("Shadow");
    }).pipe(Effect.provide(testLayer), Effect.runPromise));

  it("should fail to update a non-existent cat", () =>
    Effect.gen(function* (_) {
      const repo = yield* _(CatsRepository);
      const nonExistentId = CatId(998);
      const error = yield* _(Effect.flip(repo.update(nonExistentId, { name: "Ghost" })));
      expect(error).toBeInstanceOf(CatNotFound);
    }).pipe(Effect.provide(testLayer), Effect.runPromise));

  it("should remove an existing cat", () =>
    Effect.gen(function* (_) {
      const repo = yield* _(CatsRepository);
      const cat1 = yield* _(repo.create("Luna", "Bengal", 1));
      const cat2 = yield* _(repo.create("Leo", "Maine Coon", 4));

      yield* _(repo.remove(cat1.id));

      const allCats = yield* _(repo.getAll);
      expect(ReadonlyArray.length(allCats)).toBe(1);
      expect(allCats[0]).toEqual(cat2);

      const error = yield* _(Effect.flip(repo.getById(cat1.id)));
      expect(error).toBeInstanceOf(CatNotFound);
    }).pipe(Effect.provide(testLayer), Effect.runPromise));

  it("should fail to remove a non-existent cat", () =>
    Effect.gen(function* (_) {
      const repo = yield* _(CatsRepository);
      const nonExistentId = CatId(997);
      const error = yield* _(Effect.flip(repo.remove(nonExistentId)));
      expect(error).toBeInstanceOf(CatNotFound);
    }).pipe(Effect.provide(testLayer), Effect.runPromise));

  it("should create multiple cats with unique IDs", () =>
    Effect.gen(function* (_) {
      const repo = yield* _(CatsRepository);
      const cat1 = yield* _(repo.create("Oliver", "British Shorthair", 2));
      const cat2 = yield* _(repo.create("Chloe", "Persian", 5));

      expect(cat1.id).not.toEqual(cat2.id);

      const allCats = yield* _(repo.getAll);
      expect(ReadonlyArray.length(allCats)).toBe(2);
    }).pipe(Effect.provide(testLayer), Effect.runPromise));
});
