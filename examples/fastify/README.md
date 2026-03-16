# Fastify Example — markdown-for-agents

A complete Fastify app demonstrating the plugin pattern for [`@markdown-for-agents/fastify`](https://www.npmjs.com/package/@markdown-for-agents/fastify).

## How It Works

The Fastify plugin intercepts requests with `Accept: text/markdown` and converts HTML responses to Markdown automatically. Normal browser requests pass through untouched.

```ts
// src/index.ts
import Fastify from 'fastify';
import { markdown } from '@markdown-for-agents/fastify';

const app = Fastify();
app.register(markdown({ extract: true, deduplicate: true }));

app.get('/', (request, reply) => {
    reply.header('content-type', 'text/html');
    return reply.send('<h1>Hello</h1><p>World</p>');
});

app.listen({ port: 3000 });
```

## Running

```bash
# From the monorepo root
pnpm install
pnpm build

# Start the dev server
pnpm --filter @markdown-for-agents/example-fastify dev
```

## Testing

```bash
# Test with curl
curl http://localhost:3000/                                   # HTML
curl -H "Accept: text/markdown" http://localhost:3000/        # Markdown

# Run integration tests
pnpm --filter @markdown-for-agents/example-fastify test:integration
```

## Structure

```
src/
  index.ts                  # Fastify server with plugin
test/
  integration/              # Integration tests (starts real server)
```
