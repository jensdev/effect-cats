import { DevTools } from "@effect/experimental";
import { NodeRuntime, NodeSocket, NodeHttpServer, HttpServer } from "@effect/platform-node";
import { Router } from "@effect/platform";
import { Effect, Layer, pipe } from "effect";
import catRoutes, { CatsService, InMemoryCatsServiceLive } from "./routes/cat-routes";
// import { Cats, CatsLayer } from "./services/cats"; // Original Cats service
import { CatsDataLayer } from "./data-access/cats-data"; // Assuming this is still needed for a more complete service

// Define the main router, integrating catRoutes
// It's common to prefix API routes, e.g., under /api
const AppRouter = Router.empty.pipe(
  Router.mount("/api", catRoutes)
  // Potentially other routes could be mounted here
);

// Create an HttpApp from the router
const HttpApp = HttpServer.serve(AppRouter).pipe(
  HttpServer.withLogAddress, // Logs the address the server is listening on
);

// Define the program: our HttpApp
const program = HttpApp;

// Define the application layer
// Providing InMemoryCatsServiceLive for the CatsService tag used in catRoutes.
// CatsDataLayer is kept as per original structure, though InMemoryCatsServiceLive is self-contained.
// If CatsLayer (from ./services/cats) is the intended provider for CatsService,
// it would replace InMemoryCatsServiceLive, assuming compatibility.
const AppLayer = Layer.merge(InMemoryCatsServiceLive, CatsDataLayer);

//       ┌─── Effect<never, Error, void> - this is the typical signature for a server program
//       ▼
const runnableProgram = program.pipe(
  Effect.provide(AppLayer),
  // Example of how to configure the server, e.g., port
  Layer.provide(HttpServer.layer({ port: 3000 }))
);


const DevToolsLive = DevTools.layerWebSocket().pipe(
  Layer.provide(NodeSocket.layerWebSocketConstructor),
);

pipe(
  runnableProgram,
  Effect.provide(DevToolsLive), // Add DevTools
  Layer.provide(NodeHttpServer.layer), // Provide the HTTP server implementation
  NodeRuntime.runMain
);
