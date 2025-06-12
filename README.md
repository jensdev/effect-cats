# effect-cats

A project demonstrating a CRUD API for managing cat information, built with TypeScript and the Effect-TS library.

## Tech Stack

*   TypeScript
*   Effect-TS
*   Node.js
*   NPM Workspaces
*   Turbo (for monorepo build orchestration)
*   Biome (for linting and formatting)

## Project Structure

*   `packages/domain`: Contains the core business logic, schemas (like `Cat`, `CatId`), and API definitions (`CatsApi`).
*   `packages/server`: Implements the API defined in the `domain` package, including services, repositories, and the main server setup.

## Available Scripts

The following scripts are available from the root `package.json`:

*   `npm run build`: Builds both `domain` and `server` packages.
*   `npm run dev`: Runs both `domain` and `server` in development mode.
*   `npm run lint`: Lints the codebase using Biome.
*   `npm run test`: Runs tests. (Note: `packages/domain/package.json` currently shows "Error: no test specified". This script might not execute tests for the domain package until tests are added.)
*   `npm run format`: Formats the codebase using Biome.
*   `npm run clean`: Removes build artifacts (`dist` folders, `node_modules`, `.turbo`).

## API Endpoints

The following API endpoints are available:

*   `GET /cats`: Get all cats.
*   `GET /cats/:id`: Get a cat by its ID.
*   `POST /cats`: Create a new cat.
    *   Payload: `{ "name": "string", "breed": "string", "age": "number" }`
*   `PATCH /cats/:id`: Update an existing cat.
    *   Payload: `{ "name"?: "string", "breed"?: "string", "age"?: "number" }`
*   `DELETE /cats/:id`: Delete a cat by its ID.

## Getting Started

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  The server will be available at `http://localhost:3000`.
