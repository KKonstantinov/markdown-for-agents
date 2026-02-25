import type { Text } from 'domhandler';
import type { Rule } from '../types.js';

export const inlineRules: Rule[] = [
    {
        filter: ['strong', 'b'],
        replacement: ({ convertChildren, node, options }) => {
            const content = convertChildren(node).trim();
            if (!content) return null;
            return `${options.strongDelimiter}${content}${options.strongDelimiter}`;
        },
        priority: 0
    },

    {
        filter: ['em', 'i'],
        replacement: ({ convertChildren, node, options }) => {
            const content = convertChildren(node).trim();
            if (!content) return null;
            return `${options.emDelimiter}${content}${options.emDelimiter}`;
        },
        priority: 0
    },

    {
        filter: ['del', 's', 'strike'],
        replacement: ({ convertChildren, node }) => {
            const content = convertChildren(node).trim();
            if (!content) return null;
            return `~~${content}~~`;
        },
        priority: 0
    },

    {
        filter: 'code',
        replacement: ({ node, insidePre }) => {
            if (insidePre) return; // let <pre> rule handle it
            const text = node.children.map(c => ('data' in c ? (c as Text).data : '')).join('');
            if (!text) return null;
            // Use double backticks if content contains a backtick
            const delimiter = text.includes('`') ? '``' : '`';
            const padded = text.startsWith('`') || text.endsWith('`') ? ` ${text} ` : text;
            return `${delimiter}${padded}${delimiter}`;
        },
        priority: 0
    },

    {
        filter: 'a',
        replacement: ({ node, convertChildren, options }) => {
            const href = node.attribs.href || '';
            const content = convertChildren(node).trim();
            if (!content) return null;

            const resolvedHref =
                options.baseUrl && href && !href.startsWith('http') && !href.startsWith('#') ? new URL(href, options.baseUrl).href : href;

            const title = node.attribs.title;
            if (title) {
                return `[${content}](${resolvedHref} "${title}")`;
            }
            return `[${content}](${resolvedHref})`;
        },
        priority: 0
    },

    {
        filter: 'img',
        replacement: ({ node, options }) => {
            const src = node.attribs.src || '';
            const alt = node.attribs.alt || '';
            const title = node.attribs.title;

            const resolvedSrc =
                options.baseUrl && src && !src.startsWith('http') && !src.startsWith('data:') ? new URL(src, options.baseUrl).href : src;

            if (title) {
                return `![${alt}](${resolvedSrc} "${title}")`;
            }
            return `![${alt}](${resolvedSrc})`;
        },
        priority: 0
    },

    {
        filter: ['abbr', 'mark'],
        replacement: ({ convertChildren, node }) => {
            return convertChildren(node);
        },
        priority: 0
    },

    {
        filter: 'sub',
        replacement: ({ convertChildren, node }) => {
            const content = convertChildren(node).trim();
            if (!content) return null;
            return `~${content}~`;
        },
        priority: 0
    },

    {
        filter: 'sup',
        replacement: ({ convertChildren, node }) => {
            const content = convertChildren(node).trim();
            if (!content) return null;
            return `^${content}^`;
        },
        priority: 0
    }
];
