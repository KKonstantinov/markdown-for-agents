import { describe, it, expect, afterEach } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { markdown } from '../../src/index.js';

describe('express middleware integration', () => {
    let server: Server | undefined;

    afterEach(() => {
        if (server) {
            server.close();
            server = undefined;
        }
    });

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

    function listen(app: ReturnType<typeof express>): Promise<string> {
        return new Promise(resolve => {
            server = app.listen(0, () => {
                const addr = server!.address();
                const port = typeof addr === 'object' && addr ? addr.port : 0;
                resolve(`http://127.0.0.1:${String(port)}`);
            });
        });
    }

    it('converts HTML to markdown via real HTTP request', async () => {
        const app = createApp();
        const base = await listen(app);

        const res = await fetch(`${base}/html`, {
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
        const base = await listen(app);

        const res = await fetch(`${base}/html`, {
            headers: { accept: 'text/html' }
        });
        const body = await res.text();

        expect(res.headers.get('content-type')).toContain('text/html');
        expect(body).toContain('<h1>');
    });

    it('does not interfere with JSON responses', async () => {
        const app = createApp();
        const base = await listen(app);

        const res = await fetch(`${base}/json`, {
            headers: { accept: 'text/markdown' }
        });
        const body = await res.json();

        expect(body).toEqual({ message: 'hello' });
    });

    it('supports extraction via options', async () => {
        const app = createApp({ extract: true });
        const base = await listen(app);

        const res = await fetch(`${base}/page`, {
            headers: { accept: 'text/markdown' }
        });
        const body = await res.text();

        expect(body).toContain('Article');
        expect(body).toContain('Content here.');
        expect(body).not.toContain('Home');
        expect(body).not.toContain('Copyright');
    });
});
