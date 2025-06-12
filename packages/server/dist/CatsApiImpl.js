"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatsApiLive = void 0;
const platform_1 = require("@effect/platform");
const CatsApi_1 = require("@effect-cats/domain/CatsApi");
const effect_1 = require("effect");
const CatsRepository_js_1 = require("./CatsRepository.js");
exports.CatsApiLive = platform_1.HttpApiBuilder.group(CatsApi_1.CatsApi, "cats", (handlers) => effect_1.Effect.gen(function* (_) {
    const catsRepo = yield* _(CatsRepository_js_1.CatsRepository);
    return handlers
        .handle("getAllCats", () => catsRepo.getAll)
        .handle("getCatById", ({ path: { id } }) => catsRepo.getById(id))
        .handle("createCat", ({ payload: { name, breed, age } }) => catsRepo.create(name, breed, age))
        .handle("updateCat", ({ path: { id }, payload }) => catsRepo.update(id, payload))
        .handle("deleteCat", ({ path: { id } }) => catsRepo.remove(id));
}));
