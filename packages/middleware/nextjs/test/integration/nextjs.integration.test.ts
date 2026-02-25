import { describe, it, expect } from 'vitest';
import { withMarkdown } from '../../src/index.js';

describe('nextjs middleware integration', () => {
    it('performs full end-to-end conversion with real Request/Response', async () => {
        const handler = withMarkdown(
            async () =>
                new Response(
                    `<html><body>
          <h1>Blog Post</h1>
          <p>This is a <strong>real</strong> blog post with a <a href="https://example.com">link</a>.</p>
          <ul><li>Point one</li><li>Point two</li></ul>
        </body></html>`,
                    { headers: { 'content-type': 'text/html' } }
                )
        );

        const request = new Request('https://example.com/blog/1', {
            method: 'GET',
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        const body = await response!.text();

        expect(response!.status).toBe(200);
        expect(response!.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
        expect(body).toContain('# Blog Post');
        expect(body).toContain('**real**');
        expect(body).toContain('[link](https://example.com)');
        expect(body).toContain('- Point one');
        expect(body).toContain('- Point two');

        const tokens = Number(response!.headers.get('x-markdown-tokens'));
        expect(tokens).toBeGreaterThan(0);
    });

    it('performs end-to-end conversion with content extraction', async () => {
        const handler = withMarkdown(
            async () =>
                new Response(
                    `<html><body>
            <nav><a href="/">Home</a><a href="/about">About</a></nav>
            <main><h1>Article</h1><p>Main content.</p></main>
            <aside>Sidebar</aside>
            <footer>Copyright 2025</footer>
          </body></html>`,
                    { headers: { 'content-type': 'text/html' } }
                ),
            { extract: true }
        );

        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        const body = await response!.text();

        expect(body).toContain('Article');
        expect(body).toContain('Main content.');
        expect(body).not.toContain('Home');
        expect(body).not.toContain('Sidebar');
        expect(body).not.toContain('Copyright');
    });

    it('preserves response status through conversion', async () => {
        const handler = withMarkdown(
            async () =>
                new Response('<h1>Not Found</h1><p>Page does not exist.</p>', {
                    status: 404,
                    headers: { 'content-type': 'text/html' }
                })
        );

        const request = new Request('https://example.com/missing', {
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        expect(response!.status).toBe(404);
        expect(response!.headers.get('content-type')).toBe('text/markdown; charset=utf-8');

        const body = await response!.text();
        expect(body).toContain('# Not Found');
    });
});
