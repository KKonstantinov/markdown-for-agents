# @markdown-for-agents/hono

[![npm version](https://img.shields.io/npm/v/@markdown-for-agents/hono)](https://www.npmjs.com/package/@markdown-for-agents/hono) [![npm downloads](https://img.shields.io/npm/dm/@markdown-for-agents/hono)](https://www.npmjs.com/package/@markdown-for-agents/hono)
[![types](https://img.shields.io/npm/types/@markdown-for-agents/hono)](https://www.npmjs.com/package/@markdown-for-agents/hono) [![license](https://img.shields.io/npm/l/@markdown-for-agents/hono)](https://github.com/KKonstantinov/markdown-for-agents/blob/main/LICENSE)

Hono middleware for [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) — a runtime-agnostic HTML to Markdown converter built for AI agents.

![markdown-for-agents + Hono](https://raw.githubusercontent.com/KKonstantinov/markdown-for-agents/main/packages/middleware/hono/mda_hono_header.png)

> [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) converts HTML to clean, token-efficient Markdown for AI agents — typically saving 80–90% of tokens. This package adds automatic content negotiation to your Hono app via `Accept: text/markdown`.
> **[Try the playground](https://markdown-for-agents.vercel.app/playground)** to see the core conversion in action.

Add one line to your Hono app and AI agents get clean, token-efficient Markdown instead of HTML. Normal browser requests pass through untouched.

## How it works

The middleware uses content negotiation. When a client sends `Accept: text/markdown` (or is a known AI agent when `detectAgents` is enabled), HTML responses are automatically converted to Markdown. The response includes:

- `Content-Type: text/markdown; charset=utf-8`
- `x-markdown-tokens` header with the token count
- `ETag` header with a content hash for cache validation
- `Vary: Accept` header so CDNs cache HTML and Markdown separately
- `content-signal` header with publisher consent signals (when configured)

## Install

```bash
npm install @markdown-for-agents/hono markdown-for-agents
```

> `markdown-for-agents` is a peer dependency — you may already have it installed.

## Usage

```ts
import { Hono } from 'hono';
import { markdown } from '@markdown-for-agents/hono';

const app = new Hono();
app.use(markdown({ extract: true }));

app.get('/', c => {
    return c.html('<h1>Hello</h1>');
});

export default app;
```

```bash
# Normal HTML response
curl http://localhost:3000

# Markdown response for AI agents
curl -H "Accept: text/markdown" http://localhost:3000
```

> **Full working example:** See [`examples/hono/`](https://github.com/KKonstantinov/markdown-for-agents/tree/main/examples/hono) for a complete Hono app with integration tests.

## Options

Accepts all [`markdown-for-agents` options](https://www.npmjs.com/package/markdown-for-agents#options):

```ts
app.use(
    markdown({
        // Strip nav, ads, sidebars, cookie banners
        extract: true,

        // Resolve relative URLs
        baseUrl: 'https://example.com',

        // Remove duplicate content blocks
        deduplicate: true,

        // Custom token counter (e.g. tiktoken)
        tokenCounter: text => ({ tokens: enc.encode(text).length, characters: text.length, words: text.split(/\s+/).filter(Boolean).length }),

        // Publisher consent signal header
        contentSignal: { aiTrain: true, search: true, aiInput: true },

        // Auto-detect AI agents by User-Agent (ClaudeBot, GPTBot, etc.)
        detectAgents: true,

        // Log conversion events (compatible with pino, winston, console)
        logger: console
    })
);
```

## Other frameworks

| Package                                                                                      | Framework                                    |
| -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [`@markdown-for-agents/express`](https://www.npmjs.com/package/@markdown-for-agents/express) | Express                                      |
| [`@markdown-for-agents/fastify`](https://www.npmjs.com/package/@markdown-for-agents/fastify) | Fastify                                      |
| [`@markdown-for-agents/nextjs`](https://www.npmjs.com/package/@markdown-for-agents/nextjs)   | Next.js                                      |
| [`@markdown-for-agents/web`](https://www.npmjs.com/package/@markdown-for-agents/web)         | Web Standard (Cloudflare Workers, Deno, Bun) |

## License

MIT
