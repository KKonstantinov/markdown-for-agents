import type { Element } from 'domhandler';
import { isTag } from 'domhandler';
import type { Rule } from '../types.js';
import { getTextContent } from './util.js';

/**
 * Bare CSS class names on `<pre>` elements that should be treated as
 * code-block languages. Covers diagram-as-code tools that render into
 * `<pre class="toolname">` without a `language-` prefix.
 */
const BARE_LANG_CLASSES = new Set(['mermaid']);

/**
 * Detect the language identifier for a `<pre>` code block.
 *
 * Resolution order:
 * 1. `language-*` class on a `<code>` child element
 * 2. `language-*` class on the `<pre>` element itself (Prism.js pattern)
 * 3. A recognized bare class name on the `<pre>` element (e.g. `mermaid`)
 */
function detectLanguage(node: Element): string {
    const codeChild = node.children.find((c): c is Element => isTag(c) && c.name === 'code');

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- class may be undefined at runtime
    const codeLang = codeChild?.attribs.class?.match(/language-(\S+)/)?.[1];
    if (codeLang) return codeLang;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- class may be undefined at runtime
    const preLang = node.attribs.class?.match(/language-(\S+)/)?.[1];
    if (preLang) return preLang;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- class may be undefined at runtime
    for (const cls of node.attribs.class?.split(/\s+/) ?? []) {
        if (BARE_LANG_CLASSES.has(cls)) return cls;
    }

    return '';
}

/**
 * Built-in rules for block-level HTML elements.
 *
 * Handles headings (`h1`–`h6`), paragraphs, blockquotes, preformatted code blocks,
 * horizontal rules, line breaks, and stripped elements (`script`, `style`, `head`, etc.).
 * Headings support both ATX (`#`) and setext (underline) styles via the `headingStyle` option.
 */
export const blockRules: Rule[] = [
    {
        filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        replacement: ({ node, convertChildren, options }) => {
            const level = Number.parseInt(node.name[1], 10);
            const content = convertChildren(node).trim();
            if (!content) return null;

            if (options.headingStyle === 'setext' && level <= 2) {
                const ch = level === 1 ? '=' : '-';
                return `\n\n${content}\n${ch.repeat(content.length)}\n\n`;
            }
            return `\n\n${'#'.repeat(level)} ${content}\n\n`;
        },
        priority: 0
    },

    {
        filter: 'p',
        replacement: ({ convertChildren, node }) => {
            const content = convertChildren(node).trim();
            if (!content) return null;
            return `\n\n${content}\n\n`;
        },
        priority: 0
    },

    {
        filter: 'blockquote',
        replacement: ({ convertChildren, node }) => {
            const content = convertChildren(node).trim();
            if (!content) return null;
            const quoted = content
                .split('\n')
                .map(line => `> ${line}`)
                .join('\n');
            return `\n\n${quoted}\n\n`;
        },
        priority: 0
    },

    {
        filter: 'pre',
        replacement: ({ node, options }) => {
            const lang = detectLanguage(node);
            const text = getTextContent(node);
            const fence = options.fenceChar.repeat(3);
            return `\n\n${fence}${lang}\n${text}\n${fence}\n\n`;
        },
        priority: 0
    },

    {
        filter: 'hr',
        replacement: () => '\n\n---\n\n',
        priority: 0
    },

    {
        filter: 'br',
        replacement: () => '  \n',
        priority: 0
    },

    {
        filter: ['script', 'style', 'noscript', 'template'],
        replacement: () => null,
        priority: 0
    },

    // Strip document metadata elements — <head>, <title>, etc. contain
    // metadata that should never appear as visible Markdown content.
    {
        filter: ['head', 'title', 'meta', 'link', 'base'],
        replacement: () => null,
        priority: 0
    }
];
