import { Schema } from "effect";

export class CatNotFound extends Schema.TaggedError<CatNotFound>()(
  "CatNotFound",
  {
    id: Schema.Number, // Refers to the ID by which cat was not found
  },
) { }