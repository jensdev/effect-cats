import { Router, HttpServer, HttpError } from "@effect/platform";
import { Effect, Schema, Context } from "effect";

// Assuming Cat schema is defined in ../schemas/cat-schema
// And Cats service is defined in ../services/cat-service

// Placeholder Cat Schema
const CatSchema = Schema.struct({
  id: Schema.string,
  name: Schema.string,
  age: Schema.number,
});
type Cat = Schema.Schema.infer<typeof CatSchema>;

const CreateCatSchema = Schema.omit(CatSchema, "id");
type CreateCat = Schema.Schema.infer<typeof CreateCatSchema>;

const UpdateCatSchema = Schema.partial(CreateCatSchema)
type UpdateCat = Schema.Schema.infer<typeof UpdateCatSchema>;


// Placeholder Cats Service
interface CatsService {
  getCats: Effect.Effect<Cat[], Error>;
  getCatById: (id: string) => Effect.Effect<Cat, Error>;
  createCat: (cat: CreateCat) => Effect.Effect<Cat, Error>;
  updateCat: (id: string, cat: UpdateCat) => Effect.Effect<Cat, Error>;
  deleteCat: (id: string) => Effect.Effect<{ message: string }, Error>;
}

export const CatsService = Context.Tag<CatsService>("CatsService");

// In a real application, this would be provided by the service implementation
export const InMemoryCatsServiceLive = Layer.effect(
  CatsService,
  Effect.succeed({
    cats: new Map<string, Cat>([
      ["1", { id: "1", name: "Whiskers", age: 2 }],
      ["2", { id: "2", name: "Felix", age: 3 }],
    ]),
    getCats: Effect.sync(function* (this: { cats: Map<string, Cat> }) {
      return Array.from(this.cats.values());
    }),
    getCatById: (id: string) =>
      Effect.sync(function* (this: { cats: Map<string, Cat> }) {
        const cat = this.cats.get(id);
        if (!cat) {
          return yield* Effect.fail(HttpError.notFound(`Cat with id ${id} not found`));
        }
        return cat;
      }),
    createCat: (catData: CreateCat) =>
      Effect.sync(function* (this: { cats: Map<string, Cat> }) {
        const newId = String(this.cats.size + 1);
        const newCat: Cat = { ...catData, id: newId };
        this.cats.set(newId, newCat);
        return newCat;
      }),
    updateCat: (id: string, catData: UpdateCat) =>
      Effect.sync(function* (this: { cats: Map<string, Cat> }) {
        const existingCat = this.cats.get(id);
        if (!existingCat) {
          return yield* Effect.fail(HttpError.notFound(`Cat with id ${id} not found`));
        }
        const updatedCat = { ...existingCat, ...catData };
        this.cats.set(id, updatedCat);
        return updatedCat;
      }),
    deleteCat: (id: string) =>
      Effect.sync(function* (this: { cats: Map<string, Cat> }) {
        if (!this.cats.delete(id)) {
          return yield* Effect.fail(HttpError.notFound(`Cat with id ${id} not found`));
        }
        return { message: `Cat ${id} deleted` };
      }),
  })
);


const catRoutes = Router.empty.pipe(
    ["2", { id: "2", name: "Felix", age: 3 }],
  ]),
  getCats: Effect.sync(function*() {
    // `this` refers to InMemoryCatsServiceLive.cats
    // type casting to any to avoid type errors with `this`
    return Array.from((this as any).cats.values());
  }),
  getCatById: (id: string) => Effect.sync(function*() {
    const cat = (this as any).cats.get(id);
    if (!cat) {
      return yield* Effect.fail(HttpError.notFound(`Cat with id ${id} not found`));
    }
    return cat;
  }),
  createCat: (catData: CreateCat) => Effect.sync(function*() {
    const newId = String((this as any).cats.size + 1);
    const newCat: Cat = { ...catData, id: newId };
    (this as any).cats.set(newId, newCat);
    return newCat;
  }),
  updateCat: (id: string, catData: UpdateCat) => Effect.sync(function*() {
    const existingCat = (this as any).cats.get(id);
    if (!existingCat) {
      return yield* Effect.fail(HttpError.notFound(`Cat with id ${id} not found`));
    }
    const updatedCat = { ...existingCat, ...catData };
    (this as any).cats.set(id, updatedCat);
    return updatedCat;
  }),
  deleteCat: (id: string) => Effect.sync(function*() {
    if (!(this as any).cats.delete(id)) {
        return yield* Effect.fail(HttpError.notFound(`Cat with id ${id} not found`));
    }
    return { message: `Cat ${id} deleted` };
  }),
});


const catRoutes = Router.empty.pipe(
  Router.get(
    "/cats",
    Effect.gen(function*(_) {
      const service = yield* _(CatsService);
      const cats = yield* _(service.getCats);
      return yield* _(HttpServer.response.schemaJson(Schema.array(CatSchema))(cats));
    }).pipe(Effect.catchAll((e) => HttpServer.response.text(e.message, { status: 500 })))
  ),
  Router.get(
    "/cats/:id",
    Effect.gen(function*(_) {
      const req = yield* _(HttpServer.request.ServerRequest);
      const service = yield* _(CatsService);
      const cat = yield* _(service.getCatById(req.params.id));
      return yield* _(HttpServer.response.schemaJson(CatSchema)(cat));
    }).pipe(
        Effect.catchTag("NotFoundError", (e) => HttpServer.response.text(e.message, { status: 404 })),
        Effect.catchAll((e) => HttpServer.response.text(e.message, { status: 500 }))
    )
  ),
  Router.post(
    "/cats",
    Effect.gen(function*(_) {
      const req = yield* _(HttpServer.request.ServerRequest);
      const service = yield* _(CatsService);
      const catData = yield* _(HttpServer.request.schemaBodyJson(CreateCatSchema)(req));
      const newCat = yield* _(service.createCat(catData));
      return yield* _(HttpServer.response.schemaJson(CatSchema)(newCat, { status: 201 }));
    }).pipe(
        Effect.catchTag("ParseError", (e) => HttpServer.response.text(e.message, { status: 400 })),
        Effect.catchAll((e) => HttpServer.response.text(e.message, { status: 500 }))
    )
  ),
  Router.put(
    "/cats/:id",
    Effect.gen(function*(_) {
      const req = yield* _(HttpServer.request.ServerRequest);
      const service = yield* _(CatsService);
      const catData = yield* _(HttpServer.request.schemaBodyJson(UpdateCatSchema)(req));
      const updatedCat = yield* _(service.updateCat(req.params.id, catData));
      return yield* _(HttpServer.response.schemaJson(CatSchema)(updatedCat));
    }).pipe(
        Effect.catchTag("ParseError", (e) => HttpServer.response.text(e.message, { status: 400 })),
        Effect.catchTag("NotFoundError", (e) => HttpServer.response.text(e.message, { status: 404 })),
        Effect.catchAll((e) => HttpServer.response.text(e.message, { status: 500 }))
    )
  ),
  Router.delete(
    "/cats/:id",
    Effect.gen(function*(_) {
      const req = yield* _(HttpServer.request.ServerRequest);
      const service = yield* _(CatsService);
      const result = yield* _(service.deleteCat(req.params.id));
      return yield* _(HttpServer.response.schemaJson(Schema.struct({ message: Schema.string }))(result));
    }).pipe(
        Effect.catchTag("NotFoundError", (e) => HttpServer.response.text(e.message, { status: 404 })),
        Effect.catchAll((e) => HttpServer.response.text(e.message, { status: 500 }))
    )
  )
);

export default catRoutes;
