import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { markdown } from '../../src/index.js';

function createApp(options?: Parameters<typeof markdown>[0]) {
    const app = new Hono();
    app.use('*', markdown(options));

    app.get('/html', c => {
        return c.html('<h1>Hello World</h1><p>This is <strong>bold</strong> text.</p>');
    });

    app.get('/json', c => {
        return c.json({ message: 'hello' });
    });

    app.get('/page', c => {
        return c.html(`
        <nav><a href="/">Home</a></nav>
        <main><h1>Article</h1><p>Content here.</p></main>
        <footer>Copyright</footer>
      `);
    });

    return app;
}

describe('hono middleware integration', () => {
    it('converts HTML to markdown via Hono request', async () => {
        const app = createApp();
        const res = await app.request('/html', {
            headers: { accept: 'text/markdown' }
        });
        const body = await res.text();

        expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
        expect(body).toContain('# Hello World');
        expect(body).toContain('**bold**');

        const tokens = Number(res.headers.get('x-markdown-tokens'));
        expect(tokens).toBeGreaterThan(0);
    });

    it('returns HTML when Accept header does not request markdown', async () => {
        const app = createApp();
        const res = await app.request('/html', {
            headers: { accept: 'text/html' }
        });
        const body = await res.text();

        expect(res.headers.get('content-type')).toContain('text/html');
        expect(body).toContain('<h1>');
    });

    it('does not interfere with JSON responses', async () => {
        const app = createApp();
        const res = await app.request('/json', {
            headers: { accept: 'text/markdown' }
        });
        const body = await res.json();

        expect(body).toEqual({ message: 'hello' });
    });

    it('supports extraction via options', async () => {
        const app = createApp({ extract: true });
        const res = await app.request('/page', {
            headers: { accept: 'text/markdown' }
        });
        const body = await res.text();

        expect(body).toContain('Article');
        expect(body).toContain('Content here.');
        expect(body).not.toContain('Home');
        expect(body).not.toContain('Copyright');
    });
});
