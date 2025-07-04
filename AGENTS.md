This instructs AI agents how to navigate and edit this codebase.

# Environment & Tooling

- We use the Deno runtime.
- Deno is used for formatting, linting, and task running.
  - Run `deno task fmt` to format all files (or `deno fmt $FILE` for a single
    file).
  - Run `deno task lint` to lint all files.
  - Run `deno task test` to execute tests.
  - Run `deno task dev` to start the development server.
- Dependencies are managed via the `deno.json` file. No separate install step is
  usually needed as Deno handles this.

# Code

- When importing Effect Schema use it like so: `import { Schema } from "effect"`
- When importing node modules, always import the full module and name it NPath
  for node:path, NUrl for node:url, etc.
- Always use extension in file imports.
- Do not unwrap effects in `Effect.gen`. You can `yield*` effects directly.
- Do not write obvious comments that restate what the code is doing without
  adding meaningful context.

# Running the Application

- To run the application in development mode (with auto-reloading on file
  changes), use:
  ```bash
  deno task dev
  ```

# Testing

- To run all tests:
  ```bash
  deno task test
  ```

# Linting

- To lint all files:
  ```bash
  deno task lint
  ```
  (Note: This is also covered under "Environment & Tooling" for completeness, as
  `deno task lint` is the specific command.)

# Project Structure

This project follows a hexagonal architecture pattern:

- `domain/`: Contains the core business logic, entities, and value objects. This
  layer should be independent of any application or infrastructure concerns.
- `application/`: Contains application-specific services that orchestrate the
  domain logic. It defines ports (interfaces) for interacting with the outside
  world (e.g., primary adapters like HTTP controllers, and secondary adapters
  like database repositories).
- `infrastructure/`: Contains implementations of the ports defined in the
  application layer. This includes:
  - `primary/`: Adapters that drive the application (e.g., HTTP server, CLI
    commands).
  - `secondary/`: Adapters that the application uses to interact with external
    systems (e.g., database implementations, external API clients).
- `main.ts`: The entry point of the application, responsible for wiring up
  dependencies and starting the application.

# Commit Messages

- Please follow the Conventional Commits specification (e.g.,
  `feat: add new cat endpoint`, `fix: resolve issue with cat adoption`).

# Effect-TS Patterns Overview

This project uses [Effect-TS](https://effect.website) for functional programming with typed errors, dependency injection, and resource management. The following patterns are consistently used throughout the codebase.

## Core Patterns

### 1. **Data.TaggedError** - Typed Error Handling
- See: #Effect TaggedError Pattern
- Use for creating typed error classes with structured error information
- Consistent naming: end with "Error", include relevant context

### 2. **Effect.Service** - Dependency Injection
- See: #Effect Service Pattern
- Use for creating reusable, injectable services
- Encapsulate related functionality with proper dependency management

### 3. **Effect.fn & Effect.gen** - Effectful Functions
- See: #Effect Functions and Generators
- `Effect.fn` for named Effect functions with tracing
- `Effect.gen` for generator-style effectful code

### 4. **Layer** - Dependency Composition
- See: #Effect Layer Pattern
- Use `Layer.mergeAll()` to compose application dependencies
- Prefer `Service.Default` layers over manual creation

### 5. **Error Handling** - Robust Error Management
- See: #Effect Error Handling Patterns
- Use `Effect.mapError`, `Effect.either`, `Effect.catchTag`
- Transform external errors to tagged errors at boundaries

### 6. **Config** - Type-Safe Configuration
- See: #Effect Configuration Patterns
- Use `Config.string()`, `Config.number()`, etc. for environment variables
- Use `Config.redacted()` for sensitive values

### 7. **Workflows** - Business Logic Orchestration
- See: #Effect Workflow Patterns
- Orchestrate multiple services for complex business logic
- Use `Effect.gen` to coordinate between services

## Project Structure

```
packages/ffmpeg/src/
├── services.ts          # Core services with Effect.Service pattern
├── workflows.ts         # High-level workflows using Effect.gen
├── ffmpeg-commands.ts   # FFmpeg operations as Effect functions
├── app-layer.ts         # Application layer composition
├── queue/               # Queue management services
└── __tests__/           # Tests using Effect patterns
```

## Common Imports

```typescript
import { Data, Effect, Config, Layer } from "effect";
import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
```

## Typical Service Structure

```typescript
export class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.gen(function* () {
    // Dependencies
    const fs = yield* FileSystem.FileSystem;
    const config = yield* Config.string("SOME_CONFIG");

    return {
      // Methods using Effect.fn
      doSomething: Effect.fn("doSomething")(function* (param: string) {
        // Implementation
      }),
    };
  }),
  dependencies: [NodeFileSystem.layer], // Platform dependencies
}) {}
```

## Typical Workflow Structure

```typescript
const workflow = Effect.gen(function* () {
  // Get services
  const service = yield* MyService;
  const config = yield* Config.string("CONFIG_KEY");

  // Perform operations with error handling
  const result = yield* service.doSomething(config).pipe(
    Effect.mapError((e) => new WorkflowError({ cause: e }))
  );

  return result;
});
```

## App Layer Pattern

```typescript
export const AppLayerLive = Layer.mergeAll(
  // All your services
  ServiceA.Default,
  ServiceB.Default,
  ServiceC.Default,

  // Platform layers
  NodeFileSystem.layer,
);
```

## Running Effects

```typescript
// In main application
Effect.runPromise(
  myWorkflow().pipe(Effect.provide(AppLayerLive))
);
```

## Key Benefits

1. **Type Safety**: All errors are typed and trackable
2. **Dependency Injection**: Clean, testable dependency management
3. **Resource Management**: Automatic cleanup with proper scoping
4. **Composability**: Services and layers compose naturally
5. **Testability**: Easy mocking and test layer creation
6. **Tracing**: Built-in tracing with Effect.fn naming

## When to Use Each Pattern

- **Services**: For stateful operations, external integrations, business logic
- **Workflows**: For orchestrating multiple services and operations
- **Tagged Errors**: For any operation that can fail with specific errors
- **Layers**: For wiring up application dependencies
- **Config**: For any configuration or environment variables
- **Effect.fn**: For any function that performs Effects (almost all functions)

See the individual pattern files for detailed examples and best practices.

# Effect Configuration Patterns

## Basic Configuration Access

Use `Config` to access environment variables and configuration values in a type-
safe way.

### String Configuration

```typescript
import { Config, Effect } from "effect";

const workflow = Effect.gen(function* () {
  // Required string configuration
  const apiUrl = yield* Config.string("API_URL");

  // String with default value
  const environment = yield* Config.string("NODE_ENV").pipe(
    Config.withDefault("development")
  );

  return { apiUrl, environment };
});
```

### Number Configuration

```typescript
const numericConfig = Effect.gen(function* () {
  // Required number
  const port = yield* Config.number("PORT");

  // Number with default
  const timeout = yield* Config.number("TIMEOUT").pipe(
    Config.withDefault(5000)
  );

  // Number with validation
  const workers = yield* Config.number("WORKER_COUNT").pipe(
    Config.withDefault(4),
    Config.validate({
      message: "Worker count must be between 1 and 16",
      validation: (n) => n >= 1 && n <= 16
    })
  );

  return { port, timeout, workers };
});
```

### Boolean Configuration

```typescript
const booleanConfig = Effect.gen(function* () {
  // Boolean configuration
  const debugMode = yield* Config.boolean("DEBUG_MODE").pipe(
    Config.withDefault(false)
  );

  const enableFeature = yield* Config.boolean("ENABLE_FEATURE");

  return { debugMode, enableFeature };
});
```

## Sensitive Configuration

Use `Config.redacted` for sensitive values like API keys, passwords, etc.:

```typescript
const sensitiveConfig = Effect.gen(function* () {
  // Redacted configuration for sensitive data
  const apiKey = yield* Config.redacted(Config.string("API_KEY"));
  const dbPassword = yield* Config.redacted(Config.string("DB_PASSWORD"));

  // Use Redacted.value() to access the actual value
  const client = new ApiClient({
    apiKey: Redacted.value(apiKey),
  });

  return client;
});
```

## Configuration in Services

```typescript
export class ConfigurableService extends Effect.Service<ConfigurableService>()(
  "ConfigurableService",
  {
    effect: Effect.gen(function* () {
      // Load configuration during service initialization
      const baseUrl = yield* Config.string("API_BASE_URL");
      const timeout = yield* Config.number("API_TIMEOUT").pipe(
        Config.withDefault(10000)
      );
      const retries = yield* Config.number("API_RETRIES").pipe(
        Config.withDefault(3)
      );

      return {
        makeRequest: Effect.fn("makeRequest")(function* (endpoint: string) {
          const url = `${baseUrl}/${endpoint}`;
          // Use configuration in implementation
          return yield* httpRequest(url, { timeout, retries });
        }),
      };
    }),
  }
) {}
```

## Configuration Validation

```typescript
const validatedConfig = Effect.gen(function* () {
  // Custom validation
  const port = yield* Config.number("PORT").pipe(
    Config.validate({
      message: "Port must be between 1000 and 65535",
      validation: (port) => port >= 1000 && port <= 65535
    })
  );

  // URL validation
  const apiUrl = yield* Config.string("API_URL").pipe(
    Config.validate({
      message: "Must be a valid URL",
      validation: (url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      }
    })
  );

  return { port, apiUrl };
});
```

## Array Configuration

```typescript
const arrayConfig = Effect.gen(function* () {
  // Comma-separated values
  const allowedOrigins = yield* Config.string("ALLOWED_ORIGINS").pipe(
    Config.map((str) => str.split(",").map(s => s.trim())),
    Config.withDefault([])
  );

  // JSON array configuration
  const features = yield* Config.string("ENABLED_FEATURES").pipe(
    Config.map((str) => JSON.parse(str) as string[]),
    Config.withDefault([])
  );

  return { allowedOrigins, features };
});
```

## Nested Configuration Objects

```typescript
const complexConfig = Effect.gen(function* () {
  // Build configuration object
  const databaseConfig = {
    host: yield* Config.string("DB_HOST"),
    port: yield* Config.number("DB_PORT").pipe(Config.withDefault(5432)),
    database: yield* Config.string("DB_NAME"),
    username: yield* Config.string("DB_USER"),
    password: yield* Config.redacted(Config.string("DB_PASSWORD")),
  };

  const redisConfig = {
    host: yield* Config.string("REDIS_HOST").pipe(
      Config.withDefault("localhost")
    ),
    port: yield* Config.number("REDIS_PORT").pipe(
      Config.withDefault(6379)
    ),
  };

  return { database: databaseConfig, redis: redisConfig };
});
```

## Environment-Specific Configuration

```typescript
const environmentConfig = Effect.gen(function* () {
  const env = yield* Config.string("NODE_ENV").pipe(
    Config.withDefault("development")
  );

  // Different configs based on environment
  const logLevel = yield* Config.string("LOG_LEVEL").pipe(
    Config.withDefault(env === "production" ? "info" : "debug")
  );

  const enableMetrics = yield* Config.boolean("ENABLE_METRICS").pipe(
    Config.withDefault(env === "production")
  );

  return { env, logLevel, enableMetrics };
});
```

## Configuration Error Handling

```typescript
const safeConfig = Effect.gen(function* () {
  const config = yield* Effect.all({
    apiUrl: Config.string("API_URL"),
    timeout: Config.number("TIMEOUT").pipe(Config.withDefault(5000)),
    retries: Config.number("RETRIES").pipe(Config.withDefault(3)),
  }).pipe(
    Effect.mapError((configError) =>
      new ConfigurationError({
        message: "Failed to load configuration",
        cause: configError
      })
    )
  );

  return config;
});
```

## Configuration Constants

```typescript
// Define configuration keys as constants
const CONFIG_KEYS = {
  API_URL: "API_URL",
  API_TIMEOUT: "API_TIMEOUT",
  DATABASE_URL: "DATABASE_URL",
  REDIS_URL: "REDIS_URL",
} as const;

const typedConfig = Effect.gen(function* () {
  const apiUrl = yield* Config.string(CONFIG_KEYS.API_URL);
  const timeout = yield* Config.number(CONFIG_KEYS.API_TIMEOUT).pipe(
    Config.withDefault(10000)
  );

  return { apiUrl, timeout };
});
```

## Testing with Configuration

```typescript
// Test configuration layer
const TestConfigLayer = Layer.succeed(
  Config.Tag,
  Config.make(new Map([
    ["API_URL", "http://localhost:3000"],
    ["TIMEOUT", "1000"],
    ["DEBUG_MODE", "true"],
  ]))
);

// Use in tests
test("should work with test config", async () => {
  const result = await Effect.runPromise(
    myConfigurableFunction().pipe(
      Effect.provide(TestConfigLayer)
    )
  );

  expect(result).toBe("expected");
});
```

## Best Practices

1. **Use Defaults**: Provide sensible defaults with `Config.withDefault`
2. **Validate Early**: Validate configuration at application startup
3. **Redact Secrets**: Always use `Config.redacted` for sensitive values
4. **Document Required**: Document which environment variables are required
5. **Group Related**: Group related configuration into objects
6. **Environment Aware**: Use different defaults for different environments
7. **Fail Fast**: Let configuration errors fail the application startup
8. **Test Configuration**: Test with different configuration values

# Effect Error Handling Patterns

## Error Transformation with mapError

Use `Effect.mapError` to transform errors into your own tagged error types:

```typescript
yield* Effect.tryPromise(() => someAsyncOperation())
  .pipe(
    Effect.mapError((e) => new MyOperationError({ cause: e }))
  );
```

## Safe Effect Execution with Either

Use `Effect.either` to convert failures into successful Either values:

```typescript
const result = yield* riskyOperation().pipe(Effect.either);

if (Either.isLeft(result)) {
  yield* Effect.logError("Operation failed", result.left);
  // Handle error
} else {
  // Use result.right
  const successValue = result.right;
}
```

## Error Recovery with catchAll

```typescript
const recoveredOperation = riskyOperation().pipe(
  Effect.catchAll((error) => {
    if (error._tag === "RetryableError") {
      return retryOperation();
    } else {
      return Effect.fail(error); // Re-throw non-retryable errors
    }
  })
);
```

## Conditional Error Handling with catchTag

```typescript
const handleSpecificErrors = operation().pipe(
  Effect.catchTag("NetworkError", (error) => {
    yield* Effect.logWarning("Network error, retrying...");
    return retryWithBackoff();
  }),
  Effect.catchTag("ValidationError", (error) => {
    yield* Effect.logError("Validation failed", { error });
    return Effect.fail(new WorkflowError({ cause: error }));
  })
);
```

## Error Propagation in Workflows

```typescript
const workflow = Effect.gen(function* () {
  // These operations can fail and errors will propagate automatically
  const config = yield* loadConfig().pipe(
    Effect.mapError((e) => new ConfigLoadError({ cause: e }))
  );

  const data = yield* fetchData(config).pipe(
    Effect.mapError((e) => new DataFetchError({ cause: e }))
  );

  const processed = yield* processData(data).pipe(
    Effect.mapError((e) => new ProcessingError({ cause: e }))
  );

  return processed;
});
```

## Retry Patterns

```typescript
import { Schedule } from "effect";

const retriedOperation = riskyOperation().pipe(
  Effect.retry(
    Schedule.exponential("100 millis").pipe(
      Schedule.compose(Schedule.recurs(3)) // Retry up to 3 times
    )
  ),
  Effect.mapError((e) => new MaxRetriesExceededError({ cause: e }))
);
```

## Resource Cleanup with ensuring

```typescript
const safeResourceOperation = Effect.gen(function* () {
  const resource = yield* acquireResource();

  const result = yield* useResource(resource).pipe(
    Effect.mapError((e) => new ResourceUsageError({ cause: e }))
  );

  return result;
}).pipe(
  Effect.ensuring(
    releaseResource().pipe(
      Effect.catchAll((e) => {
        // Log cleanup errors but don't fail the main operation
        return Effect.logError("Failed to cleanup resource", e);
      })
    )
  )
);
```

## Validation with Effect.fail

```typescript
const validateInput = (input: unknown) => Effect.gen(function* () {
  if (typeof input !== "string") {
    return yield* Effect.fail(
      new ValidationError({
        message: "Input must be a string",
        received: typeof input
      })
    );
  }

  if (input.length === 0) {
    return yield* Effect.fail(
      new ValidationError({
        message: "Input cannot be empty"
      })
    );
  }

  return input;
});
```

## Error Aggregation in Parallel Operations

```typescript
const parallelWithErrorHandling = Effect.gen(function* () {
  // Use Effect.allSuccesses to collect both successes and failures
  const results = yield* Effect.allSuccesses([
    operation1().pipe(Effect.either),
    operation2().pipe(Effect.either),
    operation3().pipe(Effect.either),
  ]);

  const successes = results.filter(Either.isRight).map((r) => r.right);
  const failures = results.filter(Either.isLeft).map((r) => r.left);

  if (failures.length > 0) {
    yield* Effect.logWarning(`${failures.length} operations failed`);
  }

  return { successes, failures };
});
```

## Service-Level Error Handling

```typescript
export class RobustService extends Effect.Service<RobustService>()("RobustServic
e", {
  effect: Effect.gen(function* () {
    return {
      robustOperation: Effect.fn("robustOperation")(function* (input: string) {
        // Validate input
        if (!input) {
          return yield* Effect.fail(new InvalidInputError({ input }));
        }

        // Perform operation with error handling
        const result = yield* dangerousOperation(input).pipe(
          Effect.retry(Schedule.recurs(2)),
          Effect.mapError((e) => new OperationFailedError({ cause: e, input })),
          Effect.catchTag("OperationFailedError", (error) => {
            // Fallback operation
            yield* Effect.logWarning("Primary operation failed, using fallback")
;
            return fallbackOperation(input);
          })
        );

        return result;
      }),
    };
  }),
}) {}
```

## Testing Error Scenarios

```typescript
// Test that specific errors are thrown
test("should handle validation errors", async () => {
  const result = await Effect.runPromise(
    validateInput("").pipe(Effect.either)
  );

  expect(Either.isLeft(result)).toBe(true);
  if (Either.isLeft(result)) {
    expect(result.left._tag).toBe("ValidationError");
  }
});
```

## Best Practices

1. **Use Tagged Errors**: Always use `Data.TaggedError` for custom errors
2. **Transform at Boundaries**: Use `mapError` to transform external errors
3. **Handle Specifically**: Use `catchTag` for specific error handling
4. **Log Appropriately**: Log errors at appropriate levels (error, warning, debu
g)
5. **Cleanup Resources**: Use `ensuring` for resource cleanup
6. **Validate Early**: Validate inputs early and fail fast
7. **Provide Context**: Include relevant context in error objects
8. **Test Error Paths**: Test both success and failure scenarios

# Effect Functions and Generators

## Effect.fn Pattern

Use `Effect.fn` to create named Effect functions that provide better tracing and
 debugging capabilities.

### Basic Effect.fn Usage

```typescript
import { Effect } from "effect";

export const processData = Effect.fn("processData")(function* (data: string) {
  // Effect implementation
  const processed = yield* transformData(data);
  return processed;
});
```

### Effect.fn in Services

```typescript
export class DataService extends Effect.Service<DataService>()("DataService", {
  effect: Effect.gen(function* () {
    return {
      processFile: Effect.fn("processFile")(function* (path: string) {
        const content = yield* fs.readFileString(path);
        const processed = yield* processContent(content);
        return processed;
      }),

      saveResult: Effect.fn("saveResult")(function* (data: any, output: string)
{
        yield* fs.writeFileString(output, JSON.stringify(data));
      }),
    };
  }),
}) {}
```

## Effect.gen Pattern

Use `Effect.gen` for writing effectful code in a generator style that allows for
 clean, sequential-looking asynchronous code.

### Basic Effect.gen

```typescript
const workflow = Effect.gen(function* () {
  const config = yield* Config.string("SOME_CONFIG");
  const service = yield* SomeService;

  const result = yield* service.doOperation(config);
  yield* Effect.logInfo("Operation completed", { result });

  return result;
});
```

### Error Handling in Effect.gen

```typescript
const safeWorkflow = Effect.gen(function* () {
  const result = yield* riskyOperation().pipe(
    Effect.mapError((e) => new MyCustomError({ cause: e }))
  );

  if (!result) {
    return yield* Effect.fail(new NoResultError());
  }

  return result;
});
```

### Parallel Operations

```typescript
const parallelWorkflow = Effect.gen(function* () {
  // Run operations in parallel
  const [result1, result2, result3] = yield* Effect.all([
    operation1(),
    operation2(),
    operation3(),
  ]);

  return combineResults(result1, result2, result3);
});
```

### Controlled Concurrency

```typescript
const batchWorkflow = Effect.gen(function* () {
  const items = yield* getItems();

  const results = yield* Effect.all(
    items.map((item) => processItem(item)),
    { concurrency: 5 } // Limit to 5 concurrent operations
  );

  return results;
});
```

## Configuration Access

```typescript
const configWorkflow = Effect.gen(function* () {
  // String configuration
  const apiUrl = yield* Config.string("API_URL");

  // Number with default
  const timeout = yield* Config.number("TIMEOUT").pipe(
    Config.withDefault(5000)
  );

  // Redacted (sensitive) configuration
  const apiKey = yield* Config.redacted(Config.string("API_KEY"));

  return { apiUrl, timeout, apiKey };
});
```

## Logging in Effects

```typescript
const loggingWorkflow = Effect.gen(function* () {
  yield* Effect.logInfo("Starting workflow");

  const result = yield* someOperation();

  yield* Effect.logDebug("Operation result", { result });

  if (result.success) {
    yield* Effect.logInfo("Workflow completed successfully");
  } else {
    yield* Effect.logWarning("Workflow completed with warnings");
  }

  return result;
});
```

## Conditional Logic

```typescript
const conditionalWorkflow = Effect.gen(function* () {
  const condition = yield* checkCondition();

  if (condition) {
    return yield* happyPath();
  } else {
    return yield* alternativePath();
  }
});
```

## Resource Management

```typescript
const resourceWorkflow = Effect.gen(function* () {
  const resource = yield* acquireResource();

  try {
    const result = yield* useResource(resource);
    return result;
  } finally {
    yield* releaseResource(resource);
  }
}).pipe(
  Effect.ensuring(cleanupEffect()) // Always runs cleanup
);
```

## Naming Conventions

- Use descriptive names for Effect.fn functions
- Name should indicate what the function does
- Use camelCase for function names
- Include context in the name when helpful (e.g., "readFileAndParse" vs just "re
ad")

# Effect Layer Pattern

## When to use Layers

Use `Layer` to compose and manage dependencies in your Effect application. Layer
s provide a way to wire up services and their dependencies in a type-safe manner
.

## Basic Layer Composition

```typescript
import { Layer } from "effect";
import { NodeFileSystem } from "@effect/platform-node";

export const AppLayerLive = Layer.mergeAll(
  // Custom services
  MyService.Default,
  AnotherService.Default,
  ThirdService.Default,

  // Platform layers
  NodeFileSystem.layer,

  // External service layers
  DatabaseLayer,
);
```

## Layer Dependencies

Services automatically contribute their dependencies to the layer:

```typescript
// This service requires FileSystem and Config
export class FileService extends Effect.Service<FileService>()("FileService", {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const basePath = yield* Config.string("BASE_PATH");

    return {
      readFile: Effect.fn("readFile")(function* (filename: string) {
        return yield* fs.readFileString(path.join(basePath, filename));
      }),
    };
  }),
  dependencies: [NodeFileSystem.layer], // Explicit platform dependency
}) {}

// When using FileService in a layer, its dependencies are included
export const AppLayer = Layer.mergeAll(
  FileService.Default, // Includes NodeFileSystem.layer automatically
  OtherService.Default,
);
```

## Service Default Layers

Most services provide a `Default` layer that includes the service and its depend
encies:

```typescript
// Preferred - uses Default layer
export const AppLayer = Layer.mergeAll(
  MyService.Default,
  AnotherService.Default,
);

// Avoid - manual layer creation unless needed
export const ManualLayer = Layer.mergeAll(
  Layer.effect(MyService, myServiceImplementation),
  Layer.effect(AnotherService, anotherServiceImplementation),
);
```

## Platform Layers

Common platform layers to include:

```typescript
import { NodeFileSystem } from "@effect/platform-node";
import { NodeHttpServer } from "@effect/platform-node";

export const AppLayer = Layer.mergeAll(
  // Your services
  MyService.Default,

  // Platform layers
  NodeFileSystem.layer,    // For file system operations
  NodeHttpServer.layer,    // For HTTP server
);
```

## Test Layers

Create separate layers for testing with mocked services:

```typescript
export const TestLayer = Layer.mergeAll(
  // Mock implementations
  Layer.succeed(FileService, {
    readFile: Effect.succeed("mocked file content"),
    writeFile: Effect.succeed(undefined),
  }),

  Layer.succeed(DatabaseService, {
    query: Effect.succeed([]),
    save: Effect.succeed({ id: "test" }),
  }),
);
```

## Environment-Specific Layers

```typescript
// Production layer
export const ProdLayer = Layer.mergeAll(
  ProductionDatabaseLayer,
  RealApiService.Default,
  LoggingService.Default,
);

// Development layer
export const DevLayer = Layer.mergeAll(
  LocalDatabaseLayer,
  MockApiService.Default,
  VerboseLoggingService.Default,
);

// Choose layer based on environment
export const AppLayer = process.env.NODE_ENV === "production"
  ? ProdLayer
  : DevLayer;
```

## Running Effects with Layers

```typescript
// Provide layer to effect before running
const program = Effect.gen(function* () {
  const service = yield* MyService;
  return yield* service.doSomething();
});

// Run with layer
Effect.runPromise(program.pipe(Effect.provide(AppLayerLive)));
```

## Layer Scoping

```typescript
// Scoped layer - resources are cleaned up automatically
export const ScopedResourceLayer = Layer.scoped(
  MyResource,
  Effect.gen(function* () {
    const resource = yield* acquireResource();
    yield* Effect.addFinalizer(() => releaseResource(resource));
    return resource;
  })
);
```

## Layer Composition Patterns

### Sequential Dependencies
```typescript
// ServiceB depends on ServiceA
export const LayerWithDependencies = Layer.mergeAll(
  ServiceA.Default,
  ServiceB.Default, // ServiceB.dependencies includes ServiceA
);
```

### Conditional Layers
```typescript
const conditionalLayer = Config.string("FEATURE_FLAG").pipe(
  Effect.map((flag) =>
    flag === "enabled"
      ? FeatureEnabledLayer
      : FeatureDisabledLayer
  ),
  Layer.unwrapEffect
);
```

## Best Practices

1. **Use Default Layers**: Prefer `Service.Default` over manual layer creation
2. **Group Related Services**: Create logical groupings of related services
3. **Platform Layers Last**: Include platform layers (NodeFileSystem, etc.) at t
he end
4. **Test Layers**: Create separate test layers with mocked implementations
5. **Environment Awareness**: Use different layers for different environments
6. **Dependency Management**: Let services declare their own dependencies

# Effect Service Pattern

## When to use Effect.Service

Use `Effect.Service` to create reusable, injectable services that encapsulate re
lated functionality. Services provide dependency injection and make code more te
stable and modular.

## Basic Service Pattern

```typescript
import { Effect } from "effect";

export class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.gen(function* () {
    // Service initialization
    const dependency = yield* SomeDependency;

    return {
      // Service methods
      doSomething: Effect.fn("doSomething")(function* (param: string) {
        // Implementation
        return result;
      }),

      anotherMethod: Effect.fn("anotherMethod")(function* () {
        // Implementation
      }),
    };
  }),
  dependencies: [SomeDependency.Default], // Optional dependencies
}) {}
```

## Service with Configuration

```typescript
export class ConfigurableService extends Effect.Service<ConfigurableService>()("
ConfigurableService", {
  effect: Effect.gen(function* () {
    const apiKey = yield* Config.redacted(Config.string("API_KEY"));
    const baseUrl = yield* Config.string("BASE_URL");

    return {
      makeRequest: Effect.fn("makeRequest")(function* (endpoint: string) {
        // Use configuration
        const url = `${baseUrl}/${endpoint}`;
        // Implementation
      }),
    };
  }),
}) {}
```

## Service Methods with Effect.fn

Always use `Effect.fn` for service methods to provide proper tracing and debuggi
ng:

```typescript
return {
  methodName: Effect.fn("methodName")(function* (params) {
    // Implementation
  }),
};
```

## Service Naming Convention

- Use PascalCase for service class names
- End service names with "Service"
- Use descriptive names that indicate the service's responsibility
- Service identifier (first parameter) should match the class name

## Service Usage in Layers

```typescript
// In app-layer.ts
export const AppLayerLive = Layer.mergeAll(
  MyService.Default,
  ConfigurableService.Default,
  DependentService.Default,
  // Platform layers
  NodeFileSystem.layer,
);
```

## Service Usage in Effects

```typescript
const someWorkflow = Effect.gen(function* () {
  const myService = yield* MyService;
  const result = yield* myService.doSomething("parameter");
  return result;
});
```

## Testing Services

Services can be easily mocked for testing by providing alternative implementatio
ns:

```typescript
import { vi } from 'vitest'

const TestService = new MyService({
  doSomething: vi.fn().mockReturnValue('foo')
})
```

# Effect TaggedError Pattern

## When to use Data.TaggedError

Use `Data.TaggedError` to create typed error classes that can be used in Effect
workflows. This provides better error handling with type safety and structured e
rror information.

## Pattern Structure

```typescript
import { Data } from "effect";

export class SomeOperationError extends Data.TaggedError("SomeOperationError")<{
  cause: Error;
  additionalInfo?: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  message: string;
  field?: string;
}> {}
```

## Usage Examples

### Basic Error Creation
```typescript
// In your Effect function
return yield* Effect.fail(new SomeOperationError({
  cause: error,
  additionalInfo: "Additional context"
}));
```

### Error with Configuration
```typescript
export class NoFilesFoundError extends Data.TaggedError("NoFilesFoundError")<{
  dir: string;
}> {}

// Usage
if (!files[0]) {
  return yield* new NoFilesFoundError({
    dir: directoryPath,
  });
}
```

### Error Handling in Effects
```typescript
yield* Effect.tryPromise(() => someAsyncOperation())
  .pipe(
    Effect.mapError((e) => new SomeOperationError({ cause: e }))
  );
```

## Naming Convention

- Use descriptive names that clearly indicate what went wrong
- End error class names with "Error"
- Use PascalCase for class names
- Use camelCase for error properties

## Error Properties

- Always include a `cause: Error` property when wrapping existing errors
- Include relevant context information as additional properties
- Use optional properties (`?`) for non-essential context
- Keep property names descriptive and concise

## Integration with Effect.mapError

```typescript
yield* fs.readFile(path)
  .pipe(
    Effect.mapError((e) => new CouldNotReadFileError({
      cause: e,
      filePath: path
    }))
  );
```

# Effect Workflow Patterns

## What are Workflows

Workflows orchestrate multiple services and operations to achieve complex busine
ss logic. They typically use `Effect.gen` and coordinate between different servi
ces.

## Basic Workflow Structure

```typescript
const myWorkflow = Effect.gen(function* () {
  // 1. Get required services
  const serviceA = yield* ServiceA;
  const serviceB = yield* ServiceB;
  const config = yield* Config.string("WORKFLOW_CONFIG");

  // 2. Perform operations in sequence
  const step1Result = yield* serviceA.doFirstStep(config);

  const step2Result = yield* serviceB.doSecondStep(step1Result).pipe(
    Effect.mapError((e) => new Step2Error({ cause: e, input: step1Result }))
  );

  // 3. Final processing
  const finalResult = yield* processFinalResult(step2Result);

  yield* Effect.logInfo("Workflow completed successfully", { finalResult });

  return finalResult;
});
```

## File Processing Workflow

```typescript
const processFileWorkflow = (inputPath: AbsolutePath) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const processor = yield* FileProcessorService;

    // Validate input exists
    const exists = yield* fs.exists(inputPath);
    if (!exists) {
      return yield* Effect.fail(new FileNotFoundError({ path: inputPath }));
    }

    // Read and process file
    const content = yield* fs.readFileString(inputPath).pipe(
      Effect.mapError((e) => new FileReadError({ cause: e, path: inputPath }))
    );

    const processed = yield* processor.processContent(content);

    // Save result
    const outputPath = generateOutputPath(inputPath);
    yield* fs.writeFileString(outputPath, processed);

    yield* Effect.logInfo("File processed successfully", {
      input: inputPath,
      output: outputPath
    });

    return outputPath;
  });
```

## Parallel Processing Workflow

```typescript
const parallelProcessingWorkflow = (items: string[]) =>
  Effect.gen(function* () {
    const processor = yield* ProcessorService;

    // Process items in parallel with limited concurrency
    const results = yield* Effect.all(
      items.map((item) =>
        processor.processItem(item).pipe(
          Effect.mapError((e) => new ItemProcessingError({ cause: e, item }))
        )
      ),
      { concurrency: 5 } // Limit concurrent operations
    );

    // Collect successful results
    const successfulResults = results.filter(Boolean);

    yield* Effect.logInfo("Parallel processing completed", {
      total: items.length,
      successful: successfulResults.length,
    });

    return successfulResults;
  });
```

## Conditional Workflow

```typescript
const conditionalWorkflow = (inputType: "video" | "audio") =>
  Effect.gen(function* () {
    const videoService = yield* VideoService;
    const audioService = yield* AudioService;

    switch (inputType) {
      case "video":
        const videoResult = yield* videoService.processVideo();
        return { type: "video", result: videoResult };

      case "audio":
        const audioResult = yield* audioService.processAudio();
        return { type: "audio", result: audioResult };

      default:
        return yield* Effect.fail(
          new UnsupportedInputTypeError({ inputType })
        );
    }
  });
```

## Resource Management Workflow

```typescript
const resourceWorkflow = Effect.gen(function* () {
  // Acquire resources
  const resource1 = yield* acquireResource1();
  const resource2 = yield* acquireResource2();

  try {
    // Use resources
    const result = yield* processWithResources(resource1, resource2);
    return result;
  } catch (error) {
    yield* Effect.logError("Workflow failed", { error });
    throw error;
  }
}).pipe(
  // Ensure cleanup happens regardless of success/failure
  Effect.ensuring(
    Effect.all([
      releaseResource1().pipe(Effect.orElse(() => Effect.unit)),
      releaseResource2().pipe(Effect.orElse(() => Effect.unit)),
    ])
  )
);
```

## Error Recovery Workflow

```typescript
const robustWorkflow = (input: string) =>
  Effect.gen(function* () {
    const primaryService = yield* PrimaryService;
    const fallbackService = yield* FallbackService;

    // Try primary approach
    const primaryResult = yield* primaryService.process(input).pipe(
      Effect.either
    );

    if (Either.isRight(primaryResult)) {
      yield* Effect.logInfo("Primary processing succeeded");
      return primaryResult.right;
    }

    // Fallback on error
    yield* Effect.logWarning("Primary processing failed, trying fallback", {
      error: primaryResult.left
    });

    const fallbackResult = yield* fallbackService.process(input).pipe(
      Effect.mapError((e) => new FallbackFailedError({
        cause: e,
        originalError: primaryResult.left
      }))
    );

    return fallbackResult;
  });
```

## Batch Processing Workflow

```typescript
const batchWorkflow = (items: string[], batchSize = 10) =>
  Effect.gen(function* () {
    const processor = yield* BatchProcessorService;

    // Split into batches
    const batches = chunkArray(items, batchSize);

    yield* Effect.logInfo("Starting batch processing", {
      totalItems: items.length,
      batchCount: batches.length,
      batchSize,
    });

    const results: string[] = [];

    // Process batches sequentially to avoid overwhelming resources
    for (const [index, batch] of batches.entries()) {
      yield* Effect.logDebug(`Processing batch ${index + 1}/${batches.length}`);

      const batchResults = yield* Effect.all(
        batch.map((item) => processor.processItem(item)),
        { concurrency: batchSize }
      );

      results.push(...batchResults);

      // Optional: delay between batches
      if (index < batches.length - 1) {
        yield* Effect.sleep("1 second");
      }
    }

    yield* Effect.logInfo("Batch processing completed", {
      processedItems: results.length,
    });

    return results;
  });
```

## Configuration-Driven Workflow

```typescript
const configurableWorkflow = Effect.gen(function* () {
  // Load configuration
  const config = {
    inputDir: yield* Config.string("INPUT_DIRECTORY"),
    outputDir: yield* Config.string("OUTPUT_DIRECTORY"),
    enableParallel: yield* Config.boolean("ENABLE_PARALLEL_PROCESSING").pipe(
      Config.withDefault(true)
    ),
    maxConcurrency: yield* Config.number("MAX_CONCURRENCY").pipe(
      Config.withDefault(5)
    ),
  };

  const fs = yield* FileSystem.FileSystem;
  const processor = yield* ProcessorService;

  // Get input files
  const files = yield* fs.readDirectory(config.inputDir);

  // Process based on configuration
  if (config.enableParallel) {
    yield* Effect.logInfo("Using parallel processing");
    const results = yield* Effect.all(
      files.map((file) => processor.processFile(file)),
      { concurrency: config.maxConcurrency }
    );
    return results;
  } else {
    yield* Effect.logInfo("Using sequential processing");
    const results: string[] = [];
    for (const file of files) {
      const result = yield* processor.processFile(file);
      results.push(result);
    }
    return results;
  }
});
```

## Testing Workflows

```typescript
// Test with mocked services
test("workflow should process files correctly", async () => {
  const mockProcessor = Layer.succeed(ProcessorService, {
    processFile: Effect.succeed("processed-content"),
  });

  const mockFs = Layer.succeed(FileSystem.FileSystem, {
    readDirectory: Effect.succeed(["file1.txt", "file2.txt"]),
    exists: Effect.succeed(true),
  });

  const result = await Effect.runPromise(
    myWorkflow().pipe(
      Effect.provide(Layer.mergeAll(mockProcessor, mockFs))
    )
  );

  expect(result).toEqual(["processed-content", "processed-content"]);
});
```

## Workflow Service Pattern

```typescript
export class WorkflowsService extends Effect.Service<WorkflowsService>()(
  "WorkflowsService",
  {
    effect: Effect.gen(function* () {
      // Dependencies
      const serviceA = yield* ServiceA;
      const serviceB = yield* ServiceB;

      return {
        // Expose workflows as service methods
        processFile: Effect.fn("processFile")(processFileWorkflow),

        batchProcess: Effect.fn("batchProcess")(function* (items: string[]) {
          return yield* batchWorkflow(items);
        }),

        robustProcess: Effect.fn("robustProcess")(robustWorkflow),
      };
    }),
    dependencies: [ServiceA.Default, ServiceB.Default],
  }
) {}
```

## Best Practices

1. **Single Responsibility**: Each workflow should have one clear purpose
2. **Error Boundaries**: Transform errors at appropriate boundaries
3. **Logging**: Log important steps and completion status
4. **Resource Cleanup**: Use `Effect.ensuring` for cleanup
5. **Configuration**: Make workflows configurable when appropriate
6. **Testing**: Create test layers for workflow dependencies
7. **Documentation**: Document workflow inputs, outputs, and side effects
8. **Idempotency**: Design workflows to be idempotent when possible
