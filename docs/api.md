# API Reference

## Functions

### `convert(html, options?)`

Converts an HTML string to Markdown.

```ts
import { convert } from 'markdown-for-agents';

function convert(html: string, options?: ConvertOptions): ConvertResult;
```

**Parameters:**

- `html` — the HTML string to convert
- `options` — optional [ConvertOptions](#convertoptions)

**Returns:** [ConvertResult](#convertresult)

**Example:**

```ts
const { markdown, tokenEstimate } = convert('<h1>Hello</h1>', {
    extract: true,
    baseUrl: 'https://example.com'
});
```

---

### `createRule(filter, replacement, priority?)`

Creates a conversion rule.

```ts
import { createRule } from 'markdown-for-agents';

function createRule(filter: string | string[] | ((node: Element) => boolean), replacement: (context: RuleContext) => string | null | undefined, priority?: number): Rule;
```

**Parameters:**

- `filter` — tag name, array of tag names, or predicate function
- `replacement` — function that returns the Markdown string, `null` to remove, or `undefined` to fall through
- `priority` — rule priority (default: `100`). Higher runs first.

**Returns:** [Rule](#rule)

---

### `getDefaultRules()`

Returns the array of built-in conversion rules.

```ts
import { getDefaultRules } from 'markdown-for-agents';

function getDefaultRules(): Rule[];
```

The result is cached — subsequent calls return the same array.

---

### `extractContent(document, options?)`

Prunes a parsed DOM tree in-place, removing non-content elements.

```ts
import { extractContent } from 'markdown-for-agents/extract';

function extractContent(document: Document, options?: ExtractOptions): void;
```

**Parameters:**

- `document` — a [domhandler](https://github.com/fb55/domhandler) `Document` (from `htmlparser2`)
- `options` — optional [ExtractOptions](#extractoptions)

This mutates the document. Stripped elements are removed from the tree.

---

### `estimateTokens(text)`

Estimates token, character, and word counts for a string.

```ts
import { estimateTokens } from 'markdown-for-agents/tokens';

function estimateTokens(text: string): TokenEstimate;
```

Uses a ~4 characters per token heuristic.

---

### `markdownMiddleware(options?)`

Creates a Web Standard middleware that converts HTML responses to Markdown based on the `Accept` header.

```ts
import { markdownMiddleware } from '@markdown-for-agents/web';

function markdownMiddleware(options?: MiddlewareOptions): (request: Request, next: Handler) => Promise<Response>;
```

---

### `markdown(options?)` (Express)

Creates an Express middleware for content negotiation.

```ts
import { markdown } from '@markdown-for-agents/express';

function markdown(options?: MiddlewareOptions): ExpressMiddleware;
```

The middleware intercepts `res.send()`. When the client sends `Accept: text/markdown` and the response is HTML, the body is converted to Markdown.

---

### `markdown(options?)` (Fastify)

Creates a Fastify plugin that registers an `onSend` hook for content negotiation.

```ts
import { markdown } from '@markdown-for-agents/fastify';

function markdown(options?: MiddlewareOptions): FastifyPlugin;
```

Register it with `fastify.register(markdown())`. The plugin intercepts HTML responses when the client sends `Accept: text/markdown`.

---

### `markdown(options?)` (Hono)

Creates a Hono middleware for content negotiation.

```ts
import { markdown } from '@markdown-for-agents/hono';

function markdown(options?: MiddlewareOptions): MiddlewareHandler;
```

---

### `withMarkdown(handler, options?)` (Next.js)

Wraps a Next.js route handler with Markdown content negotiation. Automatically includes `nextImageRule` to unwrap `/_next/image` optimization URLs.

```ts
import { withMarkdown } from '@markdown-for-agents/nextjs';

function withMarkdown(handler: NextMiddleware, options?: MiddlewareOptions): NextMiddleware;
```

---

### `nextImageRule` (Next.js)

A conversion rule that extracts original image URLs from Next.js `/_next/image` optimization paths. Automatically included by `withMarkdown`, but can also be used standalone with the core `convert` function.

```ts
import { nextImageRule } from '@markdown-for-agents/nextjs';
import { convert } from 'markdown-for-agents';

// Standalone usage
const { markdown } = convert(html, { rules: [nextImageRule] });
```

Extracts the `url` query parameter from paths like `/_next/image?url=%2Fphoto.png&w=640&q=75` and produces `![alt](/photo.png)` instead of the optimized URL. Has priority `1` (higher than built-in rules).

---

## Types

### `ConvertOptions`

```ts
interface ConvertOptions {
    extract?: boolean | ExtractOptions;
    rules?: Rule[];
    baseUrl?: string;
    headingStyle?: 'atx' | 'setext';
    bulletChar?: '-' | '*' | '+';
    codeBlockStyle?: 'fenced' | 'indented';
    fenceChar?: '`' | '~';
    strongDelimiter?: '**' | '__';
    emDelimiter?: '*' | '_';
    linkStyle?: 'inlined' | 'referenced';
    deduplicate?: boolean | DeduplicateOptions;
    tokenCounter?: (text: string) => TokenEstimate;
}
```

| Property          | Type                              | Default            | Description                          |
| ----------------- | --------------------------------- | ------------------ | ------------------------------------ |
| `extract`         | `boolean \| ExtractOptions`       | `false`            | Enable content extraction            |
| `rules`           | `Rule[]`                          | `[]`               | Custom conversion rules              |
| `baseUrl`         | `string`                          | `""`               | Base URL for resolving relative URLs |
| `headingStyle`    | `"atx" \| "setext"`               | `"atx"`            | Heading format                       |
| `bulletChar`      | `"-" \| "*" \| "+"`               | `"-"`              | Unordered list bullet                |
| `codeBlockStyle`  | `"fenced" \| "indented"`          | `"fenced"`         | Code block format                    |
| `fenceChar`       | ``"`" \| "~"``                    | ``"`"``            | Fence character                      |
| `strongDelimiter` | `"**" \| "__"`                    | `"**"`             | Bold delimiter                       |
| `emDelimiter`     | `"*" \| "_"`                      | `"*"`              | Italic delimiter                     |
| `linkStyle`       | `"inlined" \| "referenced"`       | `"inlined"`        | Link format                          |
| `deduplicate`     | `boolean \| DeduplicateOptions`   | `false`            | Remove duplicate content blocks      |
| `tokenCounter`    | `(text: string) => TokenEstimate` | Built-in heuristic | Custom token counter (see below)     |

#### `tokenCounter`

Replace the built-in heuristic (~4 characters per token) with an exact tokenizer. The function receives the final markdown string and must return a [TokenEstimate](#tokenestimate).

```ts
import { encoding_for_model } from 'tiktoken';

const enc = encoding_for_model('gpt-4o');

const { tokenEstimate } = convert(html, {
    tokenCounter: text => ({
        tokens: enc.encode(text).length,
        characters: text.length,
        words: text.split(/\s+/).filter(Boolean).length
    })
});
```

When used with middleware, the custom counter's `tokens` value is used for the `x-markdown-tokens` response header.

---

### `ConvertResult`

```ts
interface ConvertResult {
    markdown: string;
    tokenEstimate: TokenEstimate;
}
```

---

### `Rule`

```ts
interface Rule {
    filter: string | string[] | ((node: Element) => boolean);
    replacement: (context: RuleContext) => string | null | undefined;
    priority?: number;
}
```

- `filter` — determines which elements the rule applies to
- `replacement` — produces the Markdown output. Return `null` to remove, `undefined` to fall through.
- `priority` — higher priority rules are checked first. Default: `0` for built-in rules, `100` for `createRule`.

---

### `RuleContext`

```ts
interface RuleContext {
    node: Element;
    parent: Element | Document | null;
    convertChildren: (node: Element | Document) => string;
    options: ResolvedOptions;
    listDepth: number;
    insidePre: boolean;
    insideTable: boolean;
    siblingIndex: number;
}
```

| Property          | Type                          | Description                                    |
| ----------------- | ----------------------------- | ---------------------------------------------- |
| `node`            | `Element`                     | The current DOM element                        |
| `parent`          | `Element \| Document \| null` | Parent node                                    |
| `convertChildren` | `(node) => string`            | Recursively convert children                   |
| `options`         | `ResolvedOptions`             | Resolved converter options                     |
| `listDepth`       | `number`                      | Current list nesting depth (0 = not in list)   |
| `insidePre`       | `boolean`                     | Whether inside a `<pre>` element               |
| `insideTable`     | `boolean`                     | Whether inside a `<table>` element             |
| `siblingIndex`    | `number`                      | Index of this node among its parent's children |

---

### `ExtractOptions`

```ts
interface ExtractOptions {
    stripTags?: string[];
    stripClasses?: (string | RegExp)[];
    stripRoles?: string[];
    stripIds?: (string | RegExp)[];
    keepHeader?: boolean;
    keepFooter?: boolean;
    keepNav?: boolean;
}
```

| Property       | Type                   | Default | Description                        |
| -------------- | ---------------------- | ------- | ---------------------------------- |
| `stripTags`    | `string[]`             | `[]`    | Additional tags to strip           |
| `stripClasses` | `(string \| RegExp)[]` | `[]`    | Additional class patterns to strip |
| `stripRoles`   | `string[]`             | `[]`    | Additional ARIA roles to strip     |
| `stripIds`     | `(string \| RegExp)[]` | `[]`    | Additional ID patterns to strip    |
| `keepHeader`   | `boolean`              | `false` | Keep `<header>` elements           |
| `keepFooter`   | `boolean`              | `false` | Keep `<footer>` elements           |
| `keepNav`      | `boolean`              | `false` | Keep `<nav>` elements              |

---

### `DeduplicateOptions`

```ts
interface DeduplicateOptions {
    minLength?: number;
}
```

| Property    | Type     | Default | Description                                                     |
| ----------- | -------- | ------- | --------------------------------------------------------------- |
| `minLength` | `number` | `10`    | Minimum block length (in characters) eligible for deduplication |

Blocks shorter than `minLength` are always kept, which protects separators (`---`), short headings, and formatting elements. Lower it to catch short repeated phrases like "Read more"; raise it for more conservative deduplication.

---

### `TokenEstimate`

```ts
interface TokenEstimate {
    tokens: number;
    characters: number;
    words: number;
}
```

---

### `MiddlewareOptions`

```ts
interface MiddlewareOptions extends ConvertOptions {
    tokenHeader?: string;
}
```

Extends `ConvertOptions` with:

| Property      | Type     | Default               | Description                          |
| ------------- | -------- | --------------------- | ------------------------------------ |
| `tokenHeader` | `string` | `"x-markdown-tokens"` | Response header name for token count |

---

### `ResolvedOptions`

```ts
type ResolvedOptions = Required<Omit<ConvertOptions, 'extract' | 'rules'>> & {
    extract: boolean | ExtractOptions;
    rules: Rule[];
};
```

The fully resolved options object with all defaults applied. This is what rules receive in their context.
