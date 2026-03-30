# @markdown-for-agents/audit

[![npm version](https://img.shields.io/npm/v/@markdown-for-agents/audit)](https://www.npmjs.com/package/@markdown-for-agents/audit) [![npm downloads](https://img.shields.io/npm/dm/@markdown-for-agents/audit)](https://www.npmjs.com/package/@markdown-for-agents/audit)
[![types](https://img.shields.io/npm/types/@markdown-for-agents/audit)](https://www.npmjs.com/package/@markdown-for-agents/audit) [![license](https://img.shields.io/npm/l/@markdown-for-agents/audit)](https://github.com/KKonstantinov/markdown-for-agents/blob/main/LICENSE)

Audit token savings when converting HTML to Markdown with [markdown-for-agents](https://www.npmjs.com/package/markdown-for-agents) — a runtime-agnostic HTML to Markdown converter built for AI agents.

![markdown-for-agents](https://raw.githubusercontent.com/KKonstantinov/markdown-for-agents/main/packages/site/public/markdown_for_agents_header.png)

Audit any URL — no installation required:

```bash
npx @markdown-for-agents/audit https://docs.github.com/en/copilot/get-started/quickstart
```

```
           HTML            Markdown        Savings
───────────────────────────────────────────────────
Tokens     138,550         9,364           -93.2%
Chars      554,200         37,456          -93.2%
Words      27,123          4,044
Size       541.3 KB        36.6 KB         -93.2%
```

Fetch any URL, convert the HTML to Markdown, and see exactly how many bytes and tokens you save. Useful for evaluating the impact of serving Markdown to AI agents instead of raw HTML.

## Quick Start

No installation required — run directly with `npx`:

```bash
npx @markdown-for-agents/audit https://example.com
```

```
           HTML            Markdown        Savings
───────────────────────────────────────────────────
Tokens     48,291          12,073          -75.0%
Chars      193,164         48,292          -75.0%
Words      9,456           5,209
Size       188.6 KB        47.2 KB         -75.0%
```

### Options

```
npx @markdown-for-agents/audit <url> [options]

  --no-extract    Skip content extraction
  --json          Output as JSON
  --print         Print converted Markdown to terminal
  --output <file> Save converted Markdown to file
  -h, --help      Show help
```

## Programmatic API

```ts
import { audit } from '@markdown-for-agents/audit';

const result = await audit('https://example.com', { extract: true });

console.log(result.reduction.tokenPercent); // e.g. 82.6
console.log(result.markdown.content); // converted markdown
```

### Result shape

```ts
{
    url: string;
    html: {
        bytes: number;
        tokens: TokenEstimate;
    }
    markdown: {
        content: string;
        bytes: number;
        tokens: TokenEstimate;
    }
    reduction: {
        bytes: number;
        bytePercent: number;
        tokens: number;
        tokenPercent: number;
    }
}
```

### Options

Accepts all [`markdown-for-agents` options](https://www.npmjs.com/package/markdown-for-agents#options), plus:

- `fetchOptions` — passed directly to `fetch()` for custom headers, auth, etc.

## Related packages

| Package                                                                                      | Description                     |
| -------------------------------------------------------------------------------------------- | ------------------------------- |
| [`markdown-for-agents`](https://www.npmjs.com/package/markdown-for-agents)                   | Core HTML-to-Markdown converter |
| [`@markdown-for-agents/express`](https://www.npmjs.com/package/@markdown-for-agents/express) | Express middleware              |
| [`@markdown-for-agents/fastify`](https://www.npmjs.com/package/@markdown-for-agents/fastify) | Fastify plugin                  |
| [`@markdown-for-agents/hono`](https://www.npmjs.com/package/@markdown-for-agents/hono)       | Hono middleware                 |
| [`@markdown-for-agents/nextjs`](https://www.npmjs.com/package/@markdown-for-agents/nextjs)   | Next.js middleware              |
| [`@markdown-for-agents/web`](https://www.npmjs.com/package/@markdown-for-agents/web)         | Web Standard middleware         |

## License

MIT
