import { DevTools } from "@effect/experimental";
import { NodeRuntime, NodeSocket, NodeHttpServer, HttpServer } from "@effect/platform-node";
import { Router } from "@effect/platform";
import { Effect, Layer, pipe } from "effect";
import catRoutes from "./routes/cat-routes"; // InMemoryCatsServiceLive and CatsService removed
import { CatsLayer } from "./services/cats"; // Uncommented and Cats tag removed as it's not used directly here
import { CatsDataLayer } from "./data-access/cats-data";

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
// Define the application layer
// Now providing the actual CatsLayer and CatsDataLayer.
const AppLayer = Layer.merge(CatsLayer, CatsDataLayer);

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
