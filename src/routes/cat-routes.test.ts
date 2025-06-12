import { Effect, Layer } from "effect";
import { Router, HttpServer, HttpError } from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import * as Http from "@effect/platform/HttpServer";
import * as Client from "@effect/platform/HttpClient";
import * as ClientRequest from "@effect/platform/HttpClientRequest";
import * as ClientResponse from "@effect/platform/HttpClientResponse";
import { Schema } from "@effect/schema"; // Keep Schema for potential ad-hoc schema needs in tests
import { v4 as uuidv4 } from "uuid";

// Updated imports for actual layers and domain models
import catRoutes from "./cat-routes";
import { CatsLayer } from "../../services/cats";
import { CatsData, CatsDataLayer, defaultCats } from "../../data-access/cats-data";
import { Cat, CatId } from "../../domain/cats";
import { Effect, Layer, Cause } from "effect";
import { Router, HttpServer } from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import * as Client from "@effect/platform/HttpClient";
import * as ClientRequest from "@effect/platform/HttpClientRequest";

// The application layer for tests, using actual CatsLayer and CatsDataLayer
const TestAppLayers = Layer.merge(CatsLayer, CatsDataLayer).pipe(
  Layer.provide(Client.layer), // Provide HttpClient layer for making requests
  Layer.provide(NodeHttpServer.layer) // Provide NodeHttpServer for running the server
);

// Helper to get a free port and start the server for a test
const runTestServer = <R, E>(router: Router.Router<R, E>) =>
  HttpServer.serve(router).pipe(
    Effect.flatMap(server => Effect.succeed(server.address)),
    HttpServer.withLogAddress,
    Layer.provide(HttpServer.layer({ port: 0 })) // Use port 0 for a random available port
  );

describe("Cat Routes with Real Services", () => {
  // GET /api/cats
  it("should get all default cats", () =>
    Effect.gen(function*(_) {
      const router = Router.empty.pipe(Router.mount("/api", catRoutes));
      const serverAddress = yield* _(runTestServer(router));
      const client = yield* _(Client.HttpClient);

      const response = yield* _(client(ClientRequest.get(`http://${serverAddress.address}:${serverAddress.port}/api/cats`)));
      const body = yield* _(response.json);

      expect(response.status).toBe(200);
      // Assert against the default cats from CatsDataLayer
      expect(body).toEqual(Array.from(defaultCats.values()));
    }).pipe(Effect.provide(TestAppLayers), Effect.runPromise));

  // POST /api/cats, then GET /api/cats/:id
  it("should create a new cat and then retrieve it", () =>
    Effect.gen(function*(_) {
      const router = Router.empty.pipe(Router.mount("/api", catRoutes));
      const serverAddress = yield* _(runTestServer(router));
      const client = yield* _(Client.HttpClient);

      const newCatData = { name: "Tom", age: 1, breed: "Bombay" as const };
      const postResponse = yield* _(client(ClientRequest.post(`http://${serverAddress.address}:${serverAddress.port}/api/cats`, { body: ClientRequest.jsonBody(newCatData) })));
      const createdCat = yield* _(postResponse.json as Effect.Effect<Cat, any>);

      expect(postResponse.status).toBe(201);
      expect(createdCat.id).toMatch(/^[0-9a-fA-F-]{36}$/); // UUID format
      expect(createdCat).toEqual(expect.objectContaining(newCatData));

      // Retrieve the created cat
      const getResponse = yield* _(client(ClientRequest.get(`http://${serverAddress.address}:${serverAddress.port}/api/cats/${createdCat.id}`)));
      const fetchedCat = yield* _(getResponse.json);

      expect(getResponse.status).toBe(200);
      expect(fetchedCat).toEqual(createdCat);
    }).pipe(Effect.provide(TestAppLayers), Effect.runPromise));

  it("should return 404 for a non-existent cat ID", () =>
    Effect.gen(function*(_) {
      const router = Router.empty.pipe(Router.mount("/api", catRoutes));
      const serverAddress = yield* _(runTestServer(router));
      const client = yield* _(Client.HttpClient);
      const nonExistentId = uuidv4() as CatId;

      const response = yield* _(client(ClientRequest.get(`http://${serverAddress.address}:${serverAddress.port}/api/cats/${nonExistentId}`)));
      expect(response.status).toBe(404);
      const body = yield* _(response.text);
      expect(body).toContain(`Cat with id ${nonExistentId} not found`);
    }).pipe(Effect.provide(TestAppLayers), Effect.runPromise));

  it("should return 400 for invalid cat data on POST (e.g. invalid age)", () =>
    Effect.gen(function*(_) {
      const router = Router.empty.pipe(Router.mount("/api", catRoutes));
      const serverAddress = yield* _(runTestServer(router));
      const client = yield* _(Client.HttpClient);
      const invalidCatData = { name: "Bad Cat", age: "veryold", breed: "Chartreux" }; // age is string

      const response = yield* _(client(ClientRequest.post(`http://${serverAddress.address}:${serverAddress.port}/api/cats`, { body: ClientRequest.jsonBody(invalidCatData) })));
      expect(response.status).toBe(400);
    }).pipe(Effect.provide(TestAppLayers), Effect.runPromise));

  // PUT /api/cats/:id
  it("should update an existing cat", () =>
    Effect.gen(function*(_) {
      const router = Router.empty.pipe(Router.mount("/api", catRoutes));
      const serverAddress = yield* _(runTestServer(router));
      const client = yield* _(Client.HttpClient);

      // Create a cat first to update it
      const initialCatData = { name: "Mittens", age: 2, breed: "Abyssinian" as const };
      const postResponse = yield* _(client(ClientRequest.post(`http://${serverAddress.address}:${serverAddress.port}/api/cats`, { body: ClientRequest.jsonBody(initialCatData) })));
      const createdCat = yield* _(postResponse.json as Effect.Effect<Cat, any>);
      expect(postResponse.status).toBe(201);

      const updates = { name: "Mittens Senior", age: 3 };
      const putResponse = yield* _(client(ClientRequest.put(`http://${serverAddress.address}:${serverAddress.port}/api/cats/${createdCat.id}`, { body: ClientRequest.jsonBody(updates) })));
      const updatedCat = yield* _(putResponse.json as Effect.Effect<Cat, any>);

      expect(putResponse.status).toBe(200);
      expect(updatedCat.id).toBe(createdCat.id);
      expect(updatedCat.name).toBe(updates.name);
      expect(updatedCat.age).toBe(updates.age);
      expect(updatedCat.breed).toBe(initialCatData.breed); // Breed should remain unchanged
    }).pipe(Effect.provide(TestAppLayers), Effect.runPromise));

  it("should return 404 when updating a non-existent cat", () =>
    Effect.gen(function*(_) {
      const router = Router.empty.pipe(Router.mount("/api", catRoutes));
      const serverAddress = yield* _(runTestServer(router));
      const client = yield* _(Client.HttpClient);
      const nonExistentId = uuidv4() as CatId;
      const updatedData = { name: "NonExistent", age: 5 };

      const response = yield* _(client(ClientRequest.put(`http://${serverAddress.address}:${serverAddress.port}/api/cats/${nonExistentId}`, { body: ClientRequest.jsonBody(updatedData) })));
      expect(response.status).toBe(404);
    }).pipe(Effect.provide(TestAppLayers), Effect.runPromise));

  // DELETE /api/cats/:id
  it("should delete a cat by ID", () =>
    Effect.gen(function*(_) {
      const router = Router.empty.pipe(Router.mount("/api", catRoutes));
      const serverAddress = yield* _(runTestServer(router));
      const client = yield* _(Client.HttpClient);

      const catToDeleteData = { name: "Ephemeral", age: 1, breed: "Bombay" as const };
      const postResponse = yield* _(client(ClientRequest.post(`http://${serverAddress.address}:${serverAddress.port}/api/cats`, { body: ClientRequest.jsonBody(catToDeleteData) })));
      const createdCat = yield* _(postResponse.json as Effect.Effect<Cat, any>);
      expect(postResponse.status).toBe(201);

      const deleteResponse = yield* _(client(ClientRequest.del(`http://${serverAddress.address}:${serverAddress.port}/api/cats/${createdCat.id}`)));
      const deleteBody = yield* _(deleteResponse.json);

      expect(deleteResponse.status).toBe(200);
      expect(deleteBody).toEqual({ message: `Cat ${createdCat.id} deleted` });

      // Verify it's actually deleted
      const verifyResponse = yield* _(client(ClientRequest.get(`http://${serverAddress.address}:${serverAddress.port}/api/cats/${createdCat.id}`)));
      expect(verifyResponse.status).toBe(404);
    }).pipe(Effect.provide(TestAppLayers), Effect.runPromise));

  it("should return 404 when deleting a non-existent cat", () =>
    Effect.gen(function*(_) {
      const router = Router.empty.pipe(Router.mount("/api", catRoutes));
      const serverAddress = yield* _(runTestServer(router));
      const client = yield* _(Client.HttpClient);
      const nonExistentId = uuidv4() as CatId;

      const response = yield* _(client(ClientRequest.del(`http://${serverAddress.address}:${serverAddress.port}/api/cats/${nonExistentId}`)));
      expect(response.status).toBe(404);
    }).pipe(Effect.provide(TestAppLayers), Effect.runPromise));
});
