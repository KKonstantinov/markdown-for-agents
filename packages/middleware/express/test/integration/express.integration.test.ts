import { describe, it, expect, afterEach } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { markdown } from '../../src/index.js';

function createApp(options?: Parameters<typeof markdown>[0]) {
    const app = express();
    app.use(markdown(options));

    app.get('/html', (_req, res) => {
        res.setHeader('content-type', 'text/html');
        res.send('<h1>Hello World</h1><p>This is <strong>bold</strong> text.</p>');
    });

    app.get('/json', (_req, res) => {
        res.json({ message: 'hello' });
    });

    app.get('/page', (_req, res) => {
        res.setHeader('content-type', 'text/html');
        res.send(`
        <nav><a href="/">Home</a></nav>
        <main><h1>Article</h1><p>Content here.</p></main>
        <footer>Copyright</footer>
      `);
    });

    return app;
}

function listen(app: ReturnType<typeof express>): Promise<{ server: Server; url: string }> {
    return new Promise(resolve => {
        const srv = app.listen(0, () => {
            const addr = srv.address();
            const port = typeof addr === 'object' && addr ? addr.port : 0;
            resolve({ server: srv, url: `http://127.0.0.1:${String(port)}` });
        });
    });
}

describe('express middleware integration', () => {
    let server: Server | undefined;

    afterEach(() => {
        if (server) {
            server.close();
            server = undefined;
        }
    });

    it('converts HTML to markdown via real HTTP request', async () => {
        const result = await listen(createApp());
        server = result.server;

        const res = await fetch(`${result.url}/html`, {
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
        const result = await listen(createApp());
        server = result.server;

        const res = await fetch(`${result.url}/html`, {
            headers: { accept: 'text/html' }
        });
        const body = await res.text();

        expect(res.headers.get('content-type')).toContain('text/html');
        expect(body).toContain('<h1>');
    });

    it('does not interfere with JSON responses', async () => {
        const result = await listen(createApp());
        server = result.server;

        const res = await fetch(`${result.url}/json`, {
            headers: { accept: 'text/markdown' }
        });
        const body = await res.json();

        expect(body).toEqual({ message: 'hello' });
    });

    it('supports extraction via options', async () => {
        const result = await listen(createApp({ extract: true }));
        server = result.server;

        const res = await fetch(`${result.url}/page`, {
            headers: { accept: 'text/markdown' }
        });
        const body = await res.text();

        expect(body).toContain('Article');
        expect(body).toContain('Content here.');
        expect(body).not.toContain('Home');
        expect(body).not.toContain('Copyright');
    });
});
