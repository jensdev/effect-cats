import { Schema } from "effect";

export const CatId = Schema.Number.pipe(Schema.brand("CatId"));
export type CatId = typeof CatId.Type;

export const CatIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(CatId),
);
