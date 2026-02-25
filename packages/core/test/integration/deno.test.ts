// deno-lint-ignore-file
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/assert_equals.ts';
import { assert } from 'https://deno.land/std@0.224.0/assert/assert.ts';
import { assertFalse } from 'https://deno.land/std@0.224.0/assert/assert_false.ts';

// Import from built dist — run `npm run build` first
import { convert, createRule, estimateTokens } from '../../dist/index.mjs';

Deno.test('converts basic HTML', () => {
    const { markdown } = convert('<h1>Hello</h1><p>World</p>');
    assert(markdown.includes('# Hello'));
    assert(markdown.includes('World'));
});

Deno.test('returns token estimates', () => {
    const { tokenEstimate } = convert('<p>Test content here</p>');
    assert(tokenEstimate.tokens > 0);
    assert(tokenEstimate.characters > 0);
    assert(tokenEstimate.words > 0);
});

Deno.test('supports content extraction', () => {
    const html = `
    <nav><a href="/">Home</a></nav>
    <main><p>Content</p></main>
    <footer>Footer</footer>
  `;
    const { markdown } = convert(html, { extract: true });
    assert(markdown.includes('Content'));
    assertFalse(markdown.includes('Home'));
    assertFalse(markdown.includes('Footer'));
});

Deno.test('supports custom rules via createRule', () => {
    const rule = createRule(
        (node: any) => node.name === 'div' && (node.attribs.class ?? '').includes('alert'),
        ({ convertChildren, node }: any) => `\n\n> ${convertChildren(node).trim()}\n\n`
    );
    const { markdown } = convert('<div class="alert">Warning!</div>', {
        rules: [rule]
    });
    assert(markdown.includes('> Warning!'));
});

Deno.test('exports estimateTokens standalone', () => {
    const result = estimateTokens('Hello world');
    assertEquals(result.characters, 11);
    assert(result.tokens > 0);
});
