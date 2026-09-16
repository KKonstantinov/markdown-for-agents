# @markdown-for-agents/sveltekit

[![npm version](https://img.shields.io/npm/v/@markdown-for-agents/sveltekit)](https://www.npmjs.com/package/@markdown-for-agents/sveltekit)
[![npm downloads](https://img.shields.io/npm/dm/@markdown-for-agents/sveltekit)](https://www.npmjs.com/package/@markdown-for-agents/sveltekit) [![types](https://img.shields.io/npm/types/@markdown-for-agents/sveltekit)](https://www.npmjs.com/package/@markdown-for-agents/sveltekit)
[![license](https://img.shields.io/npm/l/@markdown-for-agents/sveltekit)](https://github.com/KKonstantinov/markdown-for-agents/blob/main/LICENSE)

SvelteKit `handle` middleware for [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents), a runtime-agnostic HTML to Markdown converter built for AI agents.

> [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) converts HTML to clean, token-efficient Markdown for AI agents. This package adds automatic content negotiation to SvelteKit via `Accept: text/markdown`.

Add one handle hook and AI agents get clean Markdown instead of HTML. Normal browser requests pass through without conversion work.

## How it works

The middleware calls SvelteKit's `resolve(event)` and then delegates to the Web Standard adapter. When a client sends `Accept: text/markdown`, HTML responses are converted to Markdown. Responses include:

- `Content-Type: text/markdown; charset=utf-8`
- `x-markdown-tokens` header with the token count
- `ETag` header with a content hash for cache validation
- `Vary: Accept` header so CDNs cache HTML and Markdown separately
- `content-signal` header with publisher consent signals when configured
- `Server-Timing` and `x-markdown-timing` headers when `serverTiming: true`

## Install

```bash
npm install @markdown-for-agents/sveltekit markdown-for-agents
```

> `@sveltejs/kit` is a peer dependency.

## Usage

```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import { markdown } from '@markdown-for-agents/sveltekit';
import type { Handle } from '@sveltejs/kit';

const auth: Handle = async ({ event, resolve }) => {
    event.locals.user = await getUser(event);
    return resolve(event);
};

export const handle = sequence(
    auth,
    markdown({
        extract: true,
        deduplicate: true,
        contentSignal: { aiTrain: true, search: true, aiInput: true }
    })
);
```

Place `markdown()` after hooks that populate `event.locals`, perform auth, localize, or rewrite requests. That lets those hooks affect the HTML response before conversion. Place hooks that must inspect the final Markdown response after it.

You can pass SvelteKit `resolve` options when needed:

```ts
export const handle = markdown({
    extract: true,
    resolveOptions: {
        transformPageChunk: ({ html }) => html.replace('%agent-ready%', 'true')
    }
});
```

## Pass-through behavior

The adapter converts only when the request asks for `text/markdown` and SvelteKit returns an HTML response. These responses pass through unchanged except for the existing middleware `Vary: Accept` cache signal:

- ordinary browser HTML requests
- redirects
- thrown SvelteKit error pages that are not HTML
- `+server.ts` JSON endpoints
- static assets
- XML and RSS
- any non-HTML response

Converted HTML responses are read with `Response.text()`, so the HTML body is buffered only for Markdown requests. Streaming and non-HTML responses that are not converted keep their original `Response` object.

## Options

Accepts all [`markdown-for-agents` options](https://www.npmjs.com/package/markdown-for-agents#options), plus `resolveOptions` for SvelteKit:

```ts
export const handle = markdown({
    extract: true,
    baseUrl: 'https://example.com',
    deduplicate: true,
    tokenCounter: text => ({ tokens: text.length, characters: text.length, words: text.split(/\s+/).filter(Boolean).length }),
    contentSignal: { aiTrain: true, search: true, aiInput: true },
    serverTiming: true
});
```

## Other frameworks

| Package                                                                                      | Framework                                    |
| -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [`@markdown-for-agents/express`](https://www.npmjs.com/package/@markdown-for-agents/express) | Express                                      |
| [`@markdown-for-agents/fastify`](https://www.npmjs.com/package/@markdown-for-agents/fastify) | Fastify                                      |
| [`@markdown-for-agents/hono`](https://www.npmjs.com/package/@markdown-for-agents/hono)       | Hono                                         |
| [`@markdown-for-agents/nextjs`](https://www.npmjs.com/package/@markdown-for-agents/nextjs)   | Next.js                                      |
| [`@markdown-for-agents/web`](https://www.npmjs.com/package/@markdown-for-agents/web)         | Web Standard (Cloudflare Workers, Deno, Bun) |

## License

MIT
