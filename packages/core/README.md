# markdown-for-agents

Runtime-agnostic HTML to Markdown converter built for AI agents. One dependency, works everywhere.

Convert any HTML page into clean, token-efficient Markdown — with built-in content extraction to strip away navigation, ads, and boilerplate. Inspired by [Cloudflare's Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/).

## Features

- **Runtime-agnostic** — Node.js, Bun, Deno, Cloudflare Workers, Vercel Edge, browsers
- **Frontmatter** — automatically extracts title, description, and image from `<head>` and prepends YAML frontmatter
- **Content extraction** — strip nav, footer, ads, sidebars, cookie banners automatically
- **Content-signal header** — opt-in `content-signal` HTTP header for publisher consent (AI training, search, AI input)
- **Framework middleware** — drop-in support for Express, Fastify, Hono, Next.js, and any Web Standard server
- **Content negotiation** — respond with Markdown when clients send `Accept: text/markdown`
- **Token estimation** — built-in heuristic token counter for LLM cost planning, with support for custom tokenizers
- **Plugin system** — override or extend any element conversion with custom rules
- **Single dependency** — only [htmlparser2](https://github.com/fb55/htmlparser2) (no DOM required)
- **ESM only** — modern, tree-shakeable, with subpath exports
- **Fully typed** — written in TypeScript with complete type definitions

## Install

```bash
npm install markdown-for-agents
```

## Quick Start

```ts
import { convert } from 'markdown-for-agents';

const html = `
  <h1>Hello World</h1>
  <p>This is a <strong>simple</strong> example.</p>
`;

const { markdown, tokenEstimate, contentHash } = convert(html);

console.log(markdown);
// # Hello World
//
// This is a **simple** example.

console.log(tokenEstimate);
// { tokens: 12, characters: 46, words: 8 }

console.log(contentHash);
// "d-1a3b4c5" — deterministic, use as ETag or cache key
```

## Content Extraction

Real-world HTML pages are full of navigation, ads, sidebars, and cookie banners. Enable extraction mode to get just the main content:

```ts
const { markdown } = convert(html, { extract: true });
```

This strips `<nav>`, `<header>`, `<footer>`, `<aside>`, `<script>`, `<style>`, ad-related elements, cookie banners, social widgets, and more.

## Frontmatter

By default, metadata is extracted from the HTML `<head>` element and prepended as YAML frontmatter. This aligns with [Cloudflare's Markdown for Agents](https://developers.cloudflare.com/agents/guides/enable-markdown-for-agents/) convention.

```ts
const html = `<html>
  <head>
    <title>My Page</title>
    <meta name="description" content="A great page about things">
    <meta property="og:image" content="https://example.com/hero.png">
  </head>
  <body><p>Content here</p></body>
</html>`;

const { markdown } = convert(html);
// ---
// title: My Page
// description: A great page about things
// image: https://example.com/hero.png
// ---
// Content here
```

Extracted fields: `title` (from `<title>`), `description` (from `<meta name="description">`), `image` (from `<meta property="og:image">`).

Disable it or merge custom fields:

```ts
// Disable frontmatter
convert(html, { frontmatter: false });

// Merge custom fields (custom overrides extracted)
convert(html, { frontmatter: { author: 'Jane', title: 'Custom Title' } });
```

## Middleware

Framework middleware is available as separate packages — they serve Markdown automatically when AI agents request it via `Accept: text/markdown`:

```ts
// Express
import { markdown } from '@markdown-for-agents/express';
app.use(markdown());

// Fastify
import { markdown } from '@markdown-for-agents/fastify';
fastify.register(markdown());

// Hono
import { markdown } from '@markdown-for-agents/hono';
app.use(markdown());

// Next.js (auto-unwraps /_next/image URLs)
import { withMarkdown } from '@markdown-for-agents/nextjs';
export default withMarkdown(handler);

// Any Web Standard server (Cloudflare Workers, Deno, Bun)
import { markdownMiddleware } from '@markdown-for-agents/web';
const mw = markdownMiddleware();
```

The middleware inspects the `Accept` header. Normal browser requests pass through untouched. When an AI agent sends `Accept: text/markdown`, the HTML response is automatically converted.

| Package                                                                                      | Framework                                    |
| -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [`@markdown-for-agents/express`](https://www.npmjs.com/package/@markdown-for-agents/express) | Express                                      |
| [`@markdown-for-agents/fastify`](https://www.npmjs.com/package/@markdown-for-agents/fastify) | Fastify                                      |
| [`@markdown-for-agents/hono`](https://www.npmjs.com/package/@markdown-for-agents/hono)       | Hono                                         |
| [`@markdown-for-agents/nextjs`](https://www.npmjs.com/package/@markdown-for-agents/nextjs)   | Next.js                                      |
| [`@markdown-for-agents/web`](https://www.npmjs.com/package/@markdown-for-agents/web)         | Web Standard (Cloudflare Workers, Deno, Bun) |

## Custom Rules

Override how any element is converted, or add support for custom elements:

```ts
import { convert, createRule } from 'markdown-for-agents';

const { markdown } = convert(html, {
    rules: [
        createRule(
            node => node.name === 'div' && node.attribs.class?.includes('callout'),
            ({ convertChildren, node }) => `\n\n> **Note:** ${convertChildren(node).trim()}\n\n`
        )
    ]
});
```

Custom rules have higher priority than defaults and are applied first.

## Options

All options are optional. Defaults are shown below:

```ts
convert(html, {
    // YAML frontmatter from <head> metadata
    frontmatter: true, // false | Record<string, string>

    // Content extraction
    extract: false, // true | ExtractOptions

    // Custom conversion rules
    rules: [], // Rule[]

    // Base URL for resolving relative links and images
    baseUrl: '', // "https://example.com"

    // Heading style
    headingStyle: 'atx', // "atx" (#) or "setext" (underline)

    // Bullet character for unordered lists
    bulletChar: '-', // "-", "*", or "+"

    // Code block style
    codeBlockStyle: 'fenced', // "fenced" or "indented"

    // Fence character
    fenceChar: '`', // "`" or "~"

    // Strong delimiter
    strongDelimiter: '**', // "**" or "__"

    // Emphasis delimiter
    emDelimiter: '*', // "*" or "_"

    // Link style
    linkStyle: 'inlined', // "inlined" or "referenced"

    // Remove duplicate content blocks
    deduplicate: false, // true | DeduplicateOptions

    // Custom token counter (replaces built-in heuristic)
    tokenCounter: undefined // (text: string) => TokenEstimate
});
```

### Custom Token Counter

By default, token estimation uses a fast heuristic (~4 characters per token). You can replace it with an exact tokenizer:

```ts
import { convert } from 'markdown-for-agents';
import { encoding_for_model } from 'tiktoken';

const enc = encoding_for_model('gpt-4o');

const { markdown, tokenEstimate } = convert(html, {
    tokenCounter: text => ({
        tokens: enc.encode(text).length,
        characters: text.length,
        words: text.split(/\s+/).filter(Boolean).length
    })
});
```

The custom counter receives the final markdown string and must return a `TokenEstimate` object with `tokens`, `characters`, and `words` fields. It flows through to middleware as well — the `x-markdown-tokens` header will reflect your counter's value.

### Deduplication Options

Pass `deduplicate: true` to use defaults, or pass a `DeduplicateOptions` object to customize behavior:

```ts
const { markdown } = convert(html, {
    deduplicate: { minLength: 5 } // catch short repeated phrases like "Read more"
});
```

The `minLength` option (default: `10`) controls the minimum block length eligible for deduplication. Blocks shorter than this are always kept. Lower it to catch short repeated phrases, raise it for more conservative deduplication.

### Content-Signal Header

Middleware can set a `content-signal` HTTP header to communicate publisher consent for AI training, search indexing, and AI input. This is opt-in — the header is only set when explicitly configured:

```ts
app.use(
    markdown({
        contentSignal: {
            aiTrain: true, // ai-train=yes
            search: true, // search=yes
            aiInput: true // ai-input=yes
        }
    })
);
// Sets header: content-signal: ai-train=yes, search=yes, ai-input=yes
```

Only explicitly set fields are included. Set a field to `false` to signal denial (e.g. `aiTrain: false` → `ai-train=no`). Omit a field to exclude it from the header entirely.

## Supported Elements

### Block

| HTML                                              | Markdown                                |
| ------------------------------------------------- | --------------------------------------- |
| `<h1>`...`<h6>`                                   | `# Heading` (atx) or underline (setext) |
| `<p>`                                             | Paragraph with blank lines              |
| `<blockquote>`                                    | `> Quoted text`                         |
| `<pre><code>`                                     | Fenced code block with language         |
| `<hr>`                                            | `---`                                   |
| `<br>`                                            | Trailing double-space line break        |
| `<ul>`, `<ol>`, `<li>`                            | Lists with nesting and indentation      |
| `<table>`                                         | GFM pipe table with separator row       |
| `<script>`, `<style>`, `<noscript>`, `<template>` | Stripped                                |

### Inline

| HTML                       | Markdown                                     |
| -------------------------- | -------------------------------------------- |
| `<strong>`, `<b>`          | `**bold**`                                   |
| `<em>`, `<i>`              | `*italic*`                                   |
| `<del>`, `<s>`, `<strike>` | `~~strikethrough~~`                          |
| `<code>`                   | `` `inline code` ``                          |
| `<a>`                      | `[text](url)` with title and baseUrl support |
| `<img>`                    | `![alt](src)` with title and baseUrl support |
| `<sub>`                    | `~subscript~`                                |
| `<sup>`                    | `^superscript^`                              |
| `<abbr>`, `<mark>`         | Pass-through (text preserved)                |

## Subpath Exports

The core package provides fine-grained imports for tree-shaking:

```ts
import { convert } from 'markdown-for-agents';
import { extractContent } from 'markdown-for-agents/extract';
import { estimateTokens } from 'markdown-for-agents/tokens';
```

## Runtime Compatibility

| Runtime            | Version | Status     |
| ------------------ | ------- | ---------- |
| Node.js            | >= 20   | Tested     |
| Bun                | >= 1.0  | Tested     |
| Deno               | >= 1.40 | Tested     |
| Cloudflare Workers | -       | Compatible |
| Vercel Edge        | -       | Compatible |
| Browsers           | ES2022+ | Compatible |

## License

MIT
