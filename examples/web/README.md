# Web Standard Example — markdown-for-agents

A complete Web Standard (Request/Response) app demonstrating the middleware pattern for [`@markdown-for-agents/web`](https://www.npmjs.com/package/@markdown-for-agents/web). This pattern works on Cloudflare Workers, Deno, Bun, and Node.js.

## How It Works

The Web Standard middleware wraps your request handler. When a client sends `Accept: text/markdown`, the HTML response is automatically converted to Markdown. Normal browser requests pass through untouched.

```ts
// src/index.ts
import { markdownMiddleware } from '@markdown-for-agents/web';

const mw = markdownMiddleware({ extract: true, deduplicate: true });

function handler(request: Request): Response {
    return new Response('<h1>Hello</h1><p>World</p>', {
        headers: { 'content-type': 'text/html' }
    });
}

// Use with any Web Standard compatible runtime
const response = await mw(request, async () => handler(request));
```

## Running

```bash
# From the monorepo root
pnpm install
pnpm build

# Start the dev server (Node.js)
pnpm --filter @markdown-for-agents/example-web dev
```

## Testing

```bash
# Test with curl
curl http://localhost:3000/                                   # HTML
curl -H "Accept: text/markdown" http://localhost:3000/        # Markdown

# Run integration tests
pnpm --filter @markdown-for-agents/example-web test:integration
```

## Structure

```
src/
  index.ts                  # Node.js server with Web Standard middleware
test/
  integration/              # Integration tests (starts real server)
```
