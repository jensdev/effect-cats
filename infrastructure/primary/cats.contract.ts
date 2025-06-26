import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";
import { Cat } from "../../domain/entities/cat.ts";
import { CatIdFromString } from "../../domain/value-objects/cat.ts";
import { CatNotFound } from "../../domain/errors/cat-not-found.ts";

export const catsApiGroup = HttpApiGroup.make("cats")
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
        Schema.Struct(Cat.fields).pipe(Schema.omit("id")),
      ),
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
  );
