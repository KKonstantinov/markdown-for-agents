import { isTag } from 'domhandler';
import type { Rule } from '../types.js';

export const listRules: Rule[] = [
    {
        filter: ['ul', 'ol'],
        replacement: ({ convertChildren, node, listDepth }) => {
            const content = convertChildren(node);
            // Top-level lists get surrounding newlines
            if (listDepth === 0) {
                return `\n\n${content.trim()}\n\n`;
            }
            // Nested lists are inline with parent li
            return `\n${content.trimEnd()}`;
        },
        priority: 0
    },

    {
        filter: 'li',
        replacement: ({ node, convertChildren, parent, options, listDepth, siblingIndex }) => {
            const content = convertChildren(node).trim();
            if (!content) return null;

            const indent = '  '.repeat(Math.max(0, listDepth - 1));
            const parentEl = parent && isTag(parent) ? parent : null;

            let bullet: string;
            if (parentEl && parentEl.name === 'ol') {
                const start = Number.parseInt(parentEl.attribs.start || '1', 10);
                // Count only <li> siblings before this one
                let liIndex = 0;
                for (let i = 0; i < siblingIndex; i++) {
                    const sibling = parentEl.children[i];
                    if (isTag(sibling) && sibling.name === 'li') {
                        liIndex++;
                    }
                }
                bullet = `${String(start + liIndex)}.`;
            } else {
                bullet = options.bulletChar;
            }

            // Handle multi-line content by indenting continuation lines
            const lines = content.split('\n');
            const first = `${indent}${bullet} ${lines[0]}`;
            if (lines.length === 1) return `${first}\n`;

            const continuationIndent = indent + ' '.repeat(bullet.length + 1);
            const rest = lines
                .slice(1)
                .map(line => (line.trim() ? `${continuationIndent}${line}` : ''))
                .join('\n');

            return `${first}\n${rest}\n`;
        },
        priority: 0
    }
];
