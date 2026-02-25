import { describe, it, expect } from 'vitest';
import { convert } from '../../../src/core/converter.js';

describe('inline rules', () => {
    describe('strong/bold', () => {
        it('converts <strong> to **', () => {
            expect(convert('<strong>bold</strong>').markdown).toContain('**bold**');
        });

        it('converts <b> to **', () => {
            expect(convert('<b>bold</b>').markdown).toContain('**bold**');
        });

        it('supports __ delimiter', () => {
            const { markdown } = convert('<strong>bold</strong>', {
                strongDelimiter: '__'
            });
            expect(markdown).toContain('__bold__');
        });
    });

    describe('emphasis/italic', () => {
        it('converts <em> to *', () => {
            expect(convert('<em>italic</em>').markdown).toContain('*italic*');
        });

        it('converts <i> to *', () => {
            expect(convert('<i>italic</i>').markdown).toContain('*italic*');
        });
    });

    describe('strikethrough', () => {
        it('converts <del> to ~~', () => {
            expect(convert('<del>removed</del>').markdown).toContain('~~removed~~');
        });

        it('converts <s> to ~~', () => {
            expect(convert('<s>struck</s>').markdown).toContain('~~struck~~');
        });
    });

    describe('inline code', () => {
        it('converts <code> to backticks', () => {
            expect(convert('<code>x</code>').markdown).toContain('`x`');
        });

        it('uses double backticks when content has backtick', () => {
            expect(convert('<code>a`b</code>').markdown).toContain('``a`b``');
        });
    });

    describe('links', () => {
        it('converts <a> to markdown link', () => {
            const { markdown } = convert('<a href="https://example.com">Example</a>');
            expect(markdown).toContain('[Example](https://example.com)');
        });

        it('includes title when present', () => {
            const { markdown } = convert('<a href="https://example.com" title="My Title">Example</a>');
            expect(markdown).toContain('[Example](https://example.com "My Title")');
        });

        it('resolves relative URLs with baseUrl', () => {
            const { markdown } = convert('<a href="/about">About</a>', {
                baseUrl: 'https://example.com'
            });
            expect(markdown).toContain('[About](https://example.com/about)');
        });
    });

    describe('images', () => {
        it('converts <img> to markdown image', () => {
            const { markdown } = convert('<img src="https://example.com/img.png" alt="Photo">');
            expect(markdown).toContain('![Photo](https://example.com/img.png)');
        });

        it('handles missing alt text', () => {
            const { markdown } = convert('<img src="https://example.com/img.png">');
            expect(markdown).toContain('![](https://example.com/img.png)');
        });

        it('includes title when present', () => {
            const { markdown } = convert('<img src="https://example.com/img.png" alt="Photo" title="My Image">');
            expect(markdown).toContain('![Photo](https://example.com/img.png "My Image")');
        });

        it('resolves relative src with baseUrl', () => {
            const { markdown } = convert('<img src="/logo.png" alt="Logo">', {
                baseUrl: 'https://example.com'
            });
            expect(markdown).toContain('![Logo](https://example.com/logo.png)');
        });

        it('does not resolve data: URLs with baseUrl', () => {
            const { markdown } = convert('<img src="data:image/png;base64,abc" alt="Inline">', { baseUrl: 'https://example.com' });
            expect(markdown).toContain('![Inline](data:image/png;base64,abc)');
        });
    });

    describe('strikethrough aliases', () => {
        it('converts <strike> to ~~', () => {
            expect(convert('<strike>old</strike>').markdown).toContain('~~old~~');
        });
    });

    describe('emphasis delimiter option', () => {
        it('supports _ delimiter for em', () => {
            const { markdown } = convert('<em>italic</em>', { emDelimiter: '_' });
            expect(markdown).toContain('_italic_');
        });
    });

    describe('subscript and superscript', () => {
        it('converts <sub> to ~content~', () => {
            expect(convert('<p>H<sub>2</sub>O</p>').markdown).toContain('H~2~O');
        });

        it('converts <sup> to ^content^', () => {
            expect(convert('<p>x<sup>2</sup></p>').markdown).toContain('x^2^');
        });

        it('empty <sub> produces no output', () => {
            expect(convert('<p>H<sub></sub>O</p>').markdown).toBe('HO\n');
        });

        it('empty <sup> produces no output', () => {
            expect(convert('<p>x<sup></sup></p>').markdown).toBe('x\n');
        });
    });

    describe('abbr and mark pass-through', () => {
        it('passes through <abbr> content', () => {
            const { markdown } = convert('<p>Use <abbr>HTML</abbr></p>');
            expect(markdown).toContain('HTML');
        });

        it('passes through <mark> content', () => {
            const { markdown } = convert('<p>This is <mark>important</mark></p>');
            expect(markdown).toContain('important');
        });
    });

    describe('empty inline elements', () => {
        it('empty <strong> produces no output', () => {
            expect(convert('<p>a<strong></strong>b</p>').markdown).toBe('ab\n');
        });

        it('empty <em> produces no output', () => {
            expect(convert('<p>a<em></em>b</p>').markdown).toBe('ab\n');
        });

        it('empty <a> produces no output', () => {
            expect(convert('<p>before<a href="https://x.com"></a>after</p>').markdown).toBe('beforeafter\n');
        });
    });

    describe('links edge cases', () => {
        it('does not resolve hash-only href with baseUrl', () => {
            const { markdown } = convert('<a href="#section">Jump</a>', {
                baseUrl: 'https://example.com'
            });
            expect(markdown).toContain('[Jump](#section)');
        });

        it('does not resolve absolute http URLs with baseUrl', () => {
            const { markdown } = convert('<a href="https://other.com/page">Link</a>', { baseUrl: 'https://example.com' });
            expect(markdown).toContain('[Link](https://other.com/page)');
        });
    });
});
