# Contributing

Thanks for your interest in contributing to `markdown-for-agents`. This document covers the development workflow, coding standards, and how to submit changes.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9
- [Bun](https://bun.sh/) >= 1.0 (for integration tests)
- [Deno](https://deno.com/) >= 1.40 (for integration tests)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/kkonstantinov/agent-markdown.git
cd agent-markdown

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

This is a monorepo managed with [pnpm workspaces](https://pnpm.io/workspaces):

```
packages/
  core/                     # markdown-for-agents
    src/
      core/                 # Parser, walker, renderer, converter, dedup
      rules/                # Block, inline, list, table rules
      extract/              # Content extraction (DOM pruning)
      tokens/               # Token estimation
    test/
      unit/                 # Vitest unit tests
      integration/          # Runtime-specific integration tests (Node, Bun, Deno)
      fixtures/             # HTML test fixtures
  audit/                    # @markdown-for-agents/audit
    src/
      index.ts              # audit() function
      cli.ts                # CLI entry point
  middleware/
    express/                # @markdown-for-agents/express
    fastify/                # @markdown-for-agents/fastify
    hono/                   # @markdown-for-agents/hono
    nextjs/                 # @markdown-for-agents/nextjs (+ nextImageRule)
    web/                    # @markdown-for-agents/web
docs/                       # Documentation
```

See [Architecture](docs/architecture.md) for how the pipeline works internally.

## Scripts

All scripts can be run from the root of the monorepo:

| Command                 | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `pnpm build`            | Build all packages (tsdown)                    |
| `pnpm test`             | Run all unit tests (vitest)                    |
| `pnpm test:watch`       | Run tests in watch mode                        |
| `pnpm test:integration` | Build + run integration tests for all packages |
| `pnpm lint`             | Run ESLint (includes Prettier checks)          |
| `pnpm lint:fix`         | Run ESLint with auto-fix (includes formatting) |
| `pnpm format`           | Format all files with Prettier                 |
| `pnpm format:check`     | Check formatting without writing               |
| `pnpm typecheck`        | Run TypeScript type checking for all packages  |

You can also run scripts for a specific package:

```bash
pnpm --filter markdown-for-agents test
pnpm --filter @markdown-for-agents/express test
```

### Core-specific Scripts

| Command                                                   | Description                   |
| --------------------------------------------------------- | ----------------------------- |
| `pnpm --filter markdown-for-agents test:integration:node` | Run Node.js integration tests |
| `pnpm --filter markdown-for-agents test:integration:bun`  | Run Bun integration tests     |
| `pnpm --filter markdown-for-agents test:integration:deno` | Run Deno integration tests    |

## Testing

### Unit Tests

Unit tests use [Vitest](https://vitest.dev/) and live in each package's `test/` directory. Run them with:

```bash
pnpm test
```

Core tests are organized to mirror the source structure:

```
packages/core/test/unit/
  converter.test.ts           # End-to-end conversion tests
  tokens.test.ts              # Token estimation
  extract.test.ts             # Content extraction
  core/
    renderer.test.ts          # Post-processing
    walker.test.ts            # DOM traversal and rule application
  rules/
    block.test.ts             # Block-level element tests
    inline.test.ts            # Inline element tests
    list.test.ts              # List element tests
    table.test.ts             # Table element tests
  integration/
    fixtures.test.ts          # Fixture-based integration tests
```

Each middleware package has its own unit and integration tests:

```
packages/middleware/express/test/
  unit/express.test.ts        # Unit tests with mocks
  integration/express.test.ts # Real server integration tests
```

### Integration Tests

Integration tests verify the library works across runtimes (core) and with real servers (middleware). They test the built `dist/` output:

```bash
# Run all integration tests (builds first)
pnpm test:integration

# Run core integration tests individually
pnpm --filter markdown-for-agents test:integration:node
pnpm --filter markdown-for-agents test:integration:bun
pnpm --filter markdown-for-agents test:integration:deno
```

### Writing Tests

- Test behavior through the public `convert()` API when possible
- Use `toContain` for output assertions (avoids brittleness from whitespace changes)
- Use `toBe` for exact output when testing specific formatting
- Add fixture files to `packages/core/test/fixtures/` for complex HTML structures
- When adding a new rule, add tests for: basic conversion, edge cases (empty content, nested elements), and options that affect the rule

### Test Fixtures

HTML test fixtures live in `packages/core/test/fixtures/`:

- `simple.html` / `simple.md` — basic conversion snapshot
- `table.html` — GFM table conversion
- `nested-lists.html` — nested list indentation
- `code-blocks.html` — fenced code blocks with language
- `full-page.html` — full page with nav, header, footer, sidebar for extraction testing

## Linting

The project uses [ESLint](https://eslint.org/) v10 with:

- [`typescript-eslint`](https://typescript-eslint.io/) — strict type-checked rules
- [`eslint-plugin-unicorn`](https://github.com/sindresorhus/eslint-plugin-unicorn) — recommended rules

```bash
pnpm lint        # Check for errors
pnpm lint:fix    # Auto-fix what's possible
```

### Key Lint Rules

- Use `Number.parseInt()` instead of `parseInt()`
- Use `.replaceAll()` instead of `.replace()` with global regex
- Use `isTag()` type guards instead of `as any` casts
- Use `path.resolve()` with the default import (`import path from "node:path"`)

## Code Style

- **ESM only** — all imports use `.js` extension (TypeScript convention for ESM)
- **No `as any`** — use proper type guards (`isTag()`, `isText()` from domhandler)
- **Null means remove** — rule replacements return `null` to strip an element
- **Undefined means fall-through** — rule replacements return `undefined` to try the next rule
- **Keep it simple** — prefer straightforward code over abstractions. Three similar lines are better than a premature helper function.

## Making Changes

### Adding a New Rule

1. Add the rule to the appropriate file in `packages/core/src/rules/` (block, inline, list, or table)
2. Add tests in the corresponding test file
3. Update the "Supported Elements" table in `README.md` if adding a new element
4. Run `pnpm test && pnpm lint` to verify

### Adding a New Middleware

1. Create a new package directory under `packages/middleware/`
2. Add `package.json`, `tsdown.config.ts`, `tsconfig.json`, `vitest.config.ts`
3. Implement the middleware in `src/index.ts`, importing from `markdown-for-agents`
4. Add unit tests in `test/unit/` and integration tests in `test/integration/`
5. Document it in `docs/middleware.md`

### Changing the Pipeline

If modifying the core pipeline (parser, walker, renderer):

1. Read the [Architecture](docs/architecture.md) doc first
2. Ensure all existing tests still pass
3. Consider edge cases: empty input, whitespace-only content, deeply nested structures, tables inside lists, pre-formatted content

## Submitting Changes

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run the full validation suite:
    ```bash
    pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration
    ```
5. Open a pull request with a clear description of the change

### Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include tests for new functionality
- Update documentation if the public API changes
- Ensure all CI checks pass

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
