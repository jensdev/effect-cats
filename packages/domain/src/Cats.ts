import { Schema } from "effect";

export const CatId = Schema.Number.pipe(Schema.brand("CatId"));
export type CatId = typeof CatId.Type;

export const CatIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(CatId),
);

export class Cat extends Schema.Class<Cat>("Cat")({
  id: CatId.pipe(
    Schema.description("The unique identifier for the cat."),
    Schema.examples([123]),
  ),
  name: Schema.NonEmptyTrimmedString.pipe(
    Schema.description("The name of the cat."),
    Schema.examples(["Whiskers"]),
  ),
  breed: Schema.NonEmptyTrimmedString.pipe(
    Schema.description("The breed of the cat."),
    Schema.examples(["Siamese"]),
  ),
  age: Schema.Number.pipe(
    Schema.description("The age of the cat in years."),
    Schema.examples([2]),
  ),
}) {}
