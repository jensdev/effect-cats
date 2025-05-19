import { Data, Schema } from "effect";
import { CatId } from "./cats";

export class CatNotFoundError extends Data.TaggedError("CatNotFoundError")<{
  id: string;
}> {}
