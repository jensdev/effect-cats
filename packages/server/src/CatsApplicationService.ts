import { Cat, CatId, CatNotFound } from "@effect-cats/domain";
import { Effect, Layer } from "effect";
import { CatsRepositoryPort } from "./CatsRepositoryPort.ts";
import { CatsServicePort, CatsServicePortType } from "./CatsServicePort.ts";

// Implement the service
export class CatsApplicationService implements CatsServicePortType {
  constructor(private readonly repository: CatsRepositoryPort["Type"]) {}

  readonly getAllCats = Effect.logDebug("getAllCats called").pipe(
    Effect.flatMap(() => this.repository.getAll),
    Effect.tap((cats) => Effect.logInfo(`Retrieved ${cats.length} cats`)),
    Effect.withSpan("CatsApplicationService/getAllCats"),
  );

  readonly getCatById = (id: CatId) =>
    Effect.logDebug(`getCatById called with id: ${id}`).pipe(
      Effect.flatMap(() => this.repository.getById(id)),
      Effect.tap((cat) => Effect.logInfo(`Retrieved cat: ${cat.name}`)),
      Effect.tapErrorTag(
        "CatNotFound",
        (e) => Effect.logWarning(`Cat with id: ${e.id} not found`),
      ),
      Effect.withSpan("CatsApplicationService/getCatById", {
        attributes: { "cat.id": id },
      }),
    );

  readonly createCat = (name: string, breed: string, age: number) =>
    Effect.logDebug(`createCat called with name: ${name}`).pipe(
      Effect.flatMap(() => this.repository.create(name, breed, age)),
      Effect.tap((cat) =>
        Effect.logInfo(`Created cat: ${cat.name} with id: ${cat.id}`)
      ),
      Effect.withSpan("CatsApplicationService/createCat", {
        attributes: {
          "cat.name": name,
          "cat.breed": breed,
          "cat.age": age,
        },
      }),
    );

  readonly updateCat = (id: CatId, data: Partial<Omit<Cat, "id">>) =>
    Effect.logDebug(`updateCat called with id: ${id}`).pipe(
      Effect.flatMap(() => this.repository.update(id, data)),
      Effect.tap((cat) => Effect.logInfo(`Updated cat: ${cat.name}`)),
      Effect.tapErrorTag(
        "CatNotFound",
        (e) =>
          Effect.logWarning(`Cat with id: ${e.id} not found during update`),
      ),
      Effect.withSpan("CatsApplicationService/updateCat", {
        attributes: { "cat.id": id, "cat.updateData": true },
      }),
    );

  readonly deleteCat = (id: CatId) =>
    Effect.logDebug(`deleteCat called with id: ${id}`).pipe(
      Effect.flatMap(() => this.repository.remove(id)),
      Effect.tap(() =>
        Effect.logInfo(`Attempted to delete cat with id: ${id}`)
      ),
      Effect.tapErrorTag(
        "CatNotFound",
        (e) =>
          Effect.logWarning(`Cat with id: ${e.id} not found for deletion`),
      ),
      Effect.withSpan("CatsApplicationService/deleteCat", {
        attributes: { "cat.id": id },
      }),
    );
}

export const CatsApplicationServiceLive = Layer.effect(
  CatsServicePort, // Provide for the CatsServicePort Tag
  Effect.gen(function* (_) {
    const repository = yield* _(CatsRepositoryPort);
    return new CatsApplicationService(repository);
  }),
);
