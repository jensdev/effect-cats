"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiLive = void 0;
const platform_1 = require("@effect/platform");
const CatsApi_1 = require("@effect-cats/domain/CatsApi");
const effect_1 = require("effect");
const CatsApiImpl_js_1 = require("./CatsApiImpl.js");
const CatsRepository_js_1 = require("./CatsRepository.js");
// This will be the main export for the server to build the API
exports.ApiLive = platform_1.HttpApiBuilder.api(CatsApi_1.CatsApi).pipe(effect_1.Layer.provide(CatsApiImpl_js_1.CatsApiLive), effect_1.Layer.provide(CatsRepository_js_1.CatsRepositoryLive));
