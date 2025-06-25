import { Schema } from "effect";

export const HealthStatus = Schema.Struct({
  status: Schema.Literal("ok"),
  timestamp: Schema.Number,
  version: Schema.String,
  uptime: Schema.Number,
});
