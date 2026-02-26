# @markdown-for-agents/express

Express middleware for [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) — a runtime-agnostic HTML to Markdown converter built for AI agents.

Add one line to your Express app and AI agents get clean, token-efficient Markdown instead of HTML. Normal browser requests pass through untouched.

## How it works

The middleware uses content negotiation. When a client sends `Accept: text/markdown`, HTML responses are automatically converted to Markdown. The response includes:

- `Content-Type: text/markdown; charset=utf-8`
- `x-markdown-tokens` header with the token count

## Install

```bash
npm install @markdown-for-agents/express markdown-for-agents
```

## Usage

```ts
import express from 'express';
import { markdown } from '@markdown-for-agents/express';

const app = express();
app.use(markdown({ extract: true }));

app.get('/', (req, res) => {
    res.send('<h1>Hello</h1><p>World</p>');
});

app.listen(3000);
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
        tokenCounter: text => ({ tokens: enc.encode(text).length, characters: text.length, words: text.split(/\s+/).filter(Boolean).length })
    })
);
```

## Other frameworks

| Package                                                                                      | Framework                                    |
| -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [`@markdown-for-agents/fastify`](https://www.npmjs.com/package/@markdown-for-agents/fastify) | Fastify                                      |
| [`@markdown-for-agents/hono`](https://www.npmjs.com/package/@markdown-for-agents/hono)       | Hono                                         |
| [`@markdown-for-agents/nextjs`](https://www.npmjs.com/package/@markdown-for-agents/nextjs)   | Next.js                                      |
| [`@markdown-for-agents/web`](https://www.npmjs.com/package/@markdown-for-agents/web)         | Web Standard (Cloudflare Workers, Deno, Bun) |

## License

MIT
