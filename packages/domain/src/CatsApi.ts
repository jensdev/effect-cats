import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";
import { Cat, CatIdFromString } from "./Cats.js"; // Import Cat and CatIdFromString

// CatId and Cat class are now imported from ./cats.ts

export class CatNotFound extends Schema.TaggedError<CatNotFound>()(
  "CatNotFound",
  {
    id: Schema.Number, // Refers to the ID by which cat was not found
  },
) {}

export class CatsApiGroup extends HttpApiGroup.make("cats")
  .add(HttpApiEndpoint.get("getAllCats", "/cats").addSuccess(Schema.Array(Cat)))
  .add(
    HttpApiEndpoint.get("getCatById", "/cats/:id")
      .addSuccess(Cat)
      .addError(CatNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: CatIdFromString })),
  )
  .add(
    HttpApiEndpoint.post("createCat", "/cats")
      .addSuccess(Cat)
      .setPayload(
        Schema.Struct({
          name: Schema.NonEmptyTrimmedString,
          breed: Schema.NonEmptyTrimmedString,
          age: Schema.Number,
        }),
      ),
  )
  .add(
    HttpApiEndpoint.patch("updateCat", "/cats/:id")
      .addSuccess(Cat)
      .addError(CatNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: CatIdFromString }))
      .setPayload(
        Schema.Struct({
          name: Schema.NonEmptyTrimmedString,
          breed: Schema.NonEmptyTrimmedString,
          age: Schema.Number,
        }),
      ),
  )
  .add(
    HttpApiEndpoint.del("deleteCat", "/cats/:id")
      .addSuccess(Schema.Void)
      .addError(CatNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: CatIdFromString })),
  ) {}

export class CatsApi extends HttpApi.make("api").add(CatsApiGroup) {}
