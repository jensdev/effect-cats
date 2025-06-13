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
    examples: ["Siamese", "Whiskers", "Mittens"],
  }),
  age: Schema.Number.annotations({
    description: "The age of the cat",
    examples: [2, 5],
  }),
}) {}
