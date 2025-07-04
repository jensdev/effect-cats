import { describe, it } from "https://deno.land/std@0.220.0/testing/bdd.ts";
import { expect } from "https://deno.land/std@0.220.0/expect/mod.ts";
import { Effect, Either, Schema } from "effect";
import { Cat } from "./cat.ts";
import { CatId } from "../value-objects/cat.ts";

/**
 * Helper function to create a Cat instance for testing purposes.
 * Uses Schema.decodeUnknownSync for convenience, assuming valid test data.
 */
const createTestCatObject = (
  birthDate: Date,
  overrides: Partial<Cat> = {},
): Cat => {
  const catData = {
    id: 1 as CatId,
    name: "Test Cat",
    breed: "Test Breed",
    birthDate: birthDate.toISOString(),
    ...overrides,
  };
  return Schema.decodeUnknownSync(Cat)(catData);
};

describe("Cat Entity", () => {
  describe("getAgeAt", () => {
    // A fixed date used as the "current" date in tests to ensure consistent age calculations.
    const commonTestDate = new Date("2023-06-15T10:00:00.000Z");

    it("should fail to create a cat with a birthDate in the future", () => {
      // Attempts to create a cat with a birth date set to one hundred years after commonTestDate.
      const futureBirthDate = new Date(
        commonTestDate.getTime() + 100 * 365 * 24 * 60 * 60 * 1000,
      ); // commonTestDate + 100 years
      const catData = {
        id: 2 as CatId,
        name: "Future Cat",
        breed: "Time Traveler",
        birthDate: futureBirthDate.toISOString(),
      };

      const result = Effect.runSync(
        Effect.either(Schema.decodeUnknown(Cat)(catData)),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        // Further check if the error message is as expected for a birth date in the future.
        // This depends on the exact error message defined in the Cat schema.
        expect(result.left.message).toContain("Birth date must be in the past");
      }
    });

    it("should correctly calculate age for a cat whose birthday has passed this year", () => {
      // Cat born May 10, 2021. Current test date is June 15, 2023. Expected age: 2.
      const birthDate = new Date("2021-05-10T00:00:00.000Z");
      const cat = createTestCatObject(birthDate);
      expect(cat.getAgeAt(commonTestDate)).toBe(2);
    });

    it("should correctly calculate age for a cat whose birthday is yet to come this year", () => {
      // Cat born August 20, 2019. Current test date is June 15, 2023. Expected age: 3.
      // (Birthday for 2023 hasn't occurred yet relative to commonTestDate).
      const birthDate = new Date("2019-08-20T00:00:00.000Z");
      const cat = createTestCatObject(birthDate);
      expect(cat.getAgeAt(commonTestDate)).toBe(3);
    });
  });
});
