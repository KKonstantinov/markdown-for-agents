# @markdown-for-agents/fastify

[![npm version](https://img.shields.io/npm/v/@markdown-for-agents/fastify)](https://www.npmjs.com/package/@markdown-for-agents/fastify) [![npm downloads](https://img.shields.io/npm/dm/@markdown-for-agents/fastify)](https://www.npmjs.com/package/@markdown-for-agents/fastify)
[![types](https://img.shields.io/npm/types/@markdown-for-agents/fastify)](https://www.npmjs.com/package/@markdown-for-agents/fastify) [![license](https://img.shields.io/npm/l/@markdown-for-agents/fastify)](https://github.com/KKonstantinov/markdown-for-agents/blob/main/LICENSE)

Fastify plugin for [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) — a runtime-agnostic HTML to Markdown converter built for AI agents.

![markdown-for-agents + Fastify](https://raw.githubusercontent.com/KKonstantinov/markdown-for-agents/main/packages/middleware/fastify/mda_fastify_header.png)

> [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) converts HTML to clean, token-efficient Markdown for AI agents — typically saving 80–90% of tokens. This package adds automatic content negotiation to your Fastify app via `Accept: text/markdown`.
> **[Try the playground](https://markdown-for-agents-playground.vercel.app)** to see the core conversion in action.

Add one line to your Fastify app and AI agents get clean, token-efficient Markdown instead of HTML. Normal browser requests pass through untouched.

## How it works

The plugin uses content negotiation. When a client sends `Accept: text/markdown`, HTML responses are automatically converted to Markdown. The response includes:

- `Content-Type: text/markdown; charset=utf-8`
- `x-markdown-tokens` header with the token count
- `ETag` header with a content hash for cache validation
- `Vary: Accept` header so CDNs cache HTML and Markdown separately
- `content-signal` header with publisher consent signals (when configured)

## Install

```bash
npm install @markdown-for-agents/fastify markdown-for-agents
```

> `markdown-for-agents` is a peer dependency — you may already have it installed.

## Usage

```ts
import Fastify from 'fastify';
import { markdown } from '@markdown-for-agents/fastify';

const fastify = Fastify();
fastify.register(markdown({ extract: true }));

fastify.get('/', async (request, reply) => {
    reply.type('text/html');
    return '<h1>Hello</h1>';
});

fastify.listen({ port: 3000 });
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
fastify.register(
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
| [`@markdown-for-agents/hono`](https://www.npmjs.com/package/@markdown-for-agents/hono)       | Hono                                         |
| [`@markdown-for-agents/nextjs`](https://www.npmjs.com/package/@markdown-for-agents/nextjs)   | Next.js                                      |
| [`@markdown-for-agents/web`](https://www.npmjs.com/package/@markdown-for-agents/web)         | Web Standard (Cloudflare Workers, Deno, Bun) |

## License

MIT
