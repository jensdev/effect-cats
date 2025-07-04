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
