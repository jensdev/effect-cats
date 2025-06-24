# Effect-Cats: A Cat Management System

Effect-Cats is a monorepo project showcasing a simple Cat Management API and a Command Line Interface (CLI) to interact with it. The system is built using Effect-TS and runs on the Deno runtime.

## Features

*   **Type-Safe API & Client:** Leverages Effect-TS Schema and HttpApiClient for robust, type-safe interactions.
*   **Clear Separation of Concerns:** Organized into `domain`, `server`, and `cli` packages.
*   **Functional Approach:** Built with Effect-TS, emphasizing functional programming principles.
*   **Deno Native:** Utilizes the Deno runtime and its tooling.
*   **Automatic API Documentation:** Swagger UI is automatically generated for the server.

## Project Structure

The project is a monorepo organized into the following packages:

*   `packages/domain`: Contains the core business logic, data models (schemas for `Cat`, API error types), and the API contract definition for cat management (`CatsApi`). This package is environment-agnostic.
*   `packages/server`: Implements the API defined in the `domain` package. It exposes an HTTP server using `@effect/platform-node` and provides live implementations for the API endpoints.
*   `packages/cli`: A command-line interface that consumes the API, allowing users to interact with the cat management system from their terminal.

## Key Technologies

*   **Effect-TS:**
    *   `effect`: For core functional programming constructs, managing effects, and dependency injection.
    *   `@effect/platform`: For defining and implementing HTTP APIs and clients.
    *   `@effect/platform-node`: For Node.js specific functionalities, like the HTTP server.
    *   `Schema`: For data modeling and validation.
*   **Deno:** The primary JavaScript/TypeScript runtime.
*   **TypeScript:** The programming language used.

## Prerequisites

*   **Deno:** Ensure you have Deno installed. You can find installation instructions at [https://deno.land/manual/getting_started/installation](https://deno.land/manual/getting_started/installation).

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```
    (Replace `<repository-url>` and `<repository-name>` with the actual URL and project directory name)

2.  **No explicit installation step is required.** Deno will download and cache dependencies on the first run of a task or script.

## Running the Application

### Server

The server provides the API endpoints for managing cats.

1.  **Start the server (development mode):**
    *   From the project root:
        ```bash
        deno task dev
        ```
    *   Alternatively, to run directly from the server package:
        ```bash
        deno task --cwd=packages/server dev
        ```
    *   For more direct control (from project root):
        ```bash
        deno run -A --watch packages/server/src/main.ts
        ```
    The `-A` flag grants all necessary permissions (network, environment variables). The `--watch` flag enables auto-reload on file changes.

2.  **Default Server URL:** `http://localhost:3000`
    *   You can configure the port by setting the `PORT` environment variable (e.g., `PORT=4000 deno task dev`).

3.  **API Documentation (Swagger UI):**
    Once the server is running, you can access the Swagger UI for API exploration and testing at:
    `http://localhost:3000/docs`

### CLI

The CLI allows you to interact with the server's API. Ensure the server is running before using the CLI.

1.  **Run the CLI:**
    The primary task for running the CLI (with watch mode for development) is:
    *   From the project root:
        ```bash
        deno task --cwd=packages/cli dev
        ```
    *   To run the CLI directly (e.g., for a single command execution, from project root):
        ```bash
        deno run -A packages/cli/src/index.ts
        ```
    This command will fetch and display all cats by default.

2.  **Configuration:**
    *   The CLI connects to the server using a base URL. This can be configured via the `BASE_URL` environment variable. It defaults to `http://localhost:3000`.
    *   Example (running CLI against a different server URL):
        ```bash
        BASE_URL=http://custom.api.host:8080 deno run -A packages/cli/src/index.ts
        ```

## Development

The project uses Deno's built-in task runner. Tasks are defined in `deno.json` files within the root and each package.

### Common Tasks (run from project root)

*   **Start Server (dev mode):**
    ```bash
    deno task dev
    ```
*   **Run CLI (dev mode):**
    ```bash
    deno task --cwd=packages/cli dev
    ```
*   **Run Tests:**
    *   For the entire workspace (includes server tests):
        ```bash
        deno task test
        ```
    *   For the server package specifically (includes permissions and unstable flags):
        ```bash
        deno task --cwd=packages/server test
        ```
*   **Lint Files:**
    ```bash
    deno task lint
    ```
*   **Format Code:**
    ```bash
    deno task fmt
    ```

### Package-Specific Tasks

You can run tasks defined within specific packages using `deno task --cwd=packages/<package-name> <task-name>`.

## API Overview

The core API is defined in `packages/domain/src/CatsApi.ts` using `HttpApiGroup`. It provides typical CRUD operations for managing cats, such as:

*   Fetching all cats
*   Fetching a cat by its ID
*   Creating a new cat
*   Updating an existing cat
*   Deleting a cat

Refer to the Swagger UI at `http://localhost:3000/docs` for detailed endpoint information when the server is running.

## Contributing

Contributions are welcome! Please feel free to open an issue to discuss a new feature or bug, or submit a pull request with your changes.

## License

This project is intended for demonstration purposes. (You can add a specific license like MIT if desired).
