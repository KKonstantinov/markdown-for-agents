import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { convert, createRule, estimateTokens } from '../../dist/index.mjs';

describe('html-to-markdown (Node.js)', () => {
    it('converts basic HTML', () => {
        const { markdown } = convert('<h1>Hello</h1><p>World</p>');
        assert.ok(markdown.includes('# Hello'));
        assert.ok(markdown.includes('World'));
    });

    it('returns token estimates', () => {
        const { tokenEstimate } = convert('<p>Test content here</p>');
        assert.ok(tokenEstimate.tokens > 0);
        assert.ok(tokenEstimate.characters > 0);
        assert.ok(tokenEstimate.words > 0);
    });

    it('supports content extraction', () => {
        const html = `
      <nav><a href="/">Home</a></nav>
      <main><p>Content</p></main>
      <footer>Footer</footer>
    `;
        const { markdown } = convert(html, { extract: true });
        assert.ok(markdown.includes('Content'));
        assert.ok(!markdown.includes('Home'));
        assert.ok(!markdown.includes('Footer'));
    });

    it('supports custom rules via createRule', () => {
        const rule = createRule(
            node => node.name === 'div' && (node.attribs.class || '').includes('alert'),
            ({ convertChildren, node }) => `\n\n> ${convertChildren(node).trim()}\n\n`
        );
        const { markdown } = convert('<div class="alert">Warning!</div>', {
            rules: [rule]
        });
        assert.ok(markdown.includes('> Warning!'));
    });

    it('exports estimateTokens standalone', () => {
        const result = estimateTokens('Hello world');
        assert.equal(result.characters, 11);
        assert.ok(result.tokens > 0);
    });
});
