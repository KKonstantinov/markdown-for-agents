# Hono Example — markdown-for-agents

A complete Hono app demonstrating the middleware pattern for [`@markdown-for-agents/hono`](https://www.npmjs.com/package/@markdown-for-agents/hono).

## How It Works

The Hono middleware intercepts requests with `Accept: text/markdown` and converts HTML responses to Markdown automatically. Normal browser requests pass through untouched.

```ts
// src/index.ts
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { markdown } from '@markdown-for-agents/hono';

const app = new Hono();
app.use(markdown({ extract: true, deduplicate: true }));

app.get('/', c => {
    return c.html('<h1>Hello</h1><p>World</p>');
});

serve({ fetch: app.fetch, port: 3000 });
```

## Running

```bash
# From the monorepo root
pnpm install
pnpm build

# Start the dev server
pnpm --filter @markdown-for-agents/example-hono dev
```

## Testing

```bash
# Test with curl
curl http://localhost:3000/                                   # HTML
curl -H "Accept: text/markdown" http://localhost:3000/        # Markdown

# Run integration tests
pnpm --filter @markdown-for-agents/example-hono test:integration
```

## Structure

```
src/
  index.ts                  # Hono server with middleware
test/
  integration/              # Integration tests (starts real server)
```
