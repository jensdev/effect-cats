import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { HealthStatus } from "../../domain/entities/health.ts";

export const healthApiGroup = HttpApiGroup.make("health")
  .add(HttpApiEndpoint.get("health", "/health").addSuccess(HealthStatus));
