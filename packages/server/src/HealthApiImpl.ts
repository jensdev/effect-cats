import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { api } from "@effect-cats/domain";

const startTime = Date.now();

export const healthApiLiveGroup = HttpApiBuilder.group(
  api,
  "health",
  (handlers) =>
    handlers.handle("health", () =>
      Effect.succeed({
        status: "ok" as const,
        timestamp: Date.now(),
        version: "1.0.0",
        uptime: Date.now() - startTime,
      })),
);
