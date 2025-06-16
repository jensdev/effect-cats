import { Schema } from "effect";

export const CatId = Schema.Number.pipe(Schema.brand("CatId"));
export type CatId = typeof CatId.Type;

export const CatIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(CatId),
);

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
