---
name: markdown-for-agents
description: HTML to Markdown conversion for AI agents with the markdown-for-agents library (npm and PyPI). Use when reading a web page or URL as clean Markdown to save tokens, when converting or scraping HTML to Markdown for an LLM in TypeScript, JavaScript or Python, when stripping nav, ads, sidebars or cookie banners from page content, when serving Markdown to AI agents that send an Accept text/markdown header (Express, Fastify, Hono, Next.js, SvelteKit, Cloudflare Workers, Deno, Bun, FastAPI, Flask, Django), or when measuring HTML vs Markdown token savings.
license: MIT
metadata:
    author: KKonstantinov
    homepage: https://markdown-for-agents.vercel.app/docs
---

# markdown-for-agents

Converts HTML into clean, token-efficient Markdown: strips boilerplate, resolves relative links, prepends page metadata as frontmatter, and estimates tokens.

Two native implementations of the same conversion API - **do not bridge one to the other**:

- **TypeScript/JavaScript:** `npm install markdown-for-agents` (Node 22+, Bun, Deno, Cloudflare Workers, browsers; ESM only)
- **Python:** `pip install markdown-for-agents` (3.12+, zero dependencies, snake_case API)

## Pick the job

| Goal                                               | Go to                                                 |
| -------------------------------------------------- | ----------------------------------------------------- |
| Read a URL as Markdown right now, no project setup | [Read a web page](#read-a-web-page-no-install)        |
| Convert HTML inside an app or scraper              | [Convert in code](#convert-in-code)                   |
| Make a site return Markdown when agents ask for it | [Serve Markdown to agents](#serve-markdown-to-agents) |
| Show how many tokens a page wastes as HTML         | `npx -y @markdown-for-agents/audit <url>`             |

## Read a web page (no install)

```bash
npx -y @markdown-for-agents/audit https://example.com/docs/guide --output page.md
```

Then read `page.md`. Needs Node 22+. The CLI fetches the page as HTML, extracts the main content, resolves relative links against the URL, and prints a token stats table (HTML vs Markdown) to stdout.

- `--output <file>` writes just the Markdown to the file. Avoid `--print`: it mixes the stats table and the Markdown on stdout.
- `--json` prints `{ url, html, markdown: { content, bytes, tokens }, reduction }`; the Markdown is at `.markdown.content`.
- `--no-extract` keeps nav, header, footer and sidebars. Use it when the output is missing content you need.
- Those four flags are the whole CLI. For anything else (no frontmatter, `keepNav`, deduplication, extra strip patterns), save the HTML with `curl -sL <url> -o page.html` and use a one-liner below, adding options.
- Near-empty output usually means a client-rendered page (the fetch only saw the JS shell). Get the rendered HTML with a browser tool, save it, and convert the file.

Prefer this over a site's own Markdown (`curl -H 'Accept: text/markdown'`): that is not boilerplate-stripped and can be several times larger.

Convert an HTML file without creating a project:

```bash
# Python via uv
uv run --no-project --with markdown-for-agents python -c 'import sys; from markdown_for_agents import convert; print(convert(open(sys.argv[1]).read(), extract=True, base_url=sys.argv[2]).markdown)' page.html https://example.com

# Deno
deno eval 'import { convert } from "npm:markdown-for-agents"; console.log(convert(await Deno.readTextFile(Deno.args[0]), { extract: true, baseUrl: Deno.args[1] }).markdown)' page.html https://example.com
```

## Convert in code

`convert(html, options?)` is **synchronous** and returns an object, not a string.

```ts
import { convert } from 'markdown-for-agents';

const res = await fetch(url);
const { markdown, tokenEstimate } = convert(await res.text(), {
    extract: true, // strip boilerplate, see Extraction below
    baseUrl: res.url, // resolve relative links and images
    frontmatter: false, // default true: prepends YAML title/description/image from <head>
    deduplicate: true // drop repeated blocks
});
console.log(tokenEstimate.tokens);
```

```python
from markdown_for_agents import convert

result = convert(html, extract=True, base_url=url, frontmatter=False, deduplicate=True)
print(result.markdown, result.token_estimate.tokens)
```

Result: `markdown`, `tokenEstimate` (`{ tokens, characters, words }`, ~4 chars per token heuristic), `contentHash` (stable, usable as ETag or cache key), `convertDuration` (only with `serverTiming: true`). Python uses the same names in snake_case.

TypeScript types exported from `markdown-for-agents`: `ConvertOptions`, `ConvertResult`, `ExtractOptions`, `DeduplicateOptions`, `Rule`, `RuleContext`, `TokenEstimate`, `MiddlewareOptions`.

### Options

| TypeScript                                                                                           | Python                 | Default                                       | Notes                                                                          |
| ---------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| `extract`                                                                                            | `extract`              | `false`                                       | `true` or `ExtractOptions` (below)                                             |
| `baseUrl`                                                                                            | `base_url`             | `''`                                          | Makes relative `href`/`src` absolute                                           |
| `frontmatter`                                                                                        | `frontmatter`          | `true`                                        | `false` disables; an object/dict merges and overrides fields                   |
| `deduplicate`                                                                                        | `deduplicate`          | `false`                                       | `true`, or `{ minLength }` / `DeduplicateOptions(min_length=...)` (default 10) |
| `rules`                                                                                              | `rules`                | `[]`                                          | Custom element handlers, see below                                             |
| `tokenCounter`                                                                                       | `token_counter`        | heuristic                                     | `(text) => ({ tokens, characters, words })`, e.g. backed by tiktoken           |
| `serverTiming`                                                                                       | `server_timing`        | `false`                                       | Populates `convertDuration`                                                    |
| `headingStyle` `bulletChar` `codeBlockStyle` `fenceChar` `strongDelimiter` `emDelimiter` `linkStyle` | snake_case equivalents | `atx` `-` `fenced` `` ` `` `**` `*` `inlined` | Output style; `linkStyle: 'referenced'` emits `[text][1]` footnote links       |

### Extraction

`extract: true` removes:

- **Tags:** `nav`, `header`, `footer`, `aside`, `script`, `style`, `noscript`, `template`, `iframe`, `svg`, `form`
- **Hidden:** any `hidden` attribute, `aria-hidden="true"`
- **Roles:** `navigation`, `banner`, `contentinfo`, `complementary`, `search`, `menu`, `menubar`
- **Classes** (case-insensitive, matched at a word start): ad/ads, sidebar, widget, cookie, popup, modal, breadcrumb, footnote, share, social, newsletter, comment, related, cta, call-to-action, author-bio/card, avatar, pagination, pager, prev-next, post-nav, article-nav, back-link
- **IDs:** ad/ads, sidebar, cookie, popup, modal

`ExtractOptions` (Python: same names in snake_case):

- `keepNav`, `keepHeader`, `keepFooter`, `keepHidden` spare those **tags** only. `keepNav` does not spare `role="navigation"`, `<aside>`, `.sidebar`, or a `<nav>` inside a stripped parent; if a docs sidebar is still missing, use `extract: false`.
- `stripTags`, `stripClasses`, `stripRoles`, `stripIds` **add to** the defaults. Your string patterns are case-sensitive substring matches; TypeScript also accepts RegExp.
- Vendor consent dialogs that do not start a word with "cookie" need an explicit entry, e.g. `stripIds: ['onetrust', 'CybotCookiebotDialog']`.

### Custom rules

```ts
import { convert, createRule } from 'markdown-for-agents';

// createRule(filter, replacement, priority = 100)
const callout = createRule(
    node => node.name === 'div' && (node.attribs.class ?? '').split(/\s+/).includes('callout'),
    ({ node, convertChildren }) => {
        const body = `**Note:** ${convertChildren(node).trim()}`.replace(/\n{3,}/g, '\n\n');
        return `\n\n${body.replace(/^/gm, '> ')}\n\n`; // quote every line, not only the first
    }
);
const { markdown } = convert(html, { rules: [callout] });
```

```python
import re

from markdown_for_agents import convert, create_rule


def callout_md(ctx):
    body = re.sub(r"\n{3,}", "\n\n", f"**Note:** {ctx.convert_children(ctx.node).strip()}")
    return "\n\n" + "\n".join(f"> {line}" for line in body.splitlines()) + "\n\n"


callout = create_rule(  # priority=100 by default
    filter=lambda node: node.name == "div" and "callout" in node.attribs.get("class", "").split(),
    replacement=callout_md,
)
result = convert(html, rules=[callout])
```

- **Filter:** tag name, list of tag names, or predicate on the element (a domhandler `Element`: `node.name`, `node.attribs`, `node.children`).
- **Context:** `node`, `parent`, `convertChildren`, `options`, `listDepth`, `insidePre`, `insideTable`, `siblingIndex`. There is no `content` field: call `convertChildren(node)` for the inner Markdown.
- **Return:** a string replaces the element, `null`/`None` removes it, `undefined` falls through to the next matching rule (Python: `from markdown_for_agents import SKIP` and return `SKIP`).
- **Priority:** higher runs first. `createRule` defaults to 100, built-in rules are 0.

## Serve Markdown to agents

Use the adapter for your framework; do not hand-roll Accept parsing or the headers. Each adapter converts only `text/html` responses to requests whose `Accept` includes `text/markdown`, passes everything else through, and sets `Content-Type: text/markdown; charset=utf-8`, `ETag`, `x-markdown-tokens`, and `Vary: Accept` on every response it handles. The adapter pulls in the core package; add `markdown-for-agents` as a direct dependency only if you import from it yourself (e.g. `createRule`).

| Framework                       | Package                                      | Wire-up                                                                  |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| Express                         | `@markdown-for-agents/express`               | `app.use(markdown({ extract: true }))` before routes; see the note below |
| Fastify                         | `@markdown-for-agents/fastify`               | `fastify.register(markdown({ extract: true }))`                          |
| Hono                            | `@markdown-for-agents/hono`                  | `app.use(markdown({ extract: true }))`                                   |
| SvelteKit                       | `@markdown-for-agents/sveltekit`             | `export const handle = sequence(authHandle, markdown())`                 |
| Workers, Deno, Bun, any `fetch` | `@markdown-for-agents/web`                   | `markdownMiddleware(opts)(request, next)`                                |
| Next.js                         | `@markdown-for-agents/nextjs`                | Proxy pattern below                                                      |
| FastAPI / Starlette             | `pip install "markdown-for-agents[fastapi]"` | `app.add_middleware(MarkdownMiddleware, options=MiddlewareOptions(...))` |
| Flask                           | `pip install "markdown-for-agents[flask]"`   | `markdown_after_request(app, options=MiddlewareOptions(...))`            |
| Django                          | `pip install "markdown-for-agents[django]"`  | Add to `MIDDLEWARE`; subclass to pass options                            |

**Express:** the adapter only converts when `Content-Type` is already `text/html` at `res.send()` time, and Express sets it later. Call `res.type('html')` first: `res.type('html').send(html)` or `res.type('html').render('view', data)`. A bare `res.send(html)` or `res.render(...)` reaches agents as HTML.

Adapters accept every convert option plus `contentSignal` (`{ aiTrain, search, aiInput }`, emits a `content-signal` header), `tokenHeader` and `timingHeader` (Python: `content_signal`, `token_header`, `timing_header`). The adapters never set `Cache-Control`. Full per-framework code: [references/middleware.md](references/middleware.md).

### Next.js

Next.js proxy runs before rendering and cannot read the page body, so `withMarkdown` must wrap a handler that fetches the page as HTML. Guard on the `Accept` header first: the inner fetch re-enters the proxy with `accept: text/html` and takes the early return, which prevents a loop.

```ts
// proxy.ts (Next.js 16+). On Next.js 14/15 use middleware.ts and `export async function middleware`.
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';
import { withMarkdown } from '@markdown-for-agents/nextjs';

export async function proxy(request: NextRequest, event: NextFetchEvent) {
    if (!(request.headers.get('accept') ?? '').includes('text/markdown')) {
        return NextResponse.next();
    }
    const handler = withMarkdown(req => fetch(req.url, { headers: { accept: 'text/html' } }), {
        extract: true,
        baseUrl: request.nextUrl.origin
    });
    return (await handler(request, event)) ?? NextResponse.next();
}

export const config = { matcher: ['/', '/blog/:path*', '/docs/:path*'] };
```

- Each Markdown request renders the page twice (cheap for static/ISR pages); keep `matcher` to content routes.
- The inner fetch sends no cookies, so pages render as for a logged-out visitor.
- HTML responses take the early return and never reach the adapter, so they do not get `Vary: Accept`. Behind a shared cache or CDN, make the cache key include `Accept` or bypass the cache for `Accept: text/markdown`.
- `withMarkdown` automatically unwraps `/_next/image?url=...` to the original image path.

## Common mistakes

| Mistake                                                  | Fix                                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `extract: { stripNav: false }` or similar invented flags | `extract: { keepNav: true }` (also `keepHeader`, `keepFooter`, `keepHidden`)          |
| `replacement: ({ content }) => ...`                      | `({ node, convertChildren }) => convertChildren(node)`                                |
| `await convert(...)` or treating the result as a string  | `convert` is sync; read `.markdown`                                                   |
| Custom rules for ordinary cookie banners or ads          | `extract: true` strips them; add `stripIds`/`stripClasses` only for vendor-named ones |
| Shelling out to Node from Python, or vice versa          | Use the native package for your language                                              |
| Hand-written middleware for Accept, `Vary`, `ETag`       | Use the framework adapter                                                             |
| Express route returns HTML but agents still get HTML     | `res.type('html')` before `send()` or `render()`                                      |
| Next.js: `export const proxy = withMarkdown()`           | Wrap a fetch handler and return early for non-Markdown requests (see above)           |
| Unexpected `---\ntitle: ...\n---` block at the top       | Frontmatter is on by default; pass `frontmatter: false`                               |
| Docs sidebar or table of contents missing                | `extract: { keepNav: true }`; if it is an `<aside>` or `.sidebar`, `extract: false`   |
| Parsing `audit --print` output                           | Use `--output <file>` or `--json`                                                     |

Docs: https://markdown-for-agents.vercel.app/docs - Playground: https://markdown-for-agents.vercel.app/playground
