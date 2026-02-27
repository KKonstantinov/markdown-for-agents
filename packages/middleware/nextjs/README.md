# @markdown-for-agents/nextjs

Next.js middleware for [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) — a runtime-agnostic HTML to Markdown converter built for AI agents.

Wrap your route handlers and AI agents get clean, token-efficient Markdown instead of HTML. Normal browser requests pass through untouched. Includes a built-in rule that unwraps Next.js `/_next/image` optimization URLs back to their original paths.

## How it works

The middleware uses content negotiation. When a client sends `Accept: text/markdown`, HTML responses are automatically converted to Markdown. The response includes:

- `Content-Type: text/markdown; charset=utf-8`
- `x-markdown-tokens` header with the token count
- `ETag` header with a content hash for cache validation
- `Vary: Accept` header so CDNs cache HTML and Markdown separately
- `content-signal` header with publisher consent signals (when configured)

## Install

```bash
npm install @markdown-for-agents/nextjs markdown-for-agents
```

## Usage

### App Router API Route

```ts
import { withMarkdown } from '@markdown-for-agents/nextjs';

async function handler(request: Request) {
    const html = await renderArticle();
    return new Response(html, {
        headers: { 'content-type': 'text/html' }
    });
}

export const GET = withMarkdown(handler, { extract: true });
```

```bash
# Normal HTML response
curl http://localhost:3000/api/article

# Markdown response for AI agents
curl -H "Accept: text/markdown" http://localhost:3000/api/article
```

### Next.js Image Rule

The `nextImageRule` is included automatically when using `withMarkdown`. It converts optimized image URLs like `/_next/image?url=%2Fphoto.png&w=640&q=75` back to `/photo.png`.

You can also use it standalone with the core library:

```ts
import { nextImageRule } from '@markdown-for-agents/nextjs';
import { convert } from 'markdown-for-agents';

const { markdown } = convert(html, { rules: [nextImageRule] });
```

## Options

Accepts all [`markdown-for-agents` options](https://www.npmjs.com/package/markdown-for-agents#options):

```ts
export const GET = withMarkdown(handler, {
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
});
```

## Other frameworks

| Package                                                                                      | Framework                                    |
| -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [`@markdown-for-agents/express`](https://www.npmjs.com/package/@markdown-for-agents/express) | Express                                      |
| [`@markdown-for-agents/fastify`](https://www.npmjs.com/package/@markdown-for-agents/fastify) | Fastify                                      |
| [`@markdown-for-agents/hono`](https://www.npmjs.com/package/@markdown-for-agents/hono)       | Hono                                         |
| [`@markdown-for-agents/web`](https://www.npmjs.com/package/@markdown-for-agents/web)         | Web Standard (Cloudflare Workers, Deno, Bun) |

## License

MIT
