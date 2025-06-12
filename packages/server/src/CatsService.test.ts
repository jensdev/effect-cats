import { Effect, Layer, Option } from "effect";
import { Cat, CatId, CatNotFound, CatsApi } from "@effect-cats/domain";
import { CatsService, CatsServiceLive } from "./CatsService.js";
import { CatsRepository } from "./CatsRepository.js";
import { describe, it, expect, vi } from "vitest";

// Helper to create a mock Cat
const createMockCat = (id: number, name: string, breed: string, age: number): Cat =>
  new Cat({ id: CatId.make(id), name, breed, age });

// Define spies for repository methods that are CALLED AS FUNCTIONS by the service
const getByIdSpy = vi.fn();
const createSpy = vi.fn();
const updateSpy = vi.fn();
const removeSpy = vi.fn();

// This is the object that will be provided as the CatsRepository implementation.
// It needs to match the expected structure by CatsServiceLive:
// - `getAll` is an Effect property.
// - Other methods (`getById`, `create`, etc.) are functions that return Effects.
const mockCatsRepositoryImpl = {
  getAll: Effect.succeed([] as ReadonlyArray<Cat>), // Default Effect for getAll
  getById: getByIdSpy,
  create: createSpy,
  update: updateSpy,
  remove: removeSpy,
};

// Create a Layer for the mocked repository using the structured implementation
const CatsRepositoryMock = Layer.succeed(CatsRepository, mockCatsRepositoryImpl);

// Provide the live service with the (correctly structured) mocked repository
const TestLayer = Layer.provide(CatsServiceLive, CatsRepositoryMock);

describe("CatsService", () => {
  beforeEach(() => {
    // Reset all spies before each test
    vi.resetAllMocks();
    // Reset getAll to a default value (important if a test modifies it)
    mockCatsRepositoryImpl.getAll = Effect.succeed([]);
  });

  it("getAllCats should access repository.getAll and return its result", async () => {
    const mockCats = [
      createMockCat(1, "Whiskers", "Siamese", 2),
      createMockCat(2, "Felix", "Persian", 5),
    ];
    // Set the desired Effect for the getAll property for this specific test
    mockCatsRepositoryImpl.getAll = Effect.succeed(mockCats);

    const result = await Effect.runPromise(
      Effect.provide(CatsService.pipe(Effect.flatMap(s => s.getAllCats)), TestLayer)
    );

    // We can't use toHaveBeenCalledTimes on mockCatsRepositoryImpl.getAll directly
    // because it's a property, not a spy function.
    // The successful retrieval of mockCats is the primary assertion.
    expect(result).toEqual(mockCats);
  });

  it("getCatById should call repository.getById and return its result", async () => {
    const catId = CatId.make(1);
    const mockCat = createMockCat(1, "Whiskers", "Siamese", 2);
    getByIdSpy.mockReturnValue(Effect.succeed(mockCat));

    const result = await Effect.runPromise(
      Effect.provide(CatsService.pipe(Effect.flatMap(s => s.getCatById(catId))), TestLayer)
    );

    expect(getByIdSpy).toHaveBeenCalledWith(catId);
    expect(result).toEqual(mockCat);
  });

  it("getCatById should return CatNotFound if repository.getById fails", async () => {
    const catId = CatId.make(1);
    const notFoundError = new CatNotFound({ id: catId });
    getByIdSpy.mockReturnValue(Effect.fail(notFoundError));

    const program = Effect.provide(CatsService.pipe(Effect.flatMap(s => s.getCatById(catId))), TestLayer);
    const result = await Effect.runPromise(Effect.flip(program)); // Use Effect.flip to get the error

    expect(getByIdSpy).toHaveBeenCalledWith(catId);
    expect(result).toEqual(notFoundError);
  });

  it("createCat should call repository.create with the correct parameters", async () => {
    const name = "Garfield";
    const breed = "Tabby";
    const age = 7;
    const createdCat = createMockCat(3, name, breed, age);
    createSpy.mockReturnValue(Effect.succeed(createdCat));

    const result = await Effect.runPromise(
      Effect.provide(CatsService.pipe(Effect.flatMap(s => s.createCat(name, breed, age))), TestLayer)
    );

    expect(createSpy).toHaveBeenCalledWith(name, breed, age);
    expect(result).toEqual(createdCat);
  });

  it("updateCat should call repository.update with the correct parameters", async () => {
    const catId = CatId.make(1);
    const updateData = { name: "Whiskers Sr." };
    const updatedCat = createMockCat(1, "Whiskers Sr.", "Siamese", 2);
    updateSpy.mockReturnValue(Effect.succeed(updatedCat));

    const result = await Effect.runPromise(
      Effect.provide(CatsService.pipe(Effect.flatMap(s => s.updateCat(catId, updateData))), TestLayer)
    );

    expect(updateSpy).toHaveBeenCalledWith(catId, updateData);
    expect(result).toEqual(updatedCat);
  });

  it("updateCat should return CatNotFound if repository.update fails", async () => {
    const catId = CatId.make(1);
    const updateData = { name: "Whiskers Sr." };
    const notFoundError = new CatNotFound({ id: catId });
    updateSpy.mockReturnValue(Effect.fail(notFoundError));

    const program = Effect.provide(CatsService.pipe(Effect.flatMap(s => s.updateCat(catId, updateData))), TestLayer);
    const result = await Effect.runPromise(Effect.flip(program));

    expect(updateSpy).toHaveBeenCalledWith(catId, updateData);
    expect(result).toEqual(notFoundError);
  });

  it("deleteCat should call repository.remove with the correct id", async () => {
    const catId = CatId.make(1);
    removeSpy.mockReturnValue(Effect.succeed(void 0)); // remove returns void

    await Effect.runPromise(
      Effect.provide(CatsService.pipe(Effect.flatMap(s => s.deleteCat(catId))), TestLayer)
    );

    expect(removeSpy).toHaveBeenCalledWith(catId);
  });

  it("deleteCat should return CatNotFound if repository.remove fails", async () => {
    const catId = CatId.make(1);
    const notFoundError = new CatNotFound({ id: catId });
    removeSpy.mockReturnValue(Effect.fail(notFoundError));

    const program = Effect.provide(CatsService.pipe(Effect.flatMap(s => s.deleteCat(catId))), TestLayer);
    const result = await Effect.runPromise(Effect.flip(program));

    expect(removeSpy).toHaveBeenCalledWith(catId);
    expect(result).toEqual(notFoundError);
  });
});
