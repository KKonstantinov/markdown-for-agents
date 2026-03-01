# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**markdown-for-agents** is a runtime-agnostic HTML-to-Markdown converter built for AI agents. Single runtime dependency: `htmlparser2`. Monorepo with pnpm workspaces.

## Common Commands

```bash
pnpm build                # Build all packages (tsdown)
pnpm test                 # Run all unit tests (vitest)
pnpm test:watch           # Watch mode
pnpm test:integration     # Build + run integration tests (Node/Bun/Deno)
pnpm lint                 # ESLint (includes Prettier checks)
pnpm lint:fix             # ESLint with auto-fix
pnpm format               # Prettier --write
pnpm typecheck            # TypeScript type checking
```

Run for a specific package:

```bash
pnpm --filter markdown-for-agents test
pnpm --filter @markdown-for-agents/express test
```

Run a single test file:

```bash
pnpm vitest run packages/core/test/unit/rules/block.test.ts
```

## Architecture

The core library processes HTML through a 6-stage pipeline (see `docs/architecture.md`):

1. **Parser** (`core/parser.ts`) — `htmlparser2.parseDocument()` produces a DOM tree
2. **Extractor** (`extract/`) — Optional pruning of non-content elements (nav, footer, ads)
3. **Walker** (`core/walker.ts`) — Depth-first traversal, applies matching rules to each element
4. **Renderer** (`core/renderer.ts`) — Normalizes whitespace, collapses blank lines
5. **Deduplicator** (`core/dedup.ts`) — Optional removal of duplicate content blocks
6. **Token Estimator** (`tokens/`) — Counts tokens, characters, words

### Rule System

Rules live in `packages/core/src/rules/` (block, inline, list, table). Each rule has:

- `filter`: tag name, tag name array, or predicate function
- `replacement(context: RuleContext)`: returns `string` (markdown output), `null` (strip element), or `undefined` (skip, try next rule)
- `priority`: higher runs first; built-in rules use 0

### Package Structure

- `packages/core/` — Main library (`markdown-for-agents`). Three export subpaths: `.`, `./extract`, `./tokens`
- `packages/audit/` — CLI tool for token savings analysis
- `packages/middleware/{express,fastify,hono,nextjs,web}/` — Framework middleware adapters. All check `Accept: text/markdown` header and follow the same pattern

## Code Conventions

- **ESM only** — all imports use `.js` extension (TypeScript ESM convention)
- **No `as any`** — use type guards (`isTag()`, `isText()` from `domhandler`)
- **Null means remove** — rule `replacement` returns `null` to strip an element
- **Undefined means fall-through** — returns `undefined` to try the next rule
- Prettier: 140 char width, 4-space indent, single quotes, no trailing commas, `arrowParens: "avoid"`

## Testing Conventions

- Test through the public `convert()` API when possible
- Use `toContain` for flexible output assertions (avoids whitespace brittleness)
- Use `toBe` only for exact formatting tests
- HTML fixtures live in `packages/core/test/fixtures/`
- Integration tests verify the built `dist/` output across Node, Bun, and Deno
- Middleware tests use real server instances

## After Making Changes

Always run lint, typecheck, and tests before considering a change complete:

```bash
pnpm lint:fix && pnpm typecheck && pnpm test
```
