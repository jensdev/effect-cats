import { describe, it } from "https://deno.land/std@0.220.0/testing/bdd.ts";
import { expect } from "https://deno.land/std@0.220.0/expect/mod.ts";
import { Effect, Either, Schema } from "effect";
// Removed import of ParseError, ParseIssue as they are not directly exported or needed for current error checking.
import { Cat } from "./cat.ts";
import { CatId } from "../value-objects/cat.ts";

// Define a type for the raw input data for creating/updating cats in tests.
// This should align with Schema.Schema.Encoded<typeof Cat> but simplified for partial inputs.
type TestCatRawInput = Partial<{
  id: number; // CatId is number | Brand<"CatId">, number is fine for input
  name: string;
  breed: string;
  birthDate: Date | string; // Allow string for birthDate as it might be decoded
  deathDate?: Date | string | null; // Allow string or null as well
}>;

/**
 * Helper function to create a Cat instance for testing purposes.
 */
const createTestCatObject = (
  birthDate: Date,
  props: TestCatRawInput = {},
): Cat => {
  const finalProps: Record<string, any> = { ...props };
  if (props.birthDate instanceof Date) {
    finalProps.birthDate = props.birthDate.toISOString();
  }
  if (props.deathDate instanceof Date) {
    finalProps.deathDate = props.deathDate.toISOString();
  }

  const rawCatData = {
    id: 1,
    name: "Test Cat",
    breed: "Test Breed",
    birthDate: birthDate.toISOString(), // Convert main birthDate argument
    deathDate: undefined, // Default, can be overridden by finalProps
    ...finalProps,
  };
  return Schema.decodeUnknownSync(Cat)(rawCatData);
};

/**
 * Helper function to attempt to create a Cat instance and expect a failure.
 */
const expectCatCreationFailure = (
  birthDateInput: Date | string,
  props: TestCatRawInput = {},
  expectedErrorMessageSubString: string,
) => {
  const finalProps: Record<string, any> = { ...props };
  if (props.birthDate instanceof Date) {
    finalProps.birthDate = props.birthDate.toISOString();
  }
  if (props.deathDate instanceof Date) {
    finalProps.deathDate = props.deathDate.toISOString();
  }

  const rawCatData = {
    id: 1,
    name: "Test Cat",
    breed: "Test Breed",
    birthDate: birthDateInput instanceof Date ? birthDateInput.toISOString() : birthDateInput,
    deathDate: undefined, // Default
    ...finalProps,
  };
  const result = Effect.runSync(Effect.either(Schema.decodeUnknown(Cat)(rawCatData)));
  expect(Either.isLeft(result)).toBe(true);
  if (Either.isLeft(result)) {
    // The .message property on the error (even if just `Error`) usually gives a good summary.
    // For ParseError, this message is typically well-formatted.
    expect(result.left.message).toContain(expectedErrorMessageSubString);
  }
};


describe("Cat Entity", () => {
  const commonTestDate = new Date("2023-06-15T10:00:00.000Z"); // A fixed "current" date

  describe("Schema Validations", () => {
    it("should fail to create a cat with a birthDate in the future", () => {
      // Create a date that is guaranteed to be in the future from runtime
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const futureBirthDate = new Date(
        tomorrow.getUTCFullYear() + 1, // Make it one year from tomorrow
        tomorrow.getUTCMonth(),
        tomorrow.getUTCDate(),
      );
      expectCatCreationFailure(
        futureBirthDate,
        {},
        "Birth date must be in the past",
      );
    });

    it("should fail if deathDate is before birthDate", () => {
      const birthDate = new Date("2020-01-01T00:00:00.000Z");
      const deathDate = new Date("2019-12-31T00:00:00.000Z");
      expectCatCreationFailure(
        birthDate,
        { deathDate },
        "Death date must be after birth date",
      );
    });

    it("should fail if deathDate is the same as birthDate", () => {
      const birthDate = new Date("2020-01-01T00:00:00.000Z");
      expectCatCreationFailure(
        birthDate,
        { deathDate: birthDate },
        "Death date must be after birth date",
      );
    });

    it("should successfully create a cat with valid birthDate and no deathDate", () => {
      const birthDate = new Date("2020-01-01T00:00:00.000Z");
      const cat = createTestCatObject(birthDate);
      expect(cat).toBeInstanceOf(Cat);
      expect(cat.birthDate).toEqual(birthDate);
      expect(cat.deathDate).toBeUndefined();
    });

    it("should successfully create a cat with valid birthDate and deathDate", () => {
      const birthDate = new Date("2020-01-01T00:00:00.000Z");
      const deathDate = new Date("2022-01-01T00:00:00.000Z");
      const cat = createTestCatObject(birthDate, { deathDate });
      expect(cat).toBeInstanceOf(Cat);
      expect(cat.birthDate).toEqual(birthDate);
      expect(cat.deathDate).toEqual(deathDate);
    });
  });

  describe("isAlive getter", () => {
    it("should be true if deathDate is undefined", () => {
      const cat = createTestCatObject(new Date("2020-01-01T00:00:00.000Z"));
      expect(cat.isAlive).toBe(true);
    });

    it("should be false if deathDate is set", () => {
      const cat = createTestCatObject(new Date("2020-01-01T00:00:00.000Z"), {
        deathDate: new Date("2021-01-01T00:00:00.000Z"),
      });
      expect(cat.isAlive).toBe(false);
    });
  });

  describe("getAgeAt", () => {
    it("should return 0 if the date is before birthDate", () => {
      const birthDate = new Date("2021-05-10T00:00:00.000Z");
      const cat = createTestCatObject(birthDate);
      const beforeBirth = new Date("2020-01-01T00:00:00.000Z");
      expect(cat.getAgeAt(beforeBirth)).toBe(0);
    });

    it("should correctly calculate age for a living cat whose birthday has passed this year", () => {
      const birthDate = new Date("2021-05-10T00:00:00.000Z"); // Born May 10, 2021
      const cat = createTestCatObject(birthDate);
      expect(cat.getAgeAt(commonTestDate)).toBe(2); // commonTestDate is June 15, 2023
    });

    it("should correctly calculate age for a living cat whose birthday is yet to come this year", () => {
      const birthDate = new Date("2019-08-20T00:00:00.000Z"); // Born Aug 20, 2019
      const cat = createTestCatObject(birthDate);
      expect(cat.getAgeAt(commonTestDate)).toBe(3); // commonTestDate is June 15, 2023
    });

    it("should correctly calculate age for a cat that is exactly 1 year old", () => {
      const birthDate = new Date("2022-06-15T00:00:00.000Z");
      const cat = createTestCatObject(birthDate);
      expect(cat.getAgeAt(commonTestDate)).toBe(1); // commonTestDate is June 15, 2023
    });

    it("should correctly calculate age for a cat that is just under 1 year old", () => {
      const birthDate = new Date("2022-06-16T00:00:00.000Z"); // Born June 16, 2022
      const cat = createTestCatObject(birthDate);
      expect(cat.getAgeAt(commonTestDate)).toBe(0); // commonTestDate is June 15, 2023
    });

    // Tests for deceased cats
    it("should calculate age at death if date is after deathDate", () => {
      const birthDate = new Date("2010-01-01T00:00:00.000Z");
      const deathDate = new Date("2015-01-01T00:00:00.000Z"); // Died at 5 years old
      const cat = createTestCatObject(birthDate, { deathDate });
      const afterDeath = new Date("2020-01-01T00:00:00.000Z");
      expect(cat.getAgeAt(afterDeath)).toBe(5);
    });

    it("should calculate age based on given date if date is before deathDate", () => {
      const birthDate = new Date("2010-01-01T00:00:00.000Z");
      const deathDate = new Date("2015-01-01T00:00:00.000Z"); // Died at 5
      const cat = createTestCatObject(birthDate, { deathDate });
      const beforeDeath = new Date("2013-01-01T00:00:00.000Z"); // Cat was 3
      expect(cat.getAgeAt(beforeDeath)).toBe(3);
    });

    it("should calculate age as age at death if date is exactly deathDate", () => {
      const birthDate = new Date("2010-01-01T00:00:00.000Z");
      const deathDate = new Date("2015-06-15T00:00:00.000Z"); // Died at 5 years, 5 months, 14 days
      const cat = createTestCatObject(birthDate, { deathDate });
      expect(cat.getAgeAt(deathDate)).toBe(5); // Age is 5 full years
    });
  });

  describe("age getter (current age)", () => {
    let originalDateNow = Date.now;
    let originalDateConstructor = globalThis.Date;

    const mockCurrentDate = (fixedDate: Date) => {
      originalDateNow = Date.now;
      originalDateConstructor = globalThis.Date;

      globalThis.Date = class extends originalDateConstructor {
        constructor(...args: any[]) {
          // If new Date() is called with no arguments, return the fixedDate.
          // Otherwise, behave as original Date constructor.
          if (args.length === 0) {
            super(fixedDate.toISOString()); // Pass ISO string to ensure it's treated as specific date
          } else {
            super(...(args as [any])); // Use type assertion for spread
          }
        }

        static override now(): number { // Add override modifier
          return fixedDate.getTime();
        }
      } as any; // Cast to any due to complex Date constructor signature
    };

    const unmockCurrentDate = () => {
      Date.now = originalDateNow;
      globalThis.Date = originalDateConstructor;
    };

    it("should return current age for a living cat (using commonTestDate as 'now')", () => {
      mockCurrentDate(commonTestDate);
      const birthDate = new Date("2021-05-10T00:00:00.000Z");
      const cat = createTestCatObject(birthDate);
      expect(cat.age).toBe(2);
      unmockCurrentDate();
    });

    it("should return age at death for a deceased cat (using commonTestDate as 'now')", () => {
      mockCurrentDate(commonTestDate);
      const birthDate = new Date("2010-01-01T00:00:00.000Z");
      const deathDate = new Date("2015-01-01T00:00:00.000Z");
      const cat = createTestCatObject(birthDate, { deathDate });
      expect(cat.age).toBe(5);
      unmockCurrentDate();
    });

    it("should return current age if cat died in the future (using commonTestDate as 'now')", () => {
      mockCurrentDate(commonTestDate);
      const birthDate = new Date("2020-01-01T00:00:00.000Z");
      const futureDeathDate = new Date("2024-01-01T00:00:00.000Z");
      const cat = createTestCatObject(birthDate, { deathDate: futureDeathDate });
      expect(cat.age).toBe(3);
      unmockCurrentDate();
    });
  });
});
