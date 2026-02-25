import type { Element } from 'domhandler';
import { isTag } from 'domhandler';
import type { Rule } from '../types.js';
import { getTextContent } from './util.js';

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
            const codeChild = node.children.find((c): c is Element => isTag(c) && c.name === 'code');
            const lang = codeChild
                ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- class may be undefined at runtime
                  (codeChild.attribs.class?.match(/language-(\S+)/)?.[1] ?? '')
                : '';

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
