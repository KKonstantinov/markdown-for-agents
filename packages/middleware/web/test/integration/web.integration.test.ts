import { describe, it, expect } from 'vitest';
import { markdownMiddleware } from '../../src/index.js';

describe('web middleware integration', () => {
    const htmlBody = `
    <html>
      <body>
        <h1>Hello World</h1>
        <p>This is a <strong>real</strong> HTML page with a <a href="https://example.com">link</a>.</p>
        <ul>
          <li>Item one</li>
          <li>Item two</li>
        </ul>
      </body>
    </html>
  `;

    const htmlHandler = () =>
        new Response(htmlBody, {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' }
        });

    it('performs full end-to-end conversion with real Request/Response objects', async () => {
        const mw = markdownMiddleware();
        const request = new Request('https://example.com/page', {
            method: 'GET',
            headers: { accept: 'text/markdown' }
        });

        const response = await mw(request, htmlHandler);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');

        expect(body).toContain('# Hello World');
        expect(body).toContain('**real**');
        expect(body).toContain('[link](https://example.com)');
        expect(body).toContain('- Item one');
        expect(body).toContain('- Item two');

        const tokens = Number(response.headers.get('x-markdown-tokens'));
        expect(tokens).toBeGreaterThan(0);
    });

    it('performs end-to-end conversion with content extraction', async () => {
        const fullPage = `
      <html>
        <body>
          <nav><a href="/">Home</a><a href="/about">About</a></nav>
          <main>
            <h1>Article</h1>
            <p>Main content paragraph.</p>
          </main>
          <aside>Sidebar content</aside>
          <footer>Copyright 2025</footer>
        </body>
      </html>
    `;

        const mw = markdownMiddleware({ extract: true });
        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await mw(
            request,
            () =>
                new Response(fullPage, {
                    headers: { 'content-type': 'text/html' }
                })
        );
        const body = await response.text();

        expect(body).toContain('Article');
        expect(body).toContain('Main content paragraph.');
        expect(body).not.toContain('Home');
        expect(body).not.toContain('Sidebar');
        expect(body).not.toContain('Copyright');
    });

    it('preserves response status and non-content headers', async () => {
        const mw = markdownMiddleware();
        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await mw(
            request,
            () =>
                new Response('<h1>Not Found</h1>', {
                    status: 404,
                    statusText: 'Not Found',
                    headers: {
                        'content-type': 'text/html',
                        'x-custom': 'preserved'
                    }
                })
        );

        expect(response.status).toBe(404);
        expect(response.headers.get('x-custom')).toBe('preserved');
        expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    });
});
