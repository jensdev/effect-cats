import { Schema } from "effect";

const PositiveInt = Schema.Int.pipe(Schema.positive());

/**
 * @brand CatId
 * A branded type for Cat IDs.
 * This helps ensure that we don't accidentally use a regular string where a CatId is expected.
 */
export const CatId = Schema.String.pipe(Schema.brand("CatId"));
export type CatId = typeof CatId.Type;

/**
 * Represents a cat with its properties.
 */
export class Cat extends Schema.Class<Cat>("Cat")({
  /**
   * The unique identifier for the cat.
   */
  id: CatId,
  /**
   * The name of the cat.
   */
  name: Schema.String,
  /**
   * The age of the cat in years.
   * Must be a positive integer.
   */
  age: PositiveInt,
  /**
   * The breed of the cat.
   * Must be one of the specified literal values.
   */
  breed: Schema.Literal("Abyssinian", "Bombay", "Chartreux"),
}) {}
