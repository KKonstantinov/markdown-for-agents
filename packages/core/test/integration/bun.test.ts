import { describe, it, expect } from 'bun:test';
import { convert, createRule, estimateTokens } from '../../dist/index.mjs';

describe('html-to-markdown (Bun)', () => {
    it('converts basic HTML', () => {
        const { markdown } = convert('<h1>Hello</h1><p>World</p>');
        expect(markdown).toContain('# Hello');
        expect(markdown).toContain('World');
    });

    it('returns token estimates', () => {
        const { tokenEstimate } = convert('<p>Test content here</p>');
        expect(tokenEstimate.tokens).toBeGreaterThan(0);
        expect(tokenEstimate.characters).toBeGreaterThan(0);
        expect(tokenEstimate.words).toBeGreaterThan(0);
    });

    it('supports content extraction', () => {
        const html = `
      <nav><a href="/">Home</a></nav>
      <main><p>Content</p></main>
      <footer>Footer</footer>
    `;
        const { markdown } = convert(html, { extract: true });
        expect(markdown).toContain('Content');
        expect(markdown).not.toContain('Home');
        expect(markdown).not.toContain('Footer');
    });

    it('supports custom rules via createRule', () => {
        const rule = createRule(
            node => node.name === 'div' && (node.attribs.class ?? '').includes('alert'),
            ({ convertChildren, node }) => `\n\n> ${convertChildren(node).trim()}\n\n`
        );
        const { markdown } = convert('<div class="alert">Warning!</div>', {
            rules: [rule]
        });
        expect(markdown).toContain('> Warning!');
    });

    it('exports estimateTokens standalone', () => {
        const result = estimateTokens('Hello world');
        expect(result.characters).toBe(11);
        expect(result.tokens).toBeGreaterThan(0);
    });
});
