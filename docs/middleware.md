# Middleware

`markdown-for-agents` includes middleware for serving Markdown responses via content negotiation. When an AI agent (or any client) sends `Accept: text/markdown`, the middleware intercepts the HTML response and converts it to Markdown automatically. Normal browser requests pass
through untouched.

Each middleware is a separate package. Install only the ones you need:

```bash
npm install @markdown-for-agents/express
npm install @markdown-for-agents/fastify
npm install @markdown-for-agents/hono
npm install @markdown-for-agents/nextjs
npm install @markdown-for-agents/web
```

All middleware packages depend on `markdown-for-agents` (the core library), which is installed automatically as a dependency.

## How It Works

1. Client sends a request with `Accept: text/markdown` header
2. Your server generates an HTML response as usual
3. The middleware intercepts the response, converts the HTML to Markdown
4. The client receives `Content-Type: text/markdown; charset=utf-8`
5. The response includes an `x-markdown-tokens` header with the estimated token count and an `ETag` for cache validation

All responses (converted or not) include `Vary: Accept` so that CDNs and proxies cache HTML and Markdown representations separately.

If the `Accept` header doesn't include `text/markdown`, or the upstream response isn't HTML, the middleware passes through without modification.

## Express

```bash
npm install @markdown-for-agents/express
```

```ts
import express from 'express';
import { markdown } from '@markdown-for-agents/express';

const app = express();

// Apply globally
app.use(markdown());

// Or with options
app.use(
    markdown({
        extract: true,
        baseUrl: 'https://example.com'
    })
);

app.get('/', (req, res) => {
    res.send(`
    <nav><a href="/">Home</a></nav>
    <main>
      <h1>Article</h1>
      <p>Content here...</p>
    </main>
    <footer>Copyright 2025</footer>
  `);
});

app.listen(3000);
```

The Express middleware intercepts `res.send()` calls. When the client sends `Accept: text/markdown` and the response content type is `text/html`, it converts the HTML body to Markdown before sending. Non-HTML responses and non-string bodies pass through untouched.

Test it:

```bash
# Normal HTML response
curl http://localhost:3000/

# Markdown response
curl -H "Accept: text/markdown" http://localhost:3000/
```

## Fastify

```bash
npm install @markdown-for-agents/fastify
```

```ts
import Fastify from 'fastify';
import { markdown } from '@markdown-for-agents/fastify';

const fastify = Fastify();

// Register as a plugin
fastify.register(markdown());

// Or with options
fastify.register(
    markdown({
        extract: true,
        baseUrl: 'https://example.com'
    })
);

fastify.get('/', async (request, reply) => {
    reply.type('text/html');
    return `
    <nav><a href="/">Home</a></nav>
    <main>
      <h1>Article</h1>
      <p>Content here...</p>
    </main>
    <footer>Copyright 2025</footer>
  `;
});

fastify.listen({ port: 3000 });
```

The Fastify middleware uses the `onSend` hook to intercept the response payload before it's sent to the client. This is the idiomatic Fastify approach for response transformation.

## Hono

```bash
npm install @markdown-for-agents/hono
```

```ts
import { Hono } from 'hono';
import { markdown } from '@markdown-for-agents/hono';

const app = new Hono();

// Apply globally
app.use(markdown());

// Or with options
app.use(
    markdown({
        extract: true,
        baseUrl: 'https://example.com'
    })
);

app.get('/', c => {
    return c.html(`
    <nav><a href="/">Home</a></nav>
    <main>
      <h1>Article</h1>
      <p>Content here...</p>
    </main>
    <footer>Copyright 2025</footer>
  `);
});

export default app;
```

Test it:

```bash
# Normal HTML response
curl https://localhost:3000/

# Markdown response
curl -H "Accept: text/markdown" https://localhost:3000/
```

The Hono middleware uses `MiddlewareHandler` from Hono, so it integrates natively with Hono's middleware chain.

## Next.js

```bash
npm install @markdown-for-agents/nextjs
```

```ts
// app/api/article/route.ts
import { withMarkdown } from '@markdown-for-agents/nextjs';

async function handler(request: Request) {
    const html = await renderArticle();
    return new Response(html, {
        headers: { 'content-type': 'text/html' }
    });
}

export const GET = withMarkdown(handler, {
    extract: true,
    baseUrl: 'https://example.com'
});
```

`withMarkdown` wraps a Next.js route handler. It checks the `Accept` header and converts the response if needed.

The Next.js middleware automatically includes `nextImageRule`, which unwraps `/_next/image` optimization URLs back to their original paths. For example, `/_next/image?url=%2Fphoto.png&w=640&q=75` becomes `/photo.png` in the markdown output.

You can also use `nextImageRule` standalone with the core `convert` function:

```ts
import { nextImageRule } from '@markdown-for-agents/nextjs';
import { convert } from 'markdown-for-agents';

const { markdown } = convert(html, { rules: [nextImageRule] });
```

### Next.js Middleware (Edge)

You can also use it in Next.js middleware for site-wide conversion:

```ts
// middleware.ts
import { withMarkdown } from '@markdown-for-agents/nextjs';

const handler = withMarkdown(async request => {
    const response = await fetch(request.url, {
        headers: { accept: 'text/html' }
    });
    return response;
});

export default handler;
```

## Web Standard (Generic)

```bash
npm install @markdown-for-agents/web
```

For any server that uses the Web Standard `Request`/`Response` API (Cloudflare Workers, Deno, Bun, etc.):

```ts
import { markdownMiddleware } from '@markdown-for-agents/web';

const mw = markdownMiddleware({ extract: true });

// Cloudflare Workers
export default {
    async fetch(request: Request): Promise<Response> {
        return mw(request, async req => {
            const html = await renderPage(req);
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
        return new Response('<h1>Hello from Deno</h1>', {
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
            return new Response('<h1>Hello from Bun</h1>', {
                headers: { 'content-type': 'text/html' }
            });
        });
    }
});
```

## Options

All middleware functions accept `MiddlewareOptions`, which extends `ConvertOptions` with one additional property:

```ts
interface MiddlewareOptions extends ConvertOptions {
    tokenHeader?: string; // Default: "x-markdown-tokens"
}
```

You can pass any `ConvertOptions` (extraction, rules, baseUrl, etc.) and they are forwarded to the converter:

```ts
const mw = markdownMiddleware({
    // Conversion options
    extract: true,
    baseUrl: 'https://example.com',
    headingStyle: 'atx',
    rules: [
        /* custom rules */
    ],

    // Middleware-specific
    tokenHeader: 'x-token-count' // Custom header name
});
```

## Response Headers

When the middleware converts a response, it sets these headers:

| Header              | Value                          | Description                                                                                          |
| ------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `Content-Type`      | `text/markdown; charset=utf-8` | Replaces the original `text/html`                                                                    |
| `x-markdown-tokens` | `123`                          | Estimated token count (configurable header name)                                                     |
| `ETag`              | `"2f-1a3b4c5"`                 | Content hash of the markdown output for cache validation                                             |
| `Vary`              | `Accept`                       | Ensures caches store separate entries per content type (always set, even on non-converted responses) |

## Caching

The middleware sets two headers that enable efficient caching out of the box:

- **`Vary: Accept`** — tells CDNs and proxies that the response varies by `Accept` header. Without this, a CDN could cache the HTML variant and serve it to an AI agent requesting Markdown (or vice versa). This header is set on **all** responses, not just converted ones.
- **`ETag`** — a deterministic content hash of the Markdown output. Enables conditional requests (`If-None-Match`) so CDNs and clients can validate cached responses without re-downloading the full body.

To control cache lifetime, add `Cache-Control` at your infrastructure layer:

```ts
// Example: cache Markdown responses for 1 hour at the CDN
app.use((req, res, next) => {
    if (req.headers.accept?.includes('text/markdown')) {
        res.setHeader('cache-control', 'public, max-age=3600');
    }
    next();
});
app.use(markdown());
```

## Import Paths

Each middleware is a separate npm package:

```ts
// Express
import { markdown } from '@markdown-for-agents/express';

// Fastify
import { markdown } from '@markdown-for-agents/fastify';

// Hono — requires hono as peer dependency
import { markdown } from '@markdown-for-agents/hono';

// Next.js — requires next as peer dependency
import { withMarkdown, nextImageRule } from '@markdown-for-agents/nextjs';

// Generic Web Standard — no framework dependency
import { markdownMiddleware } from '@markdown-for-agents/web';
```

## How Each Middleware Intercepts Responses

| Framework    | Mechanism                                                       |
| ------------ | --------------------------------------------------------------- |
| Express      | Overrides `res.send()` to intercept the HTML body               |
| Fastify      | Uses the `onSend` hook to transform the payload                 |
| Hono         | Uses Hono's native `MiddlewareHandler` with `c.res` replacement |
| Next.js      | Wraps the route handler and replaces the `Response` object      |
| Web Standard | Wraps the `next` handler and replaces the `Response` object     |
