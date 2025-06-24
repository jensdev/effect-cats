import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

// Health check schema
export const HealthStatus = Schema.Struct({
  status: Schema.Literal("ok"),
  timestamp: Schema.Number,
  version: Schema.String,
  uptime: Schema.Number,
});

export const healthApiGroup = HttpApiGroup.make("health")
  .add(HttpApiEndpoint.get("health", "/health").addSuccess(HealthStatus));
