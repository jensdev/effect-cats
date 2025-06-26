import { describe, it } from "https://deno.land/std@0.220.0/testing/bdd.ts";
import { expect } from "https://deno.land/std@0.220.0/expect/mod.ts";
import { Effect, Layer, Schema, TestClock, TestContext } from "effect"; // Import TestClock and TestContext from main "effect"
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
  describe("age", () => {
    // A fixed date for tests that need a "current time" but don't modify it.
    const commonTestDate = new Date("2023-06-15T10:00:00.000Z"); // June 15, 2023

    it("should correctly calculate age for a cat whose birthday has passed this year", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          // TestClock methods are static on the TestClock module when TestContext is provided
          yield* _(TestClock.setTime(commonTestDate.getTime()));

          const birthDate = new Date("2021-05-10T00:00:00.000Z"); // May 10, 2021
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(2);
        }),
      ));

    it("should correctly calculate age for a cat whose birthday is yet to come this year", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          yield* _(TestClock.setTime(commonTestDate.getTime()));

          const birthDate = new Date("2021-08-20T00:00:00.000Z"); // August 20, 2021
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(1);
        }),
      ));

    it("should correctly calculate age for a cat whose birthday is today", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          yield* _(TestClock.setTime(commonTestDate.getTime()));

          const birthDate = new Date("2020-06-15T00:00:00.000Z"); // June 15, 2020
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(3);
        }),
      ));

    it("should correctly calculate age for a cat born on Feb 29 in a non-leap year context", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          yield* _(
            TestClock.setTime(new Date("2023-02-28T10:00:00.000Z").getTime()),
          );

          const birthDate = new Date("2020-02-29T00:00:00.000Z"); // Born Feb 29, 2020
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(2);
        }),
      ));

    it("should correctly calculate age for a cat born on Feb 29, tested on Mar 1 of non-leap year", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          yield* _(
            TestClock.setTime(new Date("2023-03-01T10:00:00.000Z").getTime()),
          );

          const birthDate = new Date("2020-02-29T00:00:00.000Z"); // Born Feb 29, 2020
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(3);
        }),
      ));

    it("should correctly calculate age for a cat born on Feb 29, tested on Feb 29 of a leap year", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          yield* _(
            TestClock.setTime(new Date("2024-02-29T10:00:00.000Z").getTime()),
          );

          const birthDate = new Date("2020-02-29T00:00:00.000Z"); // Born Feb 29, 2020
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(4);
        }),
      ));

    it("should correctly calculate age for a cat less than a year old", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          yield* _(TestClock.setTime(commonTestDate.getTime()));

          const birthDate = new Date("2023-01-10T00:00:00.000Z"); // Jan 10, 2023
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(0);
        }),
      ));

    it("should correctly calculate age for a cat that is exactly one year old (birthday passed)", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          yield* _(TestClock.setTime(commonTestDate.getTime()));

          const birthDate = new Date("2022-05-10T00:00:00.000Z"); // May 10, 2022
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(1);
        }),
      ));

    it("should correctly calculate age for a cat that is exactly one year old (birthday today)", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          yield* _(TestClock.setTime(commonTestDate.getTime()));

          const birthDate = new Date("2022-06-15T00:00:00.000Z"); // June 15, 2022
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(1);
        }),
      ));

    it("should correctly calculate age for a cat whose birthday is tomorrow", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          yield* _(TestClock.setTime(commonTestDate.getTime()));

          const birthDate = new Date("2022-06-16T00:00:00.000Z"); // June 16, 2022
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(0);
        }),
      ));

    it("should correctly calculate age for cat born on Dec 31st, tested on Jan 1st", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          yield* _(
            TestClock.setTime(new Date("2023-01-01T10:00:00.000Z").getTime()),
          );

          const birthDate = new Date("2022-12-31T00:00:00.000Z"); // Dec 31, 2022
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(0);
        }),
      ));

    it("should correctly calculate age for cat born on Jan 1st, tested on Dec 31st", () =>
      runTestEffect(
        Effect.gen(function* (_) {
          yield* _(
            TestClock.setTime(new Date("2023-12-31T10:00:00.000Z").getTime()),
          );

          const birthDate = new Date("2023-01-01T00:00:00.000Z"); // Jan 1, 2023
          const cat = createTestCatObject(birthDate);
          expect(cat.age).toBe(0);
        }),
      ));
  });
});
