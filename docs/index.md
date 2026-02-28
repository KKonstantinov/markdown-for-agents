---
layout: home

hero:
    name: markdown-for-agents
    tagline: Runtime-agnostic HTML to Markdown converter built for AI agents. One dependency, works everywhere.
    actions:
        - theme: brand
          text: Get Started
          link: /getting-started
        - theme: alt
          text: API Reference
          link: /api
        - theme: alt
          text: GitHub
          link: https://github.com/KKonstantinov/markdown-for-agents

features:
    - title: Runtime-agnostic
      details: Node.js, Bun, Deno, Cloudflare Workers, Vercel Edge, browsers — works everywhere.
    - title: Content Extraction
      details: Strip navigation, ads, sidebars, and cookie banners automatically to get just the main content.
    - title: Framework Middleware
      details: Drop-in support for Express, Fastify, Hono, Next.js, and any Web Standard server.
    - title: Frontmatter
      details: Automatically extracts title, description, and image from HTML head as YAML frontmatter.
    - title: Token Estimation
      details: Built-in heuristic token counter for LLM cost planning, with support for custom tokenizers.
    - title: Plugin System
      details: Override or extend any element conversion with custom rules that take priority over defaults.
    - title: Content-Signal Header
      details: Opt-in HTTP header for publisher consent — signal AI training, search, and AI input permissions.
    - title: Single Dependency
      details: Only htmlparser2 — no DOM required. ESM only, fully typed, tree-shakeable.
---

## Why?

AI agents consume web pages as context, but raw HTML is full of markup noise — navigation, ads, sidebars, cookie banners, and deeply nested `<div>` soup. This wastes tokens and degrades LLM output quality.

**markdown-for-agents** converts HTML into clean, token-efficient Markdown with built-in content extraction. Inspired by [Cloudflare's Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/), it runs anywhere — Node.js, Bun, Deno, Cloudflare Workers, Vercel Edge,
and browsers — with a single dependency.

## Quick Start

```bash
npm install markdown-for-agents
```

```ts
import { convert } from 'markdown-for-agents';

const html = `
  <h1>Hello World</h1>
  <p>This is a <strong>simple</strong> example.</p>
`;

const { markdown, tokenEstimate } = convert(html);

console.log(markdown);
// # Hello World
//
// This is a **simple** example.

console.log(tokenEstimate);
// { tokens: 12, characters: 46, words: 8 }
```

## Content Extraction

Real-world pages are full of boilerplate. Enable extraction to get just the main content:

```ts
const { markdown } = convert(html, { extract: true });
```

This strips `<nav>`, `<header>`, `<footer>`, `<aside>`, ads, cookie banners, social widgets, and more — typically saving **80%+ tokens**.

## Middleware

Serve Markdown automatically when AI agents request it via `Accept: text/markdown`. Normal browser requests pass through untouched:

```ts
import { markdown } from '@markdown-for-agents/express';

app.use(markdown({ extract: true }));
```

## Frontmatter

Metadata is automatically extracted from `<head>` and prepended as YAML frontmatter:

```ts
const { markdown } = convert('<html><head><title>My Page</title></head>...</html>');
// ---
// title: My Page
// description: A great page about things
// ---
```

## Custom Rules

Override how any element is converted:

```ts
import { convert, createRule } from 'markdown-for-agents';

const { markdown } = convert(html, {
    rules: [
        createRule(
            node => node.attribs.class?.includes('callout'),
            ({ convertChildren, node }) => `\n\n> **Note:** ${convertChildren(node).trim()}\n\n`
        )
    ]
});
```

## Content-Signal Header

Middleware can set a `content-signal` HTTP header to communicate publisher consent for AI usage:

```ts
app.use(
    markdown({
        contentSignal: { aiTrain: true, search: true, aiInput: true }
    })
);
// Sets header: content-signal: ai-train=yes, search=yes, ai-input=yes
```

## Packages

| Package                                             | Description                                             |
| --------------------------------------------------- | ------------------------------------------------------- |
| [`markdown-for-agents`](/packages/core)             | Core HTML-to-Markdown converter                         |
| [`@markdown-for-agents/audit`](/packages/audit)     | CLI & library to audit token/byte savings               |
| [`@markdown-for-agents/express`](/packages/express) | Express middleware                                      |
| [`@markdown-for-agents/fastify`](/packages/fastify) | Fastify plugin                                          |
| [`@markdown-for-agents/hono`](/packages/hono)       | Hono middleware                                         |
| [`@markdown-for-agents/nextjs`](/packages/nextjs)   | Next.js middleware                                      |
| [`@markdown-for-agents/web`](/packages/web)         | Web Standard middleware (Cloudflare Workers, Deno, Bun) |
