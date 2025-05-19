import { Schema } from "effect";

const PositiveInt = Schema.Int.pipe(Schema.positive());

export const CatId = Schema.String.pipe(Schema.brand("CatId"));
export type CatId = typeof CatId.Type;

export class Cat extends Schema.Class<Cat>("Cat")({
  id: CatId,
  name: Schema.String,
  age: PositiveInt,
  breed: Schema.Literal("Abyssinian", "Bombay", "Chartreux"),
}) {}
