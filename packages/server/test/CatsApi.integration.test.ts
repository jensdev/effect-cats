import { HttpApi, HttpApp, HttpRouter, HttpServerRequest, HttpTesting } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Schema } from "@effect/schema";
import { Cat, CatId } from "@template/domain/cats.js";
import { CatsApi } from "@template/domain/CatsApi.js";
import { Effect, Layer, ReadonlyArray } from "effect";
import { describe, it, expect } from "vitest"; // Assuming vitest
import { ApiLive } from "../src/Api.js"; // Main API layer
import { CatsRepository, CatsRepositoryLive } from "../src/CatsRepository.js";

// Create a testing layer that includes our API and an in-memory repository
const TestApiLive = ApiLive.pipe(
  Layer.provide(CatsRepositoryLive) // Ensure a fresh repo for each test suite if needed, or manage state
);

// Helper to run an Effect with the test layer
const runTest = <E, A>(effect: Effect.Effect<A, E, HttpRouter.HttpRouter | CatsRepository>) =>
  Effect.provide(effect, TestApiLive).pipe(NodeRuntime.runPromise);


describe("CatsApi Integration Tests", () => {
  it("GET /cats - should return an empty array initially", () =>
    HttpTesting.make(TestApiLive).pipe(
      Effect.flatMap((http) => http.get("/cats")),
      Effect.flatMap((response) => response.json),
      Effect.map((body) => {
        expect(body).toEqual([]);
      }),
      Effect.scoped, // Ensure resources are properly managed
      NodeRuntime.runPromise
    ));

  it("POST /cats - should create a cat", () =>
    Effect.gen(function* (_) {
      const client = yield* _(HttpTesting.make(TestApiLive));
      const newCatPayload = { name: "Garfield", breed: "Tabby", age: 5 };

      const response = yield* _(client.post("/cats").pipe(
        HttpServerRequest.HttpServerRequest.setBody(
          HttpServerRequest.Body.unsafeJson(newCatPayload)
        )
      ));
      const body = yield* _(response.json);

      expect(response.status).toBe(201); // Standard for created resource, though API definition defaults to 200
      expect(body).toHaveProperty("id");
      expect(body).toMatchObject(newCatPayload);

      const catId = (body as Cat).id;

      // Verify by getting the cat
      const getResponse = yield* _(client.get(`/cats/${catId}`));
      const getBody = yield* _(getResponse.json);
      expect(getResponse.status).toBe(200);
      expect(getBody).toEqual(body);
    }).pipe(Effect.scoped, NodeRuntime.runPromise));

  it("GET /cats/:id - should return a cat by id", () =>
    Effect.gen(function* (_) {
      const client = yield* _(HttpTesting.make(TestApiLive));
      const repo = yield* _(CatsRepository);
      const createdCat = yield* _(repo.create("Felix", "Cartoon", 10));

      const response = yield* _(client.get(`/cats/${createdCat.id}`));
      const body = yield* _(response.json);

      expect(response.status).toBe(200);
      expect(body).toEqual(Cat.encodeSync(createdCat)); // Ensure proper encoding comparison
    }).pipe(Effect.scoped, NodeRuntime.runPromise));

  it("GET /cats/:id - should return 404 for a non-existent cat", () =>
    HttpTesting.make(TestApiLive).pipe(
      Effect.flatMap((http) => http.get("/cats/9999")),
      Effect.map((response) => {
        expect(response.status).toBe(404);
      }),
      Effect.scoped,
      NodeRuntime.runPromise
    ));

  it("PATCH /cats/:id - should update a cat", () =>
    Effect.gen(function* (_) {
      const client = yield* _(HttpTesting.make(TestApiLive));
      const repo = yield* _(CatsRepository);
      const createdCat = yield* _(repo.create("Tom", "Cartoon", 7));

      const updatePayload = { name: "Thomas" };
      const response = yield* _(client.patch(`/cats/${createdCat.id}`).pipe(
        HttpServerRequest.HttpServerRequest.setBody(
          HttpServerRequest.Body.unsafeJson(updatePayload)
        )
      ));
      const body = yield* _(response.json);

      expect(response.status).toBe(200);
      expect(body.name).toBe("Thomas");
      expect(body.breed).toBe("Cartoon"); // Unchanged

      // Verify in repo
      const updatedCatInRepo = yield* _(repo.getById(createdCat.id));
      expect(updatedCatInRepo.name).toBe("Thomas");
    }).pipe(Effect.scoped, NodeRuntime.runPromise));

  it("DELETE /cats/:id - should delete a cat", () =>
    Effect.gen(function* (_) {
      const client = yield* _(HttpTesting.make(TestApiLive));
      const repo = yield* _(CatsRepository);
      const cat1 = yield* _(repo.create("Sylvester", "Cartoon", 8));
      const cat2 = yield* _(repo.create("Puss in Boots", "Fairy Tale", 6));

      const deleteResponse = yield* _(client.delete(`/cats/${cat1.id}`));
      expect(deleteResponse.status).toBe(200); // Or 204 if No Content, but our API returns Void -> 200 with null body

      // Verify it's gone
      const getResponse = yield* _(client.get(`/cats/${cat1.id}`));
      expect(getResponse.status).toBe(404);

      // Verify other cat is still there
      const allCatsResponse = yield* _(client.get("/cats"));
      const allCatsBody = yield* _(allCatsResponse.json as Effect.Effect<any>);
      expect(allCatsBody.length).toBe(1);
      expect(allCatsBody[0].id).toBe(cat2.id);
    }).pipe(Effect.scoped, NodeRuntime.runPromise));

  it("DELETE /cats/:id - should return 404 for non-existent cat", () =>
    HttpTesting.make(TestApiLive).pipe(
      Effect.flatMap((http) => http.delete("/cats/8888")),
      Effect.map((response) => {
        expect(response.status).toBe(404);
      }),
      Effect.scoped,
      NodeRuntime.runPromise
    ));
});
