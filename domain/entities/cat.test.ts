import { describe, it } from "https://deno.land/std@0.220.0/testing/bdd.ts";
import { expect } from "https://deno.land/std@0.220.0/expect/mod.ts";
import {
  Effect,
  Schema,
  TestContext,
} from "effect"; // Import TestClock and TestContext from main "effect"
import { Cat } from "./cat.ts";
import { CatId } from "../value-objects/cat.ts";

// Helper to run an Effect program with TestClock layer (now TestContext.TestContext)
// The R type for effects using TestClock methods via TestContext is typically 'never' for requirements,
// as TestClock is ambiently available when TestContext is provided.
const runTestEffect = <E, A>(effect: Effect.Effect<A, E, never>) => {
  return Effect.runPromise(Effect.provide(effect, TestContext.TestContext));
};

// Renamed to avoid confusion with the Cat model itself, and to signify it's for test setup.
const createTestCatObject = (
  birthDate: Date,
  overrides: Partial<Cat> = {},
): Cat => {
  const catData = {
    id: 1 as CatId,
    name: "Test Cat",
    breed: "Test Breed",
    birthDate: birthDate.toISOString(), // Schema.Date expects string input for decoding
    ...overrides,
  };
  // Schema.decodeUnknownSync is fine for test setup where we expect data to be valid.
  return Schema.decodeUnknownSync(Cat)(catData);
};

describe("Cat Entity", () => {
  describe("getAgeAt", () => {
    // A fixed date for tests that need a "current time" but don't modify it.
    const commonTestDate = new Date("2023-06-15T10:00:00.000Z"); // June 15, 2023


    it("should correctly fail to create a cat with a birthday in the future", () =>
      runTestEffect(
        Effect.gen(function* () {
          const birthDate = new Date("2021-05-10T00:00:00.000Z"); // May 10, 2021
          const cat = createTestCatObject(birthDate);
          expect(cat.getAgeAt(commonTestDate)).toBe(4);
        }),
      ));

    it("should correctly calculate age for a cat whose birthday has passed this year", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          const birthDate = new Date("2021-05-10T00:00:00.000Z"); // May 10, 2021
          const cat = createTestCatObject(birthDate);
          expect(cat.getAgeAt(commonTestDate)).toBe(2);
        }),
      ));

    it("should correctly calculate age for a cat whose birthday is yet to come this year", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          const birthDate = new Date("2021-08-20T00:00:00.000Z"); // August 20, 2021
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(3);
        }),
      ));
  });
});
