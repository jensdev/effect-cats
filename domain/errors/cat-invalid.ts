import { Schema } from "effect";

export class CatInvalid extends Schema.TaggedError<CatInvalid>()('CatInvalid', {}) { }
