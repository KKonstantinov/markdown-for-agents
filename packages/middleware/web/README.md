# @markdown-for-agents/web

[![npm version](https://img.shields.io/npm/v/@markdown-for-agents/web)](https://www.npmjs.com/package/@markdown-for-agents/web) [![npm downloads](https://img.shields.io/npm/dm/@markdown-for-agents/web)](https://www.npmjs.com/package/@markdown-for-agents/web)
[![types](https://img.shields.io/npm/types/@markdown-for-agents/web)](https://www.npmjs.com/package/@markdown-for-agents/web) [![license](https://img.shields.io/npm/l/@markdown-for-agents/web)](https://github.com/KKonstantinov/markdown-for-agents/blob/main/LICENSE)

Web Standard (Request/Response) middleware for [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) — a runtime-agnostic HTML to Markdown converter built for AI agents.

![markdown-for-agents + Web Standard](https://raw.githubusercontent.com/KKonstantinov/markdown-for-agents/main/packages/middleware/web/mda_web_header.png)

> [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) converts HTML to clean, token-efficient Markdown for AI agents — typically saving 80–90% of tokens. This package adds automatic content negotiation to any Web Standard server via `Accept: text/markdown`.
> **[Try the playground](https://markdown-for-agents-playground.vercel.app)** to see the core conversion in action.

Works anywhere the Web Standard Request/Response API is available: Cloudflare Workers, Deno, Bun, and Node.js. AI agents get clean, token-efficient Markdown instead of HTML. Normal browser requests pass through untouched.

## How it works

The middleware uses content negotiation. When a client sends `Accept: text/markdown` (or is a known AI agent when `detectAgents` is enabled), HTML responses are automatically converted to Markdown. The response includes:

- `Content-Type: text/markdown; charset=utf-8`
- `x-markdown-tokens` header with the token count
- `ETag` header with a content hash for cache validation
- `Vary: Accept` header so CDNs cache HTML and Markdown separately
- `content-signal` header with publisher consent signals (when configured)

## Install

```bash
npm install @markdown-for-agents/web markdown-for-agents
```

> `markdown-for-agents` is a peer dependency — you may already have it installed.

## Usage

### Cloudflare Workers

```ts
import { markdownMiddleware } from '@markdown-for-agents/web';

const mw = markdownMiddleware({ extract: true });

export default {
    async fetch(request: Request): Promise<Response> {
        return mw(request, async () => {
            const html = await renderPage();
            return new Response(html, {
                headers: { 'content-type': 'text/html' }
            });
        });
    }
};
```

### Deno

```ts
import { markdownMiddleware } from '@markdown-for-agents/web';

const mw = markdownMiddleware({ extract: true });

Deno.serve(async request => {
    return mw(request, async () => {
        return new Response('<h1>Hello</h1>', {
            headers: { 'content-type': 'text/html' }
        });
    });
});
```

### Bun

```ts
import { markdownMiddleware } from '@markdown-for-agents/web';

const mw = markdownMiddleware({ extract: true });

Bun.serve({
    async fetch(request) {
        return mw(request, async () => {
            return new Response('<h1>Hello</h1>', {
                headers: { 'content-type': 'text/html' }
            });
        });
    }
});
```

```bash
# Normal HTML response
curl http://localhost:3000

# Markdown response for AI agents
curl -H "Accept: text/markdown" http://localhost:3000
```

> **Full working example:** See [`examples/web/`](https://github.com/KKonstantinov/markdown-for-agents/tree/main/examples/web) for a complete Web Standard app (Node.js) with integration tests.

## Options

Accepts all [`markdown-for-agents` options](https://www.npmjs.com/package/markdown-for-agents#options):

```ts
const mw = markdownMiddleware({
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
    detectAgents: true
});
```

## Other frameworks

| Package                                                                                      | Framework |
| -------------------------------------------------------------------------------------------- | --------- |
| [`@markdown-for-agents/express`](https://www.npmjs.com/package/@markdown-for-agents/express) | Express   |
| [`@markdown-for-agents/fastify`](https://www.npmjs.com/package/@markdown-for-agents/fastify) | Fastify   |
| [`@markdown-for-agents/hono`](https://www.npmjs.com/package/@markdown-for-agents/hono)       | Hono      |
| [`@markdown-for-agents/nextjs`](https://www.npmjs.com/package/@markdown-for-agents/nextjs)   | Next.js   |

## License

MIT
