import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { convert } from '../../src/core/converter.js';
import type { TokenEstimate } from '../../src/types.js';

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

    describe('tokenCounter option', () => {
        it('uses custom tokenCounter when provided', () => {
            const customCounter = vi.fn(
                (text: string): TokenEstimate => ({
                    tokens: 42,
                    characters: text.length,
                    words: text.split(/\s+/).filter(Boolean).length
                })
            );

            const { tokenEstimate } = convert('<p>Hello world</p>', { tokenCounter: customCounter });

            expect(customCounter).toHaveBeenCalledOnce();
            expect(tokenEstimate.tokens).toBe(42);
        });

        it('passes the final markdown string to the custom counter', () => {
            let receivedText = '';
            const customCounter = (text: string): TokenEstimate => {
                receivedText = text;
                return { tokens: 1, characters: text.length, words: 0 };
            };

            const { markdown } = convert('<h1>Title</h1>', { tokenCounter: customCounter });

            expect(receivedText).toBe(markdown);
        });

        it('uses built-in heuristic when tokenCounter is not provided', () => {
            const { tokenEstimate } = convert('<p>Hello world</p>');
            // Built-in heuristic: ceil(characters / 4)
            expect(tokenEstimate.tokens).toBe(Math.ceil(tokenEstimate.characters / 4));
        });

        it('returns exact values from custom counter', () => {
            const customCounter = (): TokenEstimate => ({
                tokens: 100,
                characters: 200,
                words: 50
            });

            const { tokenEstimate } = convert('<p>Some text</p>', { tokenCounter: customCounter });

            expect(tokenEstimate).toEqual({ tokens: 100, characters: 200, words: 50 });
        });
    });
});
