# Getting Started

This guide walks you through installing `markdown-for-agents` and using it in common scenarios.

## Installation

```bash
npm install markdown-for-agents
```

The library has a single runtime dependency ([htmlparser2](https://github.com/fb55/htmlparser2)) and works in any JavaScript environment that supports ES2022.

## Your First Conversion

```ts
import { convert } from 'markdown-for-agents';

const { markdown } = convert('<h1>Hello</h1><p>World</p>');
console.log(markdown);
// # Hello
//
// World
```

The `convert` function takes an HTML string and returns an object with:

- `markdown` — the converted Markdown string
- `tokenEstimate` — a rough token/character/word count

## Converting a Web Page

To convert a fetched web page and strip away navigation, ads, and boilerplate:

```ts
import { convert } from 'markdown-for-agents';

const response = await fetch('https://example.com/article');
const html = await response.text();

const { markdown, tokenEstimate } = convert(html, {
    extract: true,
    baseUrl: 'https://example.com'
});

console.log(markdown);
console.log(`~${tokenEstimate.tokens} tokens`);
```

The `extract: true` option strips non-content elements (nav, footer, ads, etc.) and `baseUrl` resolves relative links and images to absolute URLs.

## Common Patterns

### Converting an HTML Fragment

For HTML fragments without a full page structure, no extraction is needed:

```ts
const { markdown } = convert(`
  <h2>Features</h2>
  <ul>
    <li>Fast</li>
    <li>Lightweight</li>
    <li>Universal</li>
  </ul>
`);
// ## Features
//
// - Fast
// - Lightweight
// - Universal
```

### Customizing Markdown Output

Control the output style with options:

```ts
const { markdown } = convert(html, {
    headingStyle: 'setext', // Title\n=====
    bulletChar: '*', // * list items
    fenceChar: '~', // ~~~ code blocks
    strongDelimiter: '__', // __bold__
    emDelimiter: '_' // _italic_
});
```

### Getting Token Estimates

Every call to `convert` returns a token estimate. You can also estimate tokens independently:

```ts
import { estimateTokens } from 'markdown-for-agents/tokens';

const estimate = estimateTokens('Some markdown text...');
console.log(estimate);
// { tokens: 6, characters: 22, words: 3 }
```

The estimator uses a ~4 characters per token heuristic, which is a reasonable approximation for English text with most LLM tokenizers.

### Using Custom Rules

Override how specific elements are converted:

```ts
import { convert, createRule } from 'markdown-for-agents';

const { markdown } = convert(html, {
    rules: [
        // Convert <details> to a blockquote
        createRule('details', ({ convertChildren, node }) => {
            const content = convertChildren(node).trim();
            return `\n\n> ${content}\n\n`;
        })
    ]
});
```

See the [Custom Rules guide](rules.md) for the full rule API.

### Serving Markdown via Middleware

If you're building a web server, you can automatically respond with Markdown when AI agents request it. Each middleware is a separate package — install only what you need:

```ts
// Express
import express from 'express';
import { markdown } from '@markdown-for-agents/express';

const app = express();
app.use(markdown({ extract: true }));
app.get('/article', (req, res) => {
    res.send('<h1>Title</h1><p>Content...</p>');
});
```

```ts
// Fastify
import Fastify from 'fastify';
import { markdown } from '@markdown-for-agents/fastify';

const fastify = Fastify();
fastify.register(markdown({ extract: true }));
```

```ts
// Hono
import { Hono } from 'hono';
import { markdown } from '@markdown-for-agents/hono';

const app = new Hono();
app.use(markdown({ extract: true }));
```

When a client sends `Accept: text/markdown`, the response is automatically converted. Normal requests pass through untouched. See the [Middleware guide](middleware.md) for all framework integrations.

## What's Next

- [Content Extraction](extraction.md) — fine-tune what gets stripped from web pages
- [Middleware](middleware.md) — integrate with Express, Fastify, Hono, Next.js, or any Web Standard server
- [Custom Rules](rules.md) — extend the converter with your own element handlers
- [API Reference](api.md) — complete API documentation
