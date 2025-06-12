import { Schema } from "effect";

export const CatId = Schema.Number.pipe(Schema.brand("CatId"));
export type CatId = typeof CatId.Type;

export const CatIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(CatId),
);

export class Cat extends Schema.Class<Cat>("Cat")({
  id: CatId.annotations({
    description: "The unique identifier for the cat.",
    examples: [123],
  }),
  name: Schema.NonEmptyTrimmedString.annotations({
    description: "The name of the cat.",
    examples: ["Whiskers", "Luna"],
  }),
  breed: Schema.NonEmptyTrimmedString.annotations({
    description: "The breed of the cat.",
    examples: ["Siamese", "Maine Coon"],
  }),
  age: Schema.Number.annotations({
    description: "The age of the cat in years.",
    examples: [2, 5],
  }),
}) {}
