# Custom Rules

The rule system lets you override how any HTML element is converted to Markdown, or add support for elements the library doesn't handle by default.

## How Rules Work

The converter walks the DOM tree and, for each element, checks rules in priority order (highest first). The first rule whose filter matches and whose replacement returns a non-`undefined` value wins.

- **Return a string** — use it as the Markdown output for this element
- **Return `null`** — remove the element from the output entirely
- **Return `undefined`** — skip this rule and try the next one (fall-through)

## Creating Rules

### With `createRule`

```ts
import { convert, createRule } from 'markdown-for-agents';

const calloutRule = createRule(
    'div', // filter
    ({ node, convertChildren }) => {
        if (!node.attribs.class?.includes('callout')) return undefined; // fall through
        const content = convertChildren(node).trim();
        return `\n\n> **Note:** ${content}\n\n`;
    }
    // priority (optional, default: 100)
);

const { markdown } = convert(html, { rules: [calloutRule] });
```

`createRule(filter, replacement, priority?)` is a convenience helper. The default priority of 100 ensures custom rules run before the built-in rules (which have priority 0).

### With Object Literal

```ts
const { markdown } = convert(html, {
    rules: [
        {
            filter: 'div',
            replacement: ({ node, convertChildren }) => {
                if (!node.attribs.class?.includes('callout')) return undefined;
                return `\n\n> ${convertChildren(node).trim()}\n\n`;
            },
            priority: 10
        }
    ]
});
```

## Filters

A filter determines which elements a rule applies to. Three forms are supported:

### Tag Name (string)

```ts
{
    filter: 'div';
}
```

### Multiple Tag Names (string array)

```ts
{
    filter: ['section', 'article'];
}
```

### Predicate Function

```ts
{
  filter: (node) =>
    node.name === "div" && node.attribs.class?.includes("highlight"),
}
```

The predicate receives a [domhandler `Element`](https://github.com/fb55/domhandler) node. You can inspect `name`, `attribs`, `children`, etc.

## Replacement Context

The replacement function receives a `RuleContext` object:

```ts
interface RuleContext {
    node: Element; // The current element
    parent: Element | Document | null; // Parent element
    convertChildren: (node: Element | Document) => string; // Recursively convert children
    options: ResolvedOptions; // Resolved converter options
    listDepth: number; // Current list nesting depth
    insidePre: boolean; // Inside a <pre> element
    insideTable: boolean; // Inside a <table> element
    siblingIndex: number; // Index among parent's children
}
```

### `convertChildren`

Call `convertChildren(node)` to recursively convert an element's children using the full rule system. This is how you preserve nested content:

```ts
replacement: ({ convertChildren, node }) => {
  const content = convertChildren(node).trim();
  return `**${content}**`;
},
```

### `node`

The DOM element being processed. Access attributes via `node.attribs`:

```ts
replacement: ({ node }) => {
  const href = node.attribs.href;
  const id = node.attribs.id;
  const className = node.attribs.class;
  // ...
},
```

### `options`

The resolved converter options. Useful for respecting user preferences:

```ts
replacement: ({ options }) => {
  const bullet = options.bulletChar; // "-", "*", or "+"
  return `${bullet} Custom item\n`;
},
```

## Priority

Rules are sorted by priority (descending). Higher priority rules are checked first:

| Priority                       | Meaning                      |
| ------------------------------ | ---------------------------- |
| 100 (default for `createRule`) | Custom rules — checked first |
| 0 (built-in rules)             | Default rules — checked last |

If two rules have the same priority, the order in the array is preserved.

### Overriding Built-in Rules

To override a built-in rule, create a rule with the same filter and a higher priority (anything > 0):

```ts
// Custom heading conversion
const { markdown } = convert(html, {
    rules: [
        {
            filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            replacement: ({ node, convertChildren }) => {
                const level = Number.parseInt(node.name[1], 10);
                const content = convertChildren(node).trim();
                return `\n\n${'#'.repeat(level)} ${content} ${'#'.repeat(level)}\n\n`;
            },
            priority: 10 // Higher than 0 = overrides default
        }
    ]
});
```

## Examples

### Convert `<details>` / `<summary>`

```ts
createRule('details', ({ node, convertChildren }) => {
    const summary = node.children.find(c => 'name' in c && c.name === 'summary');
    const title = summary ? convertChildren(summary).trim() : 'Details';
    const content = convertChildren(node).trim();
    return `\n\n<details>\n<summary>${title}</summary>\n\n${content}\n\n</details>\n\n`;
});
```

### Strip Specific Elements

```ts
createRule(
    node => node.name === 'div' && node.attribs.class?.includes('ad'),
    () => null // Remove from output
);
```

### Custom Code Block with Filename

```ts
createRule("pre", ({ node }) => {
  const code = node.children.find((c) => "name" in c && c.name === "code");
  if (!code || !("attribs" in code)) return undefined; // fall through to default

  const filename = code.attribs["data-filename"];
  if (!filename) return undefined; // fall through to default

  const lang = code.attribs.class?.match(/language-(\S+)/)?.[1] ?? "";
  const text = /* extract text content */;
  return `\n\n\`\`\`${lang} title="${filename}"\n${text}\n\`\`\`\n\n`;
});
```

### Wrap Images in Figures

```ts
createRule('figure', ({ convertChildren, node }) => {
    const content = convertChildren(node).trim();
    return `\n\n${content}\n\n`;
});

createRule('figcaption', ({ convertChildren, node }) => {
    const content = convertChildren(node).trim();
    return `\n*${content}*\n`;
});
```

## Getting Default Rules

You can inspect the default rules:

```ts
import { getDefaultRules } from 'markdown-for-agents';

const rules = getDefaultRules();
console.log(rules.length); // Number of built-in rules
```

This returns the cached array of all block, inline, list, and table rules.
