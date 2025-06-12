"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const platform_1 = require("@effect/platform");
const platform_node_1 = require("@effect/platform-node");
const schema_1 = require("@effect/schema");
const effect_1 = require("effect");
const Api_js_1 = require("./Api.js"); // Our combined API layer
// Define a simple Layer for HTTP server configuration
const HttpConfigLive = effect_1.Layer.succeed(platform_1.HttpServer.HttpServerConfig, platform_1.HttpServer.HttpServerConfig.of((_) => ({
    port: schema_1.Schema.decodeUnknownSync(schema_1.Schema.NumberFromString)(process.env.PORT) ||
        3000, // Default to port 3000
})));
const HttpLive = platform_1.HttpRouter.Default.pipe(platform_1.HttpRouter.concat(Api_js_1.ApiLive), // Add our API routes
platform_1.HttpServer.serve(), platform_1.HttpServer.setConfig(platform_1.HttpServer.HttpServerConfig.access), effect_1.Layer.provide(platform_node_1.NodeHttpServer.layer), effect_1.Layer.provide(HttpConfigLive));
const MainLive = HttpLive.pipe(effect_1.Layer.provide(effect_1.Logger.minimumLogLevel(effect_1.LogLevel.All)), // Configure logging
effect_1.Layer.launch);
// Run the server
platform_node_1.NodeRuntime.runMain(MainLive);
console.log("Server running at http://localhost:3000");
