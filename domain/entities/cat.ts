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
  age: Schema.Number.pipe(
    Schema.int(),
    Schema.nonNegative(),
    Schema.annotations({
      description: "The age of the cat",
      examples: [0, 2, 5],
    }),
  ),
}) {}
