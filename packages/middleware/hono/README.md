# @markdown-for-agents/hono

[![npm version](https://img.shields.io/npm/v/@markdown-for-agents/hono)](https://www.npmjs.com/package/@markdown-for-agents/hono) [![npm downloads](https://img.shields.io/npm/dm/@markdown-for-agents/hono)](https://www.npmjs.com/package/@markdown-for-agents/hono)
[![types](https://img.shields.io/npm/types/@markdown-for-agents/hono)](https://www.npmjs.com/package/@markdown-for-agents/hono) [![license](https://img.shields.io/npm/l/@markdown-for-agents/hono)](https://github.com/KKonstantinov/markdown-for-agents/blob/main/LICENSE)

Hono middleware for [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) — a runtime-agnostic HTML to Markdown converter built for AI agents.

![markdown-for-agents](https://raw.githubusercontent.com/KKonstantinov/markdown-for-agents/main/docs/markdown_for_agents_header.png)

Audit any URL — no installation required:

```bash
npx @markdown-for-agents/audit https://docs.github.com/en/copilot/get-started/quickstart
```

```
           HTML            Markdown        Savings
───────────────────────────────────────────────────
Tokens     138,550         9,364           -93.2%
Chars      554,200         37,456          -93.2%
Words      27,123          4,044
Size       541.3 KB        36.6 KB         -93.2%
```

Add one line to your Hono app and AI agents get clean, token-efficient Markdown instead of HTML. Normal browser requests pass through untouched.

## How it works

The middleware uses content negotiation. When a client sends `Accept: text/markdown`, HTML responses are automatically converted to Markdown. The response includes:

- `Content-Type: text/markdown; charset=utf-8`
- `x-markdown-tokens` header with the token count
- `ETag` header with a content hash for cache validation
- `Vary: Accept` header so CDNs cache HTML and Markdown separately
- `content-signal` header with publisher consent signals (when configured)

## Install

```bash
npm install @markdown-for-agents/hono markdown-for-agents
```

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
        contentSignal: { aiTrain: true, search: true, aiInput: true }
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
