import { Schema } from "effect";
import { CatId } from "../value-objects/cat.ts";

export class Cat extends Schema.Class<Cat>("Cat")({
  id: CatId.annotations({
    description: "The ID of the cat",
  }),
  name: Schema.NonEmptyTrimmedString.annotations({
    description: "The name of the cat",
    examples: ["Fluffy", "Whiskers", "Mittens"],
  }),
  breed: Schema.NonEmptyTrimmedString.annotations({
    description: "The breed of the cat.",
    // MODIFIED LINE:
    examples: ["Siamese", "Persian", "Maine Coon"],
  }),
  birthDate: Schema.Date.pipe(
    Schema.lessThanDate(new Date(), {
      message: () => "Birth date must be in the past",
    }),
    Schema.annotations({
      description: "The birth date of the cat",
      examples: [new Date("2022-01-01T00:00:00.000Z")],
    }),
  ),
}) {
  getAgeAt(date: Date): number {
    const today = date; // This will be controlled by TestClock in tests
    const birthDate = this.birthDate; // this.birthDate is a Date object

    if (today.getTime() < birthDate.getTime()) {
      return 0;
    }

    // Use UTC methods for all component extractions to ensure consistency
    let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDiff = today.getUTCMonth() - birthDate.getUTCMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getUTCDate() < birthDate.getUTCDate())
    ) {
      age--;
    }
    return age;
  }

  get age(): number {
    return this.getAgeAt(new Date());
  }
}
