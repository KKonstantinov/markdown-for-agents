---
layout: home

hero:
    name: markdown-for-agents
    tagline: Runtime-agnostic HTML to Markdown converter built for AI agents. One dependency, works everywhere.
    actions:
        - theme: brand
          text: Get Started
          link: /getting-started
        - theme: alt
          text: API Reference
          link: /api
        - theme: alt
          text: GitHub
          link: https://github.com/KKonstantinov/markdown-for-agents

features:
    - title: Runtime-agnostic
      details: Node.js, Bun, Deno, Cloudflare Workers, Vercel Edge, browsers — works everywhere.
    - title: Content Extraction
      details: Strip navigation, ads, sidebars, and cookie banners automatically to get just the main content.
    - title: Framework Middleware
      details: Drop-in support for Express, Fastify, Hono, Next.js, and any Web Standard server.
    - title: Single Dependency
      details: Only htmlparser2 — no DOM required. ESM only, fully typed, tree-shakeable.
---

## Quick Start

```bash
npm install markdown-for-agents
```

```ts
import { convert } from 'markdown-for-agents';

const { markdown, tokenEstimate } = convert(html);
```
