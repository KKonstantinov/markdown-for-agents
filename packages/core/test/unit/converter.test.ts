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

    describe('contentHash', () => {
        it('returns a content hash string', () => {
            const { contentHash } = convert('<p>Hello world</p>');
            expect(typeof contentHash).toBe('string');
            expect(contentHash.length).toBeGreaterThan(0);
        });

        it('is deterministic for the same input', () => {
            const a = convert('<p>Hello</p>');
            const b = convert('<p>Hello</p>');
            expect(a.contentHash).toBe(b.contentHash);
        });

        it('differs for different content', () => {
            const a = convert('<p>Hello</p>');
            const b = convert('<p>World</p>');
            expect(a.contentHash).not.toBe(b.contentHash);
        });
    });

    describe('frontmatter', () => {
        it('prepends frontmatter when <head> has title and description', () => {
            const html = '<html><head><title>Hi</title><meta name="description" content="Desc"></head><body><p>Text</p></body></html>';
            const { markdown } = convert(html);
            expect(markdown).toMatch(/^---\ntitle: Hi\ndescription: Desc\n---\n/);
            expect(markdown).toContain('Text');
        });

        it('extracts og:image into frontmatter', () => {
            const html =
                '<html><head><meta property="og:image" content="https://example.com/img.png"></head><body><p>Text</p></body></html>';
            const { markdown } = convert(html);
            expect(markdown).toContain('image: https://example.com/img.png');
        });

        it('produces no frontmatter when there is no <head>', () => {
            const { markdown } = convert('<p>Hello</p>');
            expect(markdown).not.toContain('---');
        });

        it('produces no frontmatter when frontmatter is false', () => {
            const html = '<html><head><title>Hi</title></head><body><p>Text</p></body></html>';
            const { markdown } = convert(html, { frontmatter: false });
            expect(markdown).not.toContain('---');
            expect(markdown).toContain('Text');
        });

        it('merges custom fields with extracted metadata', () => {
            const html = '<html><head><title>Original</title></head><body><p>Text</p></body></html>';
            const { markdown } = convert(html, { frontmatter: { custom: 'val' } });
            expect(markdown).toContain('title: Original');
            expect(markdown).toContain('custom: val');
        });

        it('allows custom fields to override extracted ones', () => {
            const html = '<html><head><title>Original</title></head><body><p>Text</p></body></html>';
            const { markdown } = convert(html, { frontmatter: { title: 'Override' } });
            expect(markdown).toContain('title: Override');
            expect(markdown).not.toContain('title: Original');
        });

        it('includes frontmatter in token estimate and content hash', () => {
            const html = '<html><head><title>Hi</title></head><body><p>Text</p></body></html>';
            const withFm = convert(html);
            const withoutFm = convert(html, { frontmatter: false });
            expect(withFm.tokenEstimate.characters).toBeGreaterThan(withoutFm.tokenEstimate.characters);
            expect(withFm.contentHash).not.toBe(withoutFm.contentHash);
        });
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
