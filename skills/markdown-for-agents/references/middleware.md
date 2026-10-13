# Middleware reference

Every adapter checks the request's `Accept` header. When it includes `text/markdown` and the response is `text/html`, the HTML body is converted. Everything else (browser requests, JSON, assets, redirects) passes through unchanged.

## Response headers

| Header              | When                   | Value                                                                                |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| `Content-Type`      | Converted responses    | `text/markdown; charset=utf-8`                                                       |
| `Vary`              | Every handled response | `Accept`, so caches keep HTML and Markdown apart (not the Next.js early-return path) |
| `ETag`              | Converted responses    | `"<contentHash>"` of the Markdown, enables `If-None-Match`                           |
| `x-markdown-tokens` | Converted responses    | Estimated token count (rename with `tokenHeader`)                                    |
| `content-signal`    | `contentSignal` set    | e.g. `ai-train=yes, search=yes, ai-input=yes`                                        |
| `Server-Timing`     | `serverTiming: true`   | `mfa.convert;dur=4.7;desc="HTML to Markdown"`                                        |
| `x-markdown-timing` | `serverTiming: true`   | Same as `Server-Timing` but survives CDN caching (rename with `timingHeader`)        |

The adapters do not set `Cache-Control`; add it yourself if a CDN should cache Markdown responses.

Verify any setup with:

```bash
curl -i http://localhost:3000/                              # HTML, Vary: Accept
curl -i -H 'Accept: text/markdown' http://localhost:3000/   # Markdown, x-markdown-tokens, ETag
```

## TypeScript options

`MiddlewareOptions` = every `convert()` option (`extract`, `baseUrl`, `rules`, `deduplicate`, `frontmatter`, `serverTiming`, ...) plus:

```ts
{
    tokenHeader?: string; // default 'x-markdown-tokens'
    timingHeader?: string; // default 'x-markdown-timing'
    contentSignal?: { aiTrain?: boolean; search?: boolean; aiInput?: boolean }; // only fields you set are emitted
}
```

## Express

```ts
import express from 'express';
import { markdown } from '@markdown-for-agents/express';

const app = express();
app.use(markdown({ extract: true, deduplicate: true })); // register before routes
app.get('/', (req, res) => res.type('html').send('<main><h1>Article</h1><p>Content</p></main>'));
app.get('/post/:slug', (req, res) => res.type('html').render('post', { slug: req.params.slug }));
app.listen(3000);
```

Intercepts `res.send()` for string bodies, and only when the `Content-Type` is already `text/html` at that point. Express normally fills in the type inside `send()` itself, so a bare `res.send('<h1>..</h1>')` or `res.render()` passes through unconverted: call `res.type('html')` first. Do not set `text/html` globally in a middleware: `res.json()` keeps an existing type, so JSON routes would be converted. Streams, `res.sendFile()` and `express.static` files are not converted.

## Fastify

```ts
import Fastify from 'fastify';
import { markdown } from '@markdown-for-agents/fastify';

const fastify = Fastify();
fastify.register(markdown({ extract: true }));
fastify.get('/', async (request, reply) => {
    reply.type('text/html');
    return '<main><h1>Article</h1></main>';
});
await fastify.listen({ port: 3000 });
```

Uses the `onSend` hook.

## Hono

```ts
import { Hono } from 'hono';
import { markdown } from '@markdown-for-agents/hono';

const app = new Hono();
app.use(markdown({ extract: true }));
app.get('/', c => c.html('<main><h1>Article</h1></main>'));
export default app;
```

## SvelteKit

```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import { markdown } from '@markdown-for-agents/sveltekit';

export const handle = sequence(authHandle, markdown({ extract: true, deduplicate: true }));
```

Place `markdown()` after hooks that authenticate, populate `event.locals`, localize or rewrite, so the right HTML is rendered before conversion. Extra option: `resolveOptions` is forwarded to `resolve(event, options)` (e.g. `transformPageChunk`).

## Web Standard (Cloudflare Workers, Deno, Bun)

```ts
import { markdownMiddleware } from '@markdown-for-agents/web';

const mw = markdownMiddleware({ extract: true });

// Cloudflare Workers
export default {
    async fetch(request: Request): Promise<Response> {
        return mw(request, async req => new Response(await renderPage(req), { headers: { 'content-type': 'text/html' } }));
    }
};

// Deno
Deno.serve(request => mw(request, async () => new Response('<h1>Hi</h1>', { headers: { 'content-type': 'text/html' } })));

// Bun
Bun.serve({ fetch: request => mw(request, async () => new Response('<h1>Hi</h1>', { headers: { 'content-type': 'text/html' } })) });
```

`mw(request, next)` calls `next(request)` to get the HTML `Response`, then converts it when appropriate.

## Next.js

See the proxy example in `SKILL.md`. Points that matter:

- The proxy cannot see the rendered body, so the handler passed to `withMarkdown` must `fetch` the page with `accept: 'text/html'`.
- Return `NextResponse.next()` early for requests without `text/markdown` in `Accept`. This is also what stops the inner fetch from looping.
- Those early-return HTML responses never reach the adapter, so they lack `Vary: Accept`. Behind a shared cache, key on `Accept` or bypass the cache for Markdown requests.
- The inner fetch sends no cookies, so pages render as for a logged-out visitor. Forward specific headers if needed, but never the original `Accept`.
- If you already have a proxy (auth, i18n), merge into it; Next.js allows only one. Put the Markdown branch first.
- `withMarkdown(handler, options)` returns a function with the proxy signature `(request, event)`. Call it; do not export it bare.
- Pass `baseUrl: request.nextUrl.origin` so links resolve to absolute URLs.
- With `serverTiming: true` the timing headers include `mfa.fetch` (self-fetch time) as well as `mfa.convert`.
- `nextImageRule` (exported) unwraps `/_next/image?url=...`; `withMarkdown` already includes it. Use it directly with `convert(html, { rules: [nextImageRule] })` if needed.
- Route handler variant: `export const GET = withMarkdown(handler, { extract: true })` where `handler` returns an HTML `Response`.

## Python

Options use `MiddlewareOptions` (frozen dataclass, snake_case): every convert option plus `token_header`, `timing_header`, `content_signal=ContentSignalOptions(ai_train=..., search=..., ai_input=...)`.

```python
from markdown_for_agents import ContentSignalOptions, ExtractOptions, MiddlewareOptions

options = MiddlewareOptions(
    extract=ExtractOptions(keep_nav=True),
    deduplicate=True,
    content_signal=ContentSignalOptions(ai_train=False, search=True, ai_input=True),
)
```

### FastAPI / Starlette

```python
from fastapi import FastAPI
from markdown_for_agents.middleware.fastapi import MarkdownMiddleware

app = FastAPI()
app.add_middleware(MarkdownMiddleware, options=options)
```

### Flask

```python
from flask import Flask
from markdown_for_agents.middleware.flask import markdown_after_request

app = Flask(__name__)
markdown_after_request(app, options=options)
```

### Django

Default options:

```python
# settings.py
MIDDLEWARE = [
    # ...
    "markdown_for_agents.middleware.django.MarkdownMiddleware",
]
```

Django constructs middleware with only `get_response`, so subclass to pass options and list your subclass in `MIDDLEWARE` instead:

```python
# myapp/middleware.py
from markdown_for_agents import MiddlewareOptions
from markdown_for_agents.middleware.django import MarkdownMiddleware


class AgentMarkdownMiddleware(MarkdownMiddleware):
    def __init__(self, get_response):
        super().__init__(get_response, MiddlewareOptions(extract=True))
```
