import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { convert } from '../../src/core/converter.js';

const fixture = (name: string) => readFileSync(path.resolve(import.meta.dirname, '../fixtures', name), 'utf8');

describe('convert', () => {
    it('converts simple HTML to markdown', () => {
        const html = fixture('simple.html');
        const expected = fixture('simple.md');
        const { markdown } = convert(html);
        expect(markdown).toBe(expected);
    });

    it('returns token estimate', () => {
        const { tokenEstimate } = convert('<p>Hello world</p>');
        expect(tokenEstimate.tokens).toBeGreaterThan(0);
        expect(tokenEstimate.characters).toBeGreaterThan(0);
        expect(tokenEstimate.words).toBeGreaterThan(0);
    });

    it('handles empty input', () => {
        const { markdown } = convert('');
        expect(markdown).toBe('\n');
    });

    it('strips script and style tags', () => {
        const { markdown } = convert('<p>Hello</p><script>alert("xss")</script><style>.x{}</style><p>World</p>');
        expect(markdown).not.toContain('alert');
        expect(markdown).not.toContain('.x{}');
        expect(markdown).toContain('Hello');
        expect(markdown).toContain('World');
    });

    it('respects custom rules', () => {
        const { markdown } = convert('<div class="note">Important!</div>', {
            rules: [
                {
                    filter: node => node.name === 'div' && (node.attribs.class || '').includes('note'),
                    replacement: ({ convertChildren, node }) => {
                        return `\n\n> **Note:** ${convertChildren(node).trim()}\n\n`;
                    },
                    priority: 10
                }
            ]
        });
        expect(markdown).toContain('> **Note:** Important!');
    });
});
