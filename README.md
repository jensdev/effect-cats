# Cat Management API (Example Project Name)

A Deno-based API for managing cat information, built using Hexagonal Architecture principles.

## Table of Contents

1.  [About The Project](#1-about-the-project)
2.  [Getting Started](#2-getting-started)
    *   [2.1. Prerequisites](#21-prerequisites)
    *   [2.2. Installation & Setup](#22-installation--setup)
3.  [Running the Application](#3-running-the-application)
4.  [Running Tests](#4-running-tests)
5.  [Project Structure Overview](#5-project-structure-overview)
6.  [API Endpoints](#6-api-endpoints)
7.  [How to Contribute](#7-how-to-contribute)
8.  [License](#8-license)

## 1. About The Project

This project serves as a demonstration or starting point for building robust APIs using Deno, TypeScript, and Hexagonal Architecture (also known as Ports and Adapters). It provides basic CRUD operations for managing "cats".

Key Features:
*   Built with Deno
*   TypeScript for static typing
*   Hexagonal Architecture for a clean separation of concerns
*   In-memory data store (can be swapped for a persistent one)

## 2. Getting Started

### 2.1. Prerequisites

*   **Deno**: Ensure you have Deno installed. This project is configured via `deno.json`. If you use `mise`, the `.mise.toml` file will help manage the Deno version.
    *   [Deno Installation Guide](https://deno.land/manual/getting_started/installation)
*   **Git**: For cloning the repository.
*   **mise (Optional)**: If you use `mise` for managing runtime versions, it can pick up the Deno version from `.mise.toml`.
    *   [mise Installation Guide](https://mise.jdx.dev/getting-started.html)

### 2.2. Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <project-directory-name>
    ```

2.  **Set up Deno version (if using `mise`):**
    If you have `mise` installed, run:
    ```bash
    mise install
    ```
    This will install and configure the Deno version specified in `.mise.toml`.

3.  **Install dependencies:**
    Deno manages dependencies specified in `deno.json`. They will be downloaded and cached automatically when you run the application or tests. There's no explicit `npm install` or `deno install` step needed for project dependencies beyond ensuring Deno itself is installed.

4.  **Configuration:**
    *   Currently, the project uses an in-memory store, so no external database configuration is required.
    *   If environment variables were needed, you would typically create a `.env` file. (This project does not currently specify one).

## 3. Running the Application

To start the application in development mode with live reloading:
```bash
deno task dev
```
This command is defined in `deno.json` and typically runs `main.ts` with necessary permissions and watch mode.

The application should then be accessible at `http://localhost:8000` (or the port configured in `main.ts`).

For production, you might define a different task, e.g., `deno task start`. (Currently, only `dev` is provided for running the main application).

## 4. Running Tests

To run the test suite:
```bash
deno task test
```
This command is defined in `deno.json`. Ensure that test files (typically `*_test.ts` or `*.test.ts`) exist within the project structure.

## 5. Project Structure Overview

This project follows the Hexagonal Architecture pattern to ensure a separation of concerns between the core domain logic and infrastructure details.

*   `application/`: Contains application services (use cases) and port definitions.
    *   `ports/in/`: Input ports (interfaces defining how the application core is driven, e.g., `CatUseCase`).
    *   `ports/out/`: Output ports (interfaces defining how the application core interacts with external tools/services, e.g., `CatRepository`).
    *   `services/`: Concrete implementations of the input ports, orchestrating domain logic.
*   `domain/`: Core business logic, entities, value objects, and domain-specific errors. This layer is independent of application and infrastructure concerns.
    *   `entities/`: Business objects with identity (e.g., `Cat`).
    *   `value-objects/`: Immutable objects representing descriptive aspects of the domain.
    *   `errors/`: Custom domain-specific errors (e.g., `CatNotFoundError`).
*   `infrastructure/`: Adapters that implement ports and interact with external systems or handle delivery mechanisms.
    *   `primary/` (Driving Adapters): Adapters that drive the application (e.g., REST controllers, CLI handlers).
        *   `cats.contract.ts`, `health.contract.ts`: Define the API contracts (e.g., using Hono or a similar library type definitions for request/response shapes).
        *   `cats.ts`, `health.ts`: Implement the API endpoints.
    *   `secondary/` (Driven Adapters): Adapters that are driven by the application (e.g., database repositories, external service clients).
        *   `cats-in-memory.ts`: An in-memory implementation of the `CatRepository` output port.
*   `main.ts`: The main entry point of the application, responsible for dependency injection (wiring up adapters to ports) and starting the server.
*   `deno.json`: Deno configuration file (tasks, import maps, linter/formatter settings).
*   `deno.lock`: Lock file for ensuring reproducible builds by locking dependency versions.
*   `.mise.toml`: Configuration for `mise` to manage the Deno runtime version.
*   `AGENTS.md`: Special instructions for AI agents working on this codebase.

## 6. API Endpoints

The following are the primary API endpoints provided by this application.

### Health Check
*   **Endpoint:** `GET /health`
*   **Description:** Returns the health status of the application.
*   **Response (Success 200):**
    ```json
    {
      "status": "OK",
      "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ"
    }
    ```

### Cats API
(Based on `infrastructure/primary/cats.contract.ts` and common REST conventions. Actual request/response bodies should be detailed from the contract.)

*   **Endpoint:** `GET /cats`
    *   **Description:** Retrieves a list of all cats.
    *   **Response (Success 200):** `Array<Cat>` (See `domain/entities/cat.ts` for structure)

*   **Endpoint:** `GET /cats/:id`
    *   **Description:** Retrieves a specific cat by its ID.
    *   **Response (Success 200):** `Cat`
    *   **Response (Error 404):** If cat not found.

*   **Endpoint:** `POST /cats`
    *   **Description:** Creates a new cat.
    *   **Request Body:** `CatPayload` (Properties for creating a cat, e.g., name, breed, age. Refer to `domain/value-objects/cat.ts` or the contract for specifics.)
    *   **Response (Success 201):** `Cat` (The created cat)

*   **Endpoint:** `PUT /cats/:id`
    *   **Description:** Updates an existing cat by its ID.
    *   **Request Body:** `CatPayload` (Properties to update)
    *   **Response (Success 200):** `Cat` (The updated cat)
    *   **Response (Error 404):** If cat not found.

*   **Endpoint:** `DELETE /cats/:id`
    *   **Description:** Deletes a cat by its ID.
    *   **Response (Success 204):** No content.
    *   **Response (Error 404):** If cat not found.

*(Note: For detailed request/response schemas, refer to the type definitions in `infrastructure/primary/cats.contract.ts` and `domain/entities/cat.ts`.)*

## 7. How to Contribute

We welcome contributions! Please follow these guidelines:

*   **Coding Style**:
    *   Adhere to the Deno formatting standards. Run `deno task fmt` before committing.
    *   Follow linting rules. Run `deno task lint` to check.
*   **Branching Strategy**:
    *   Create feature branches from `main` (e.g., `feat/add-new-endpoint`, `fix/resolve-bug-xyz`).
*   **Commit Messages**:
    *   Follow conventional commit message standards (e.g., `feat: ...`, `fix: ...`, `docs: ...`).
*   **Pull Requests (PRs)**:
    *   Ensure all tests pass (`deno task test`).
    *   Provide a clear description of the changes in your PR.
    *   Link to any relevant issues.
*   **Reporting Bugs/Suggesting Features**:
    *   Use the GitHub Issues tab for this repository.

## 8. License

This project is currently unlicensed.

**Recommendation**: Consider adding a `LICENSE` file (e.g., MIT, Apache 2.0) to define how others can use, modify, and distribute this software. If you choose a license, update this section to reflect it, for example:

```
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```

---
This draft README provides a comprehensive starting point.
