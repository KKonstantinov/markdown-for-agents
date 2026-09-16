# SvelteKit Example - markdown-for-agents

A minimal SvelteKit app demonstrating site-wide conversion with [`@markdown-for-agents/sveltekit`](https://www.npmjs.com/package/@markdown-for-agents/sveltekit).

## How It Works

The app uses a SvelteKit `handle` hook. The hook calls `resolve(event)` normally, then converts HTML responses only when the request includes `Accept: text/markdown`.

```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import { markdown } from '@markdown-for-agents/sveltekit';

export const handle = sequence(
    authHandle,
    markdown({
        extract: true,
        baseUrl: 'https://example.com'
    })
);
```

Normal browser requests, JSON endpoints, redirects, and assets pass through without conversion work.

## Running

```bash
# From the monorepo root
pnpm install
pnpm build

# Start the dev server
pnpm --filter @markdown-for-agents/example-sveltekit dev
```

## Testing

```bash
curl http://localhost:5173/
curl -H "Accept: text/markdown" http://localhost:5173/

pnpm --filter @markdown-for-agents/example-sveltekit test:integration
```
