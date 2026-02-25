import { describe, it, expect } from 'vitest';
import { convert } from '../../../src/core/converter.js';

describe('walker behavior', () => {
    describe('text processing', () => {
        it('collapses whitespace in normal text', () => {
            const { markdown } = convert('<p>hello    world</p>');
            expect(markdown).toBe('hello world\n');
        });

        it('preserves whitespace inside <pre>', () => {
            const { markdown } = convert('<pre><code>  spaced  out  </code></pre>');
            expect(markdown).toContain('  spaced  out  ');
        });

        it('skips whitespace-only text nodes inside tables', () => {
            const html = `<table>
        <thead>
          <tr>
            <th>A</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>B</td>
          </tr>
        </tbody>
      </table>`;
            const { markdown } = convert(html);
            expect(markdown).toContain('| A |');
            expect(markdown).toContain('| B |');
            // Should not have extra spaces from formatting whitespace
            expect(markdown).not.toMatch(/\|\s{2,}A/);
        });
    });

    describe('rule matching', () => {
        it('higher priority rules take precedence', () => {
            const { markdown } = convert('<p>Hello</p>', {
                rules: [
                    {
                        filter: 'p',
                        replacement: ({ convertChildren, node }) => `CUSTOM: ${convertChildren(node).trim()}`,
                        priority: 10
                    }
                ]
            });
            expect(markdown).toContain('CUSTOM: Hello');
        });

        it('rule returning null removes element from output', () => {
            const { markdown } = convert('<p>Keep</p><div>Remove</div>', {
                rules: [
                    {
                        filter: 'div',
                        replacement: () => null,
                        priority: 10
                    }
                ]
            });
            expect(markdown).toContain('Keep');
            expect(markdown).not.toContain('Remove');
        });

        it('rule returning undefined falls through to next rule', () => {
            const { markdown } = convert('<p>Hello</p>', {
                rules: [
                    {
                        filter: 'p',
                        replacement: () => {
                            return;
                        },
                        priority: 20
                    },
                    {
                        filter: 'p',
                        replacement: ({ convertChildren, node }) => `FALLBACK: ${convertChildren(node).trim()}`,
                        priority: 10
                    }
                ]
            });
            expect(markdown).toContain('FALLBACK: Hello');
        });
    });

    describe('unmatched elements', () => {
        it('renders children of unmatched elements', () => {
            const { markdown } = convert('<section><p>Inside section</p></section>');
            expect(markdown).toContain('Inside section');
        });

        it('handles deeply nested unmatched elements', () => {
            const { markdown } = convert('<div><span><section><p>Deep</p></section></span></div>');
            expect(markdown).toContain('Deep');
        });
    });

    describe('adjacent element spacing', () => {
        it('inserts space between adjacent <a> elements', () => {
            const { markdown } = convert('<div><a href="/a">Link1</a><a href="/b">Link2</a></div>');
            expect(markdown).toContain('[Link1](/a) [Link2](/b)');
        });

        it('inserts space between adjacent inline elements', () => {
            const { markdown } = convert('<p><strong>Bold</strong><em>Italic</em></p>');
            expect(markdown).toContain('**Bold** *Italic*');
        });

        it('does not insert space when text node separates elements', () => {
            const { markdown } = convert('<p><a href="/a">Link1</a> <a href="/b">Link2</a></p>');
            // Only one space, not two
            expect(markdown).toContain('[Link1](/a) [Link2](/b)');
            expect(markdown).not.toContain('[Link1](/a)  [Link2](/b)');
        });

        it('does not insert space inside tables', () => {
            const { markdown } = convert('<table><thead><tr><th>A</th><th>B</th></tr></thead></table>');
            expect(markdown).toContain('| A | B |');
        });

        it('does not insert space inside <pre>', () => {
            const { markdown } = convert('<pre><code><span>a</span><span>b</span></code></pre>');
            expect(markdown).toContain('ab');
        });

        it('handles multiple adjacent elements', () => {
            const { markdown } = convert('<div><a href="/a">A</a><a href="/b">B</a><a href="/c">C</a></div>');
            expect(markdown).toContain('[A](/a) [B](/b) [C](/c)');
        });
    });
});
