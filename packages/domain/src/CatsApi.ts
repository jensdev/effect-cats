import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";
import { Cat, CatIdFromString } from "./Cats.ts";

export class CatNotFound extends Schema.TaggedError<CatNotFound>()(
  "CatNotFound",
  {
    id: Schema.Number,
  },
) {}

// Intended schema for query parameters - kept for future reference
// export const CatsQuerySchema = Schema.Struct({
//   breed: Schema.optional(Schema.String),
//   age: Schema.optional(Schema.Number),
//   name: Schema.optional(Schema.String),
// });

export class CatsApiGroup extends HttpApiGroup.make("cats")
  .add(
    HttpApiEndpoint.get("getCats", "/cats")
      .addSuccess(Schema.Array(Cat))
    // Query parameter definition (.setQuery, .setRequestQuery, or .pipe(HttpApiEndpoint.setOptions(...)))
    // was removed due to persistent TypeScript errors indicating the API method was not found or used incorrectly.
    // The intended schema (CatsQuerySchema) is defined above for reference.
  )
  .add(
    HttpApiEndpoint.get("getCatById", "/cats/:id")
      .addSuccess(Cat)
      .addError(CatNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: CatIdFromString })),
  )
  .add(
    HttpApiEndpoint.post("createCat", "/cats")
      .addSuccess(Cat)
      .setPayload(Schema.Struct(Cat.fields).pipe(Schema.omit("id"))),
  )
  .add(
    HttpApiEndpoint.patch("updateCat", "/cats/:id")
      .addSuccess(Cat)
      .addError(CatNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: CatIdFromString }))
      .setPayload(
        Schema.Struct(Cat.fields).pipe(Schema.omit("id"), Schema.partial),
      ),
  )
  .add(
    HttpApiEndpoint.del("deleteCat", "/cats/:id")
      .addSuccess(Schema.Void)
      .addError(CatNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: CatIdFromString })),
  ) {}

export class CatsApi extends HttpApi.make("api").add(CatsApiGroup) {}
