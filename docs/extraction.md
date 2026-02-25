# Content Extraction

When converting full web pages, you typically want the article content without navigation, ads, sidebars, cookie banners, and other boilerplate. The extraction module prunes the DOM tree before conversion, keeping only meaningful content.

## Basic Usage

```ts
import { convert } from 'markdown-for-agents';

const { markdown } = convert(html, { extract: true });
```

With `extract: true`, the library strips elements using a built-in set of heuristics based on HTML tags, ARIA roles, class names, and IDs.

## What Gets Stripped

### By Tag Name

| Tag          | Description                     |
| ------------ | ------------------------------- |
| `<nav>`      | Navigation                      |
| `<header>`   | Page header                     |
| `<footer>`   | Page footer                     |
| `<aside>`    | Sidebars, complementary content |
| `<script>`   | JavaScript                      |
| `<style>`    | CSS                             |
| `<noscript>` | No-JS fallback content          |
| `<template>` | HTML templates                  |
| `<iframe>`   | Embedded frames                 |
| `<svg>`      | Vector graphics                 |
| `<form>`     | Forms                           |

### By ARIA Role

| Role              | Description                      |
| ----------------- | -------------------------------- |
| `navigation`      | Navigation landmarks             |
| `banner`          | Site-wide header                 |
| `contentinfo`     | Footer information               |
| `complementary`   | Complementary content (sidebars) |
| `search`          | Search widgets                   |
| `menu`, `menubar` | Menu widgets                     |

### By Class Pattern

Elements with classes matching these patterns are stripped:

- `ad`, `ads`, `ad-` — advertisements
- `sidebar` — sidebar content
- `widget` — widget blocks
- `cookie` — cookie consent banners
- `popup`, `modal` — overlays and dialogs
- `breadcrumb` — breadcrumb navigation
- `footnote` — footnotes
- `share`, `social` — social sharing widgets
- `newsletter` — newsletter signup forms
- `comment` — comment sections
- `related` — related content blocks

### By ID Pattern

Elements with IDs matching these patterns are stripped:

- `ad`, `ads`, `ad-` — advertisements
- `sidebar` — sidebar content
- `cookie` — cookie consent
- `popup`, `modal` — overlays

## Keeping Specific Elements

You can selectively keep elements that would otherwise be stripped:

```ts
const { markdown } = convert(html, {
    extract: {
        keepHeader: true, // Keep <header> elements
        keepFooter: true, // Keep <footer> elements
        keepNav: true // Keep <nav> elements
    }
});
```

This is useful when the page header or navigation contains important content.

## Custom Strip Rules

Add your own strip rules alongside the defaults:

```ts
const { markdown } = convert(html, {
    extract: {
        // Additional tags to strip
        stripTags: ['section', 'figure'],

        // Additional class patterns (string or RegExp)
        stripClasses: [/\bpromo\b/i, 'banner-wrapper'],

        // Additional roles to strip
        stripRoles: ['status', 'alert'],

        // Additional ID patterns (string or RegExp)
        stripIds: [/\bpopover\b/i, 'disclaimer']
    }
});
```

Custom patterns are **additive** — they extend the default patterns rather than replacing them.

### Pattern Matching

- **String patterns** match as substrings: `"banner"` matches `class="top-banner-wrapper"`
- **RegExp patterns** use `.test()`: `/\bbanner\b/i` matches `class="Banner"` but not `class="banners"`

## Using Extraction Directly

You can use the extraction module independently from the converter:

```ts
import { extractContent } from 'markdown-for-agents/extract';
import { parseDocument } from 'htmlparser2';

const document = parseDocument(html);
extractContent(document, { keepHeader: true });
// document is now mutated — stripped elements are removed
```

This is useful if you need to manipulate the DOM tree after extraction but before conversion.

## Examples

### Blog Post

```ts
const { markdown } = convert(blogHtml, {
    extract: true,
    baseUrl: 'https://blog.example.com'
});
// Returns just the article text with resolved image URLs
```

### Documentation Page with Nav

```ts
const { markdown } = convert(docsHtml, {
    extract: {
        keepNav: true // Keep docs sidebar navigation
    }
});
```

### Custom CMS with Widget Classes

```ts
const { markdown } = convert(cmsHtml, {
    extract: {
        stripClasses: [/\bcms-widget\b/, /\bcms-toolbar\b/]
    }
});
```
