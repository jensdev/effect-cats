import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { contract } from "./contract.ts";

const startTime = Date.now();

export const healthApiLiveGroup = HttpApiBuilder.group(
  contract,
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
