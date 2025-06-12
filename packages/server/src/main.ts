import { HttpRouter, HttpServer } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Schema } from "@effect/schema";
import { Effect, Layer, Logger, LogLevel } from "effect";
import { ApiLive } from "./Api.js"; // Our combined API layer

// Define a simple Layer for HTTP server configuration
const HttpConfigLive = Layer.succeed(
  HttpServer.HttpServerConfig,
  HttpServer.HttpServerConfig.of((_) => ({
    port:
      Schema.decodeUnknownSync(Schema.NumberFromString)(process.env.PORT) ||
      3000, // Default to port 3000
  })),
);

const HttpLive = HttpRouter.Default.pipe(
  HttpRouter.concat(ApiLive), // Add our API routes
  HttpServer.serve(),
  HttpServer.setConfig(HttpServer.HttpServerConfig.access),
  Layer.provide(NodeHttpServer.layer),
  Layer.provide(HttpConfigLive),
);

const MainLive = HttpLive.pipe(
  Layer.provide(Logger.minimumLogLevel(LogLevel.All)), // Configure logging
  Layer.launch,
);

// Run the server
NodeRuntime.runMain(MainLive);

console.log("Server running at http://localhost:3000");
