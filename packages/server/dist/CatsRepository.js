"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatsRepositoryLive = exports.CatsRepository = void 0;
const CatsApi_1 = require("@effect-cats/domain/CatsApi");
const cats_1 = require("@effect-cats/domain/cats");
const effect_1 = require("effect");
// Create a context tag for the repository
exports.CatsRepository = effect_1.Context.Tag("CatsRepositoryService");
// Implement an in-memory version of the repository
exports.CatsRepositoryLive = effect_1.Layer.sync(exports.CatsRepository, () => {
    let catsStore = new Map();
    let nextId = 1;
    const getNextId = () => (0, cats_1.CatId)(nextId++);
    return {
        getAll: effect_1.Effect.sync(() => effect_1.ReadonlyArray.fromIterable(catsStore.values())),
        getById: (id) => effect_1.Option.fromNullable(catsStore.get(id)).pipe(effect_1.Effect.mapError(() => new CatsApi_1.CatNotFound({ id }))),
        create: (name, breed, age) => effect_1.Effect.sync(() => {
            const id = getNextId();
            const newCat = new cats_1.Cat({ id, name, breed, age });
            catsStore.set(id, newCat);
            return newCat;
        }),
        update: (id, data) => effect_1.Effect.gen(function* (_) {
            const cat = yield* _(effect_1.Option.fromNullable(catsStore.get(id)), effect_1.Effect.mapError(() => new CatsApi_1.CatNotFound({ id })));
            const updatedCat = new cats_1.Cat({ ...cat, ...data, id: cat.id }); // Ensure id is not changed
            catsStore.set(id, updatedCat);
            return updatedCat;
        }),
        remove: (id) => effect_1.Effect.sync(() => {
            if (catsStore.has(id)) {
                catsStore.delete(id);
                return effect_1.Effect.void;
            }
            return effect_1.Effect.fail(new CatsApi_1.CatNotFound({ id }));
        }).pipe(effect_1.Effect.flatten)
    };
});
