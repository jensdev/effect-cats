import { Schema, pipe } from "effect"; // Import pipe
import { CatId } from "../value-objects/cat.ts";

// Define the core fields first for type inference within filterOrFail
const catFields = {
  id: CatId.annotations({
    description: "The ID of the cat",
  }),
  name: Schema.NonEmptyTrimmedString.annotations({
    description: "The name of the cat",
    examples: ["Fluffy", "Whiskers", "Mittens"],
  }),
  breed: Schema.NonEmptyTrimmedString.annotations({
    description: "The breed of the cat.",
    examples: ["Siamese", "Persian", "Maine Coon"],
  }),
  birthDate: Schema.Date.pipe(
    Schema.lessThanDate(new Date(), { // Reverted to new Date()
      message: () => "Birth date must be in the past",
    }),
    Schema.annotations({
      description: "The birth date of the cat",
      examples: [new Date("2022-01-01T00:00:00.000Z")],
    }),
  ),
  // Define an annotated Date, then make that schema optional.
  deathDate: Schema.optional(
    Schema.Date.pipe(
      Schema.annotations({
        description: "The date the cat died. If undefined, the cat is alive.",
        examples: [new Date("2032-01-01T00:00:00.000Z")],
      })
    )
  ),
};

const catStruct = Schema.Struct(catFields);

// Use Schema.filter for schema-level validation
const catSchemaFinal = pipe(
  catStruct,
  Schema.filter(
    (cat: Schema.Schema.Type<typeof catStruct>) => cat.deathDate == null || cat.deathDate > cat.birthDate, // Check for null or undefined
    { message: () => "Death date must be after birth date" }
  )
);

export class Cat extends Schema.Class<Cat>("Cat")(catSchemaFinal) {
  // Properties are now fully defined by catSchemaFinal via Schema.Class.
  // Explicit declarations have been removed.
  // `this` context in methods/getters will correctly refer to schema properties.

  get isAlive(): boolean {
    // `this.deathDate` is now correctly typed from the schema (Date | undefined)
    return this.deathDate === undefined;
  }

  getAgeAt(date: Date): number {
    const effectiveDate = this.deathDate && date.getTime() > this.deathDate.getTime()
      ? this.deathDate
      : date;
    // `this.birthDate` is now correctly typed from the schema (Date)
    const birthDate = this.birthDate;

    if (effectiveDate.getTime() < birthDate.getTime()) {
      return 0;
    }

    let ageValue = effectiveDate.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDiff = effectiveDate.getUTCMonth() - birthDate.getUTCMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && effectiveDate.getUTCDate() < birthDate.getUTCDate())
    ) {
      ageValue--;
    }
    return ageValue;
  }

  get age(): number {
    return this.getAgeAt(new Date());
  }
}
