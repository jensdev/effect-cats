import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"

export const CatId = Schema.Number.pipe(Schema.brand("CatId"))
export type CatId = typeof CatId.Type

export const CatIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(CatId)
)

export class Cat extends Schema.Class<Cat>("Cat")({
  id: CatId,
  name: Schema.NonEmptyTrimmedString,
  breed: Schema.NonEmptyTrimmedString,
  age: Schema.Number
}) {}

export class CatNotFound extends Schema.TaggedError<CatNotFound>()("CatNotFound", {
  id: Schema.Number
}) {}

export class CatsApiGroup extends HttpApiGroup.make("cats")
  .add(HttpApiEndpoint.get("getAllCats", "/cats").addSuccess(Schema.Array(Cat)))
  .add(
    HttpApiEndpoint.get("getCatById", "/cats/:id")
      .addSuccess(Cat)
      .addError(CatNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: CatIdFromString })) // Corrected to use CatIdFromString
  )
  .add(
    HttpApiEndpoint.post("createCat", "/cats")
      .addSuccess(Cat)
      .setPayload(Schema.Struct({
        name: Schema.NonEmptyTrimmedString,
        breed: Schema.NonEmptyTrimmedString,
        age: Schema.Number
      }))
  )
  .add(
    HttpApiEndpoint.patch("updateCat", "/cats/:id") // Changed from "completeTodo" to "updateCat"
      .addSuccess(Cat)
      .addError(CatNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: CatIdFromString })) // Corrected to use CatIdFromString
      .setPayload(Schema.Struct({ // Added payload for update
        name: Schema.OptionFromNullOr(Schema.NonEmptyTrimmedString),
        breed: Schema.OptionFromNullOr(Schema.NonEmptyTrimmedString),
        age: Schema.OptionFromNullOr(Schema.Number)
      }))
  )
  .add(
    HttpApiEndpoint.del("deleteCat", "/cats/:id") // Changed from "removeTodo" to "deleteCat"
      .addSuccess(Schema.Void) // Success is Void as nothing is returned
      .addError(CatNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: CatIdFromString })) // Corrected to use CatIdFromString
  )
{}

export class CatsApi extends HttpApi.make("api").add(CatsApiGroup) {}
