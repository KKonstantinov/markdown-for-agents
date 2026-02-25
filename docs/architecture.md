# Architecture

This document describes how `markdown-for-agents` works internally.

## Pipeline

Every conversion follows a six-stage pipeline:

```
HTML string
  |
  v
[1. Parser] ──────── htmlparser2.parseDocument()
  |
  v
DOM tree (domhandler Document)
  |
  v
[2. Extractor] ────── prune non-content elements (optional)
  |
  v
Pruned DOM tree
  |
  v
[3. Walker] ───────── depth-first traversal, apply rules
  |
  v
Raw Markdown string
  |
  v
[4. Renderer] ─────── normalize whitespace, collapse blank lines
  |
  v
Clean Markdown string
  |
  v
[5. Deduplicator] ─── remove duplicate content blocks (optional)
  |
  v
Final Markdown string
  |
  v
[6. Tokens] ───────── estimate token/word/character counts
  |
  v
ConvertResult { markdown, tokenEstimate }
```

## Stage Details

### 1. Parser (`packages/core/src/core/parser.ts`)

A thin wrapper around `htmlparser2`'s `parseDocument`. Parses the HTML string into a `domhandler` DOM tree with lowercase tags and attribute names.

The parser is tolerant of malformed HTML — it doesn't throw on unclosed tags, missing attributes, or other common issues in real-world HTML.

### 2. Extractor (`packages/core/src/extract/extractor.ts`)

When `extract` is enabled, the extractor walks the DOM tree and removes elements that match strip criteria (tags, ARIA roles, class patterns, ID patterns). This operates in-place on the DOM tree — removed elements are spliced out before the walker ever sees them.

The default strip selectors are defined in `packages/core/src/extract/selectors.ts`.

### 3. Walker (`packages/core/src/core/walker.ts`)

The walker performs a depth-first traversal of the DOM tree. For each node:

- **Text nodes** — whitespace is collapsed (`/\s+/g` to single space). Inside `<pre>` elements, text is preserved verbatim. Inside `<table>` elements, whitespace-only text nodes are skipped (HTML formatting noise between `<td>` elements).

- **Element nodes** — the walker iterates through all rules (sorted by priority, descending) and checks each rule's filter. The first rule that matches and returns a non-`undefined` value wins. If no rule matches, the walker recurses into the element's children (pass-through
  behavior for `<div>`, `<span>`, `<section>`, etc.).

The walker carries state as it descends:

- `insidePre` — set to `true` inside `<pre>` elements, disabling whitespace collapsing
- `insideTable` — set to `true` inside `<table>` elements, enabling whitespace-only text node skipping
- `listDepth` — incremented inside `<ul>` and `<ol>`, used for indentation

### 4. Renderer (`packages/core/src/core/renderer.ts`)

Post-processes the raw Markdown string from the walker:

1. Normalize `\r\n` and `\r` to `\n`
2. Collapse whitespace-only lines to empty lines
3. Collapse 3+ consecutive newlines to 2 (ensuring max one blank line between blocks)
4. Trim trailing whitespace from each line (preserving intentional `  \n` line breaks)
5. Trim the entire output and append a final newline

### 5. Deduplicator (`packages/core/src/core/dedup.ts`)

When `deduplicate` is enabled, the deduplicator removes repeated content blocks from the rendered Markdown. This is useful for pages that serve the same content in multiple sections (e.g. mobile and desktop variants).

The deduplicator is section-aware: headings are grouped with their immediately following content block to form compound fingerprints. This prevents stripping repeated structural headings (e.g. "### The situation") that appear under different content sections.

- **Heading + content** = section fingerprint (both combined)
- **Standalone headings** (followed by another heading or nothing) are always preserved
- **Non-heading blocks** are fingerprinted individually
- **Short blocks** (< 10 characters) are exempt from deduplication

### 6. Token Estimator (`packages/core/src/tokens/index.ts`)

Computes a simple token estimate using the ~4 characters per token heuristic. This is intentionally basic — it's meant for cost estimation, not exact tokenizer parity.

## Rule System

Rules are the core extensibility point. Each rule has:

- **`filter`** — a tag name string, array of tag names, or predicate function
- **`replacement`** — a function that receives a `RuleContext` and returns the Markdown string
- **`priority`** — numeric priority (higher = checked first)

### Rule Resolution

```
For each element:
  1. Sort all rules by priority (descending)
  2. For each rule:
     a. Does the filter match? No → skip
     b. Call replacement(context)
     c. Result is undefined? → try next rule (fall-through)
     d. Result is null? → remove element from output
     e. Result is string? → use as output
  3. No rule matched? → recurse into children (transparent pass-through)
```

### Built-in Rule Categories

| Module                              | Elements                                            | Priority |
| ----------------------------------- | --------------------------------------------------- | -------- |
| `packages/core/src/rules/block.ts`  | h1-h6, p, blockquote, pre, hr, br, script/style     | 0        |
| `packages/core/src/rules/inline.ts` | strong, em, del, code, a, img, sub, sup, abbr, mark | 0        |
| `packages/core/src/rules/list.ts`   | ul, ol, li                                          | 0        |
| `packages/core/src/rules/table.ts`  | table, thead, tbody, tfoot, tr, th, td              | 0        |

User-provided rules default to priority 100 (via `createRule`), so they always take precedence over built-in rules.

## Project Structure

```
packages/
  core/                         # markdown-for-agents
    src/
      index.ts                  # Public API barrel
      types.ts                  # All TypeScript interfaces
      core/
        converter.ts            # Main orchestrator (pipeline)
        parser.ts               # HTML → DOM tree
        walker.ts               # DOM tree → raw Markdown
        renderer.ts             # Raw Markdown → clean Markdown
        dedup.ts                # Duplicate content block removal
      rules/
        index.ts                # Rule registry (getDefaultRules, createRule)
        block.ts                # Block-level element rules
        inline.ts               # Inline element rules
        list.ts                 # List element rules
        table.ts                # Table element rules
        util.ts                 # getTextContent helper
      extract/
        index.ts                # Re-export barrel
        extractor.ts            # DOM pruning logic
        selectors.ts            # Default strip patterns
      tokens/
        index.ts                # Token estimation
  audit/                        # @markdown-for-agents/audit
    src/
      index.ts                  # audit() function
      cli.ts                    # CLI entry point
  middleware/
    express/                    # @markdown-for-agents/express
      src/index.ts              # Express middleware (res.send interception)
    fastify/                    # @markdown-for-agents/fastify
      src/index.ts              # Fastify plugin (onSend hook)
    hono/                       # @markdown-for-agents/hono
      src/index.ts              # Hono middleware
    nextjs/                     # @markdown-for-agents/nextjs
      src/index.ts              # Next.js middleware + nextImageRule
    web/                        # @markdown-for-agents/web
      src/index.ts              # Web Standard middleware
```

## Design Decisions

### Why htmlparser2?

- Works in all JavaScript runtimes (no DOM dependency)
- Streaming parser, very fast
- Tolerant of malformed HTML
- Mature, well-maintained, widely used

### Why in-place DOM mutation for extraction?

Extracting content by pruning the tree in-place (rather than cloning) avoids allocating a second copy of the DOM tree. Since extraction always runs before the walker, the original tree is never needed after pruning.

### Why priority-based rules instead of first-match?

Priority-based ordering lets users override built-in rules without needing to know the internal rule order. A custom rule with priority 100 always beats a built-in rule with priority 0, regardless of array position.

### Why ESM only?

The library targets ES2022+ environments. ESM-only simplifies the build, eliminates dual-package hazards, and enables proper tree-shaking with subpath exports.

### Why separate middleware packages?

Each middleware has its own framework dependency (Express, Fastify, Hono, Next.js). Separate packages avoid pulling in unused framework types and keep install sizes minimal. All middleware packages depend on `markdown-for-agents` (the core library) as a regular dependency.

### Why pnpm workspaces?

pnpm's strict node_modules hoisting ensures each package only has access to its declared dependencies, catching missing dependency declarations early. Workspaces enable `workspace:*` protocol for local development while publishing independent packages.
