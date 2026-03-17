# @markdown-for-agents/nextjs

[![npm version](https://img.shields.io/npm/v/@markdown-for-agents/nextjs)](https://www.npmjs.com/package/@markdown-for-agents/nextjs) [![npm downloads](https://img.shields.io/npm/dm/@markdown-for-agents/nextjs)](https://www.npmjs.com/package/@markdown-for-agents/nextjs)
[![types](https://img.shields.io/npm/types/@markdown-for-agents/nextjs)](https://www.npmjs.com/package/@markdown-for-agents/nextjs) [![license](https://img.shields.io/npm/l/@markdown-for-agents/nextjs)](https://github.com/KKonstantinov/markdown-for-agents/blob/main/LICENSE)

Next.js middleware for [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) — a runtime-agnostic HTML to Markdown converter built for AI agents.

![markdown-for-agents + Next.js](https://raw.githubusercontent.com/KKonstantinov/markdown-for-agents/main/packages/middleware/nextjs/mda_nextjs_header.png)

> [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) converts HTML to clean, token-efficient Markdown for AI agents — typically saving 80–90% of tokens. This package adds automatic content negotiation to your Next.js app via `Accept: text/markdown`.
> **[Try the playground](https://markdown-for-agents-playground.vercel.app)** to see the core conversion in action.

Add a proxy and AI agents get clean, token-efficient Markdown instead of HTML. Normal browser requests pass through untouched. Includes a built-in rule that unwraps Next.js `/_next/image` optimization URLs back to their original paths.

## How it works

The middleware uses content negotiation. When a client sends `Accept: text/markdown`, HTML responses are automatically converted to Markdown. The response includes:

- `Content-Type: text/markdown; charset=utf-8`
- `x-markdown-tokens` header with the token count
- `ETag` header with a content hash for cache validation
- `Vary: Accept` header so CDNs cache HTML and Markdown separately
- `content-signal` header with publisher consent signals (when configured)
- `Server-Timing` and `x-markdown-timing` headers with conversion timing (when `serverTiming: true`)

## Install

```bash
npm install @markdown-for-agents/nextjs markdown-for-agents
```

> `markdown-for-agents` is installed automatically as a dependency.

## Usage

Use a [Next.js proxy](https://nextjs.org/docs/app/building-your-application/routing/middleware) for site-wide conversion. The proxy checks the `Accept` header and fetches the page as HTML before converting:

```ts
// proxy.ts
import { NextRequest, NextResponse, NextFetchEvent } from 'next/server';
import { withMarkdown } from '@markdown-for-agents/nextjs';

const options = {
    extract: true,
    deduplicate: true,
    contentSignal: { aiTrain: true, search: true, aiInput: true }
};

export async function proxy(request: NextRequest, event: NextFetchEvent) {
    const accept = request.headers.get('accept') ?? '';
    if (!accept.includes('text/markdown')) {
        return NextResponse.next();
    }

    const handler = withMarkdown(async (req: NextRequest) => fetch(req.url, { headers: { accept: 'text/html' } }), { ...options, baseUrl: request.nextUrl.origin });

    return (await handler(request, event)) ?? NextResponse.next();
}

export const config = {
    matcher: ['/', '/about', '/blog/:slug*']
};
```

#### How it works

The inner `fetch` sends `accept: 'text/html'`, so when the request re-enters the proxy it hits the early `return NextResponse.next()` and renders the page normally — no infinite loop. Only `Accept: text/markdown` requests take this path; all other traffic passes straight through.

#### Tradeoffs

This pattern makes a **second HTTP request** to your own server for every Markdown conversion. Next.js proxy runs _before_ page rendering and has no access to the response body, so there is no way to avoid this round trip within Next.js itself.

In practice this is usually fine:

- **Latency** — the second request is localhost-to-localhost (or edge-to-edge on Vercel), so it adds minimal overhead.
- **Compute** — your page renders twice for AI agent requests. For static or ISR pages this is a cache hit. For dynamic pages the extra render is the main cost.
- **Scope control** — use `config.matcher` to limit which routes are eligible, so non-content pages (API routes, auth, assets) are never double-fetched.

`withMarkdown` automatically includes `nextImageRule`, which unwraps `/_next/image` optimization URLs back to their original paths. For example, `/_next/image?url=%2Fphoto.png&w=640&q=75` becomes `/photo.png` in the markdown output.

You can also use `nextImageRule` standalone with the core `convert` function:

```ts
import { nextImageRule } from '@markdown-for-agents/nextjs';
import { convert } from 'markdown-for-agents';

const { markdown } = convert(html, { rules: [nextImageRule] });
```

> **Full working example:** See [`examples/nextjs/`](https://github.com/KKonstantinov/markdown-for-agents/tree/main/examples/nextjs) for a complete Next.js app demonstrating the proxy pattern with integration tests.

## Options

Accepts all [`markdown-for-agents` options](https://www.npmjs.com/package/markdown-for-agents#options):

```ts
const handler = withMarkdown(async req => fetch(req.url, { headers: { accept: 'text/html' } }), {
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
