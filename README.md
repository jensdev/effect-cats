# effect-cats

A project demonstrating a CRUD API for managing cat information, built with
TypeScript and the Effect-TS library.

## Tech Stack

- TypeScript
- Effect-TS
- Deno (replacing Node.js, NPM Workspaces, and Turbo)
  - Utilizes Deno's built-in tools, including its task runner (`deno task`),
    formatter (`deno fmt`), and linter (`deno lint`).

## Project Structure

- `packages/domain`: Contains the core business logic, schemas (like `Cat`,
  `CatId`), and API definitions (`CatsApi`).
- `packages/server`: Implements the API defined in the `domain` package,
  including services, repositories, and the main server setup.
- `packages/cli`: A command-line interface for interacting with the Cats API.
- `deno.json`: The configuration file for Deno, specifying project settings,
  dependencies, and tasks.
- `deno.lock`: The lock file that ensures deterministic builds by pinning
  dependency versions.

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd effect-cats
   ```
2. **Set up Deno**:
   - Ensure Deno is installed on your system. Visit the
     [official Deno website](https://deno.land/) for installation instructions.
   - Deno manages dependencies through direct URL imports in source code. These
     are cached locally. You can pre-cache dependencies by running
     `deno cache packages/server/src/main.ts packages/cli/src/index.ts` (or
     other primary entry points). The `deno.json` file may specify an `imports`
     map for easier dependency management.
3. **Run the development server**:
   ```bash
   deno task dev
   ```
4. The server will be available at `http://localhost:3000`.

## CLI Configuration

The `baseUrl` for the Command Line Interface (CLI) can be configured using the
`BASE_URL` environment variable. This allows you to target different API
endpoints without modifying the code.

**Example:**

To run the CLI and point it to a custom API URL:

```bash
BASE_URL=http://my-custom-api-url.com deno run -A packages/cli/src/index.ts
```

If the `BASE_URL` environment variable is not set, the CLI will use a default
value of `http://localhost:3000`.

## Development

This project utilizes Deno's built-in tooling for linting and formatting.

### Linting

To check the codebase for linting issues, run the following command from the
project root:

```bash
deno task lint
```

Alternatively, you can run `deno lint` directly. This command will analyze your
code based on the rules configured in the root `deno.json` file.

### Formatting

To automatically format the codebase, run the following command from the project
root:

```bash
deno task fmt
```

Alternatively, you can run `deno fmt` directly. This will reformat your files
according to the formatting options specified in the root `deno.json` file.

## Deno Specifics

This project leverages several key features of the Deno runtime:

- **Module System**: Deno uses ES modules and imports modules directly via URLs
  (e.g., from `https://deno.land/std` or `npm:` specifiers) or local paths.
  - **Import Maps**: The `deno.json` file can contain an `imports` field, which
    serves as an import map. This allows for aliasing module URLs to shorter,
    more manageable names, similar to how `package.json` manages dependencies in
    Node.js projects.
  - **Local Caching**: Imported modules are downloaded and cached locally on
    your machine. Subsequent runs will use the cached version unless explicitly
    told otherwise (e.g., with the `--reload` flag). This ensures that once
    downloaded, dependencies are available offline and builds are faster. The
    `deno cache <entry-point.ts>` command can be used to pre-cache dependencies.
- **Security**: Deno executes code in a sandbox by default. This means scripts
  do not have access to the file system, network, or environment variables
  unless explicitly granted via command-line flags (e.g.,
  `deno run --allow-net --allow-read main.ts`). This provides a more secure
  environment for running code.
- **Built-in Tooling**: Deno comes with a comprehensive set of built-in tools,
  including:
  - A task runner (`deno task`) for executing scripts defined in `deno.json`.
  - A dependency inspector (`deno info`).
  - A code formatter (`deno fmt`).
  - A code linter (`deno lint`).
  - A test runner (`deno test`).

## Available Scripts

The following scripts are available and can be run using `deno task <task-name>`
for tasks defined in `deno.json`, or using built-in Deno commands:

- **Build**: Deno can create executables using
  `deno compile <your-main-script.ts>`. For more complex build processes (e.g.,
  building multiple packages), custom tasks can be defined in `deno.json`.
- `deno task dev`: Runs the main application (likely the server) in development
  mode with file watching, as defined in the root `deno.json`.
- `deno task lint`: Lints the codebase using Deno's built-in linter (as
  described in the "Development" section).
- `deno task fmt`: Formats the codebase using Deno's built-in formatter (as
  described in the "Development" section).
- `deno test -A`: Runs tests using Deno's built-in test runner. The `-A` flag
  grants all permissions; specific permissions can be used for more fine-grained
  control. (Note: Test tasks in individual packages might have more specific
  flags e.g. `packages/server/deno.json` has
  `deno test -A --unstable src/**/*.test.ts`).
- **Clean**: A `clean` task can be added to `deno.json` to remove build
  artifacts (e.g., `dist` folders, `deno.lock`, `nodeModulesDir` if applicable).

## API Endpoints

The following API endpoints are available:

- `GET /cats`: Get all cats.
- `GET /cats/:id`: Get a cat by its ID.
- `POST /cats`: Create a new cat.
  - Payload: `{ "name": "string", "breed": "string", "age": "number" }`
- `PATCH /cats/:id`: Update an existing cat.
  - Payload: `{ "name"?: "string", "breed"?: "string", "age"?: "number" }`
- `DELETE /cats/:id`: Delete a cat by its ID.
- Swagger UI: `http://localhost:3000/docs`
