import { Router, HttpServer, HttpError } from "@effect/platform";
import { Effect, Schema, Equivalence } from "effect";
import { Cats } from "../../services/cats"; // Corrected import path
import { Cat, CatId } from "../../domain/cats"; // Corrected import path
import { CatNotFoundError } from "../../domain/errors"; // Corrected import path
import { v4 as uuidv4 } from "uuid"; // For generating IDs

// HTTP Request/Response Schemas (derived from Domain Cat)

// For POST requests: Omitting 'id' as it will be generated.
const CreateCatRequestSchema = Schema.omit(Cat, "id");

// For PUT requests: Partial of CreateCatRequestSchema, id comes from path.
const UpdateCatRequestSchema = Schema.partial(CreateCatRequestSchema);

const catRoutes = Router.empty.pipe(
  Router.get(
    "/cats",
    Effect.gen(function*(_) {
      const service = yield* _(Cats);
      const cats = yield* _(service.findAll());
      return yield* _(HttpServer.response.schemaJson(Schema.array(Cat))(cats));
    }).pipe(
      Effect.catchAll((e) => HttpServer.response.text(Equivalence.equals(e, {}) && e instanceof Error ? e.message : "Unknown error", { status: 500 }))
    )
  ),
  Router.get(
    "/cats/:id",
    Effect.gen(function*(_) {
      const req = yield* _(HttpServer.request.ServerRequest);
      const service = yield* _(Cats);
      const cat = yield* _(service.findById(req.params.id as CatId));
      return yield* _(HttpServer.response.schemaJson(Cat)(cat));
    }).pipe(
      Effect.catchTag("CatNotFoundError", (e) => HttpServer.response.text(e.message, { status: 404 })),
      Effect.catchAll((e) => HttpServer.response.text(Equivalence.equals(e, {}) && e instanceof Error ? e.message : "Unknown error", { status: 500 }))
    )
  ),
  Router.post(
    "/cats",
    Effect.gen(function*(_) {
      const req = yield* _(HttpServer.request.ServerRequest);
      const service = yield* _(Cats);
      const catData = yield* _(HttpServer.request.schemaBodyJson(CreateCatRequestSchema)(req));

      // Generate ID for the new cat
      const newCatId = uuidv4() as CatId;
      const newCat = new Cat({ ...catData, id: newCatId }); // Use the Cat class constructor

      yield* _(service.persist(newCat)); // Persist returns string message, not the cat object
      // Return the created cat object as per typical API behavior
      return yield* _(HttpServer.response.schemaJson(Cat)(newCat, { status: 201 }));
    }).pipe(
      Effect.catchTag("ParseError", (e) => HttpServer.response.text(e.message, { status: 400 })),
      Effect.catchAll((e) => HttpServer.response.text(Equivalence.equals(e, {}) && e instanceof Error ? e.message : "Unknown error", { status: 500 }))
    )
  ),
  Router.put(
    "/cats/:id",
    Effect.gen(function*(_) {
      const req = yield* _(HttpServer.request.ServerRequest);
      const service = yield* _(Cats);
      const catUpdateData = yield* _(HttpServer.request.schemaBodyJson(UpdateCatRequestSchema)(req));
      const catId = req.params.id as CatId;

      // Fetch existing cat
      const existingCat = yield* _(service.findById(catId));

      // Apply updates. Ensure all required fields of Cat are present.
      // Spread existingCat first, then catUpdateData to update fields.
      // If catUpdateData can remove fields (e.g. by providing undefined), ensure this is handled.
      // The Cat class constructor or a dedicated update method would be safer here.
      const updatedCatPayload = {
        ...existingCat, // Spread existing cat properties
        ...catUpdateData, // Override with updated properties
        id: catId // Ensure ID remains the same
      };
       // Re-construct to ensure it's a valid Cat instance, especially if there are class methods or validations.
      const updatedCat = new Cat(updatedCatPayload);


      yield* _(service.persist(updatedCat)); // Persist the updated cat
      return yield* _(HttpServer.response.schemaJson(Cat)(updatedCat));
    }).pipe(
      Effect.catchTag("ParseError", (e) => HttpServer.response.text(e.message, { status: 400 })),
      Effect.catchTag("CatNotFoundError", (e) => HttpServer.response.text(e.message, { status: 404 })),
      Effect.catchAll((e) => HttpServer.response.text(Equivalence.equals(e, {}) && e instanceof Error ? e.message : "Unknown error", { status: 500 }))
    )
  ),
  Router.delete(
    "/cats/:id",
    Effect.gen(function*(_) {
      const req = yield* _(HttpServer.request.ServerRequest);
      const service = yield* _(Cats);
      yield* _(service.removeById(req.params.id as CatId));
      return yield* _(HttpServer.response.json({ message: `Cat ${req.params.id} deleted` }, { status: 200 })); // 200 or 204
    }).pipe(
      Effect.catchTag("CatNotFoundError", (e) => HttpServer.response.text(e.message, { status: 404 })),
      Effect.catchAll((e) => HttpServer.response.text(Equivalence.equals(e, {}) && e instanceof Error ? e.message : "Unknown error", { status: 500 }))
    )
  )
);

export default catRoutes;
