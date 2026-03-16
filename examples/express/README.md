# Express Example — markdown-for-agents

A complete Express app demonstrating the middleware pattern for [`@markdown-for-agents/express`](https://www.npmjs.com/package/@markdown-for-agents/express).

## How It Works

The Express middleware intercepts requests with `Accept: text/markdown` and converts HTML responses to Markdown automatically. Normal browser requests pass through untouched.

```ts
// src/index.ts
import express from 'express';
import { markdown } from '@markdown-for-agents/express';

const app = express();
app.use(markdown({ extract: true, deduplicate: true }));

app.get('/', (req, res) => {
    res.type('html').send('<h1>Hello</h1><p>World</p>');
});

app.listen(3000);
```

## Running

```bash
# From the monorepo root
pnpm install
pnpm build

# Start the dev server
pnpm --filter @markdown-for-agents/example-express dev
```

## Testing

```bash
# Test with curl
curl http://localhost:3000/                                   # HTML
curl -H "Accept: text/markdown" http://localhost:3000/        # Markdown

# Run integration tests
pnpm --filter @markdown-for-agents/example-express test:integration
```

## Structure

```
src/
  index.ts                  # Express server with middleware
test/
  integration/              # Integration tests (starts real server)
```
