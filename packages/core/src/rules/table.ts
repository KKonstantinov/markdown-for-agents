import type { Rule } from '../types.js';
import type { Element } from 'domhandler';

export const tableRules: Rule[] = [
    {
        filter: 'table',
        replacement: ({ convertChildren, node }) => {
            const content = convertChildren(node).trim();
            if (!content) return null;
            return `\n\n${content}\n\n`;
        },
        priority: 0
    },

    {
        filter: ['thead', 'tbody', 'tfoot'],
        replacement: ({ convertChildren, node }) => {
            return convertChildren(node);
        },
        priority: 0
    },

    {
        filter: 'tr',
        replacement: ({ node, convertChildren, parent }) => {
            const rawCells = convertChildren(node);
            const cells = rawCells.trim();
            if (!cells) return null;

            const row = `| ${rawCells.trimEnd()} |`;

            // Add separator row after the first <tr> in <thead>
            const isInThead = parent && 'name' in parent && parent.name === 'thead';
            if (isInThead) {
                const columnCount = node.children.filter((c): c is Element => 'name' in c && (c.name === 'th' || c.name === 'td')).length;
                const separator = `| ${Array.from({ length: columnCount }, () => '---').join(' | ')} |`;
                return `${row}\n${separator}\n`;
            }

            return `${row}\n`;
        },
        priority: 0
    },

    {
        filter: ['th', 'td'],
        replacement: ({ convertChildren, node, siblingIndex }) => {
            const content = convertChildren(node)
                .trim()
                .replaceAll('|', String.raw`\|`)
                .replaceAll('\n', ' ');

            // Add separator between cells (not before the first one)
            const prevSiblings = node.parent?.children.slice(0, siblingIndex) ?? [];
            const isFirstCell = !prevSiblings.some(c => 'name' in c && (c.name === 'th' || c.name === 'td'));

            return isFirstCell ? content : ` | ${content}`;
        },
        priority: 0
    }
];
