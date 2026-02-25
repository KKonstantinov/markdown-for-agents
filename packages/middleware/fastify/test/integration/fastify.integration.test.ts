import { describe, it, expect, afterEach } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { markdown } from '../../src/index.js';

describe('fastify middleware integration', () => {
    let app: FastifyInstance | undefined;

    afterEach(async () => {
        if (app) {
            await app.close();
            app = undefined;
        }
    });

    async function createApp(options?: Parameters<typeof markdown>[0]) {
        app = Fastify();
        app.register(markdown(options));

        app.get('/html', (_request, reply) => {
            reply.header('content-type', 'text/html');
            return reply.send('<h1>Hello World</h1><p>This is <strong>bold</strong> text.</p>');
        });

        app.get('/json', (_request, reply) => {
            return reply.send({ message: 'hello' });
        });

        app.get('/page', (_request, reply) => {
            reply.header('content-type', 'text/html');
            return reply.send(`
        <nav><a href="/">Home</a></nav>
        <main><h1>Article</h1><p>Content here.</p></main>
        <footer>Copyright</footer>
      `);
        });

        const address = await app.listen({ port: 0, host: '127.0.0.1' });
        return address;
    }

    it('converts HTML to markdown via real HTTP request', async () => {
        const base = await createApp();

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
        const base = await createApp();

        const res = await fetch(`${base}/html`, {
            headers: { accept: 'text/html' }
        });
        const body = await res.text();

        expect(res.headers.get('content-type')).toContain('text/html');
        expect(body).toContain('<h1>');
    });

    it('does not interfere with JSON responses', async () => {
        const base = await createApp();

        const res = await fetch(`${base}/json`, {
            headers: { accept: 'text/markdown' }
        });
        const body = await res.json();

        expect(body).toEqual({ message: 'hello' });
    });

    it('supports extraction via options', async () => {
        const base = await createApp({ extract: true });

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
