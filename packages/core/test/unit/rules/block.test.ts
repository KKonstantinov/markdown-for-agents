import { describe, it, expect } from 'vitest';
import { convert } from '../../../src/core/converter.js';

describe('block rules', () => {
    describe('headings', () => {
        it('converts h1-h6 to atx style', () => {
            expect(convert('<h1>Title</h1>').markdown).toBe('# Title\n');
            expect(convert('<h2>Sub</h2>').markdown).toBe('## Sub\n');
            expect(convert('<h3>H3</h3>').markdown).toBe('### H3\n');
            expect(convert('<h4>H4</h4>').markdown).toBe('#### H4\n');
            expect(convert('<h5>H5</h5>').markdown).toBe('##### H5\n');
            expect(convert('<h6>H6</h6>').markdown).toBe('###### H6\n');
        });

        it('supports setext style for h1/h2', () => {
            const h1 = convert('<h1>Title</h1>', { headingStyle: 'setext' });
            expect(h1.markdown).toBe('Title\n=====\n');

            const h2 = convert('<h2>Sub</h2>', { headingStyle: 'setext' });
            expect(h2.markdown).toBe('Sub\n---\n');

            // h3+ still uses atx
            const h3 = convert('<h3>H3</h3>', { headingStyle: 'setext' });
            expect(h3.markdown).toBe('### H3\n');
        });

        it('skips empty headings', () => {
            expect(convert('<h1></h1>').markdown).toBe('\n');
        });
    });

    describe('paragraphs', () => {
        it('converts paragraphs', () => {
            expect(convert('<p>Hello</p>').markdown).toBe('Hello\n');
        });

        it('separates multiple paragraphs', () => {
            expect(convert('<p>One</p><p>Two</p>').markdown).toBe('One\n\nTwo\n');
        });
    });

    describe('blockquotes', () => {
        it('converts blockquotes', () => {
            const { markdown } = convert('<blockquote><p>Quote</p></blockquote>');
            expect(markdown).toContain('> Quote');
        });
    });

    describe('code blocks', () => {
        it('converts pre/code to fenced code blocks', () => {
            const { markdown } = convert('<pre><code class="language-js">const x = 1;</code></pre>');
            expect(markdown).toContain('```js\nconst x = 1;\n```');
        });

        it('handles pre without language', () => {
            const { markdown } = convert('<pre><code>plain code</code></pre>');
            expect(markdown).toContain('```\nplain code\n```');
        });
    });

    describe('horizontal rules', () => {
        it('converts <hr> to ---', () => {
            expect(convert('<hr>').markdown).toContain('---');
        });
    });

    describe('line breaks', () => {
        it('converts <br> to markdown line break', () => {
            expect(convert('<p>line1<br>line2</p>').markdown).toContain('line1  \nline2');
        });
    });

    describe('code blocks with tilde fence', () => {
        it('uses tilde fence when fenceChar is ~', () => {
            const { markdown } = convert('<pre><code class="language-py">x = 1</code></pre>', { fenceChar: '~' });
            expect(markdown).toContain('~~~py\nx = 1\n~~~');
        });
    });

    describe('empty elements', () => {
        it('empty <p> produces no output', () => {
            expect(convert('<p></p>').markdown).toBe('\n');
        });

        it('whitespace-only <p> produces no output', () => {
            expect(convert('<p>   </p>').markdown).toBe('\n');
        });
    });

    describe('multi-line blockquotes', () => {
        it('prefixes each line with >', () => {
            const { markdown } = convert('<blockquote><p>Line one</p><p>Line two</p></blockquote>');
            expect(markdown).toContain('> Line one');
            expect(markdown).toContain('> Line two');
        });
    });

    describe('stripped tags', () => {
        it('strips <noscript>', () => {
            const { markdown } = convert('<p>Keep</p><noscript>No JS</noscript>');
            expect(markdown).toContain('Keep');
            expect(markdown).not.toContain('No JS');
        });

        it('strips <template>', () => {
            const { markdown } = convert('<p>Keep</p><template>Template</template>');
            expect(markdown).toContain('Keep');
            expect(markdown).not.toContain('Template');
        });
    });

    describe('metadata stripping', () => {
        it('strips <head> and its contents from body markdown', () => {
            const { markdown } = convert(
                "<html><head><title>Page Title</title><meta name='desc' content='test'></head><body><p>Content</p></body></html>",
                { frontmatter: false }
            );
            expect(markdown).not.toContain('Page Title');
            expect(markdown).toContain('Content');
        });

        it('strips standalone <title>', () => {
            const { markdown } = convert('<title>My Title</title><p>Body</p>');
            expect(markdown).not.toContain('My Title');
            expect(markdown).toContain('Body');
        });

        it('strips <meta> and <link> tags', () => {
            const { markdown } = convert('<meta charset="utf-8"><link rel="stylesheet" href="style.css"><p>Content</p>');
            expect(markdown).toContain('Content');
            expect(markdown).not.toContain('stylesheet');
        });
    });
});
