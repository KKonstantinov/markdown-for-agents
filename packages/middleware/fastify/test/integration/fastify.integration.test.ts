import { describe, it, expect, afterEach } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { markdown } from '../../src/index.js';

async function createApp(options?: Parameters<typeof markdown>[0]): Promise<{ instance: FastifyInstance; address: string }> {
    const instance = Fastify();
    instance.register(markdown(options));

    instance.get('/html', (_request, reply) => {
        reply.header('content-type', 'text/html');
        return reply.send('<h1>Hello World</h1><p>This is <strong>bold</strong> text.</p>');
    });

    instance.get('/json', (_request, reply) => {
        return reply.send({ message: 'hello' });
    });

    instance.get('/page', (_request, reply) => {
        reply.header('content-type', 'text/html');
        return reply.send(`
        <nav><a href="/">Home</a></nav>
        <main><h1>Article</h1><p>Content here.</p></main>
        <footer>Copyright</footer>
      `);
    });

    const address = await instance.listen({ port: 0, host: '127.0.0.1' });
    return { instance, address };
}

describe('fastify middleware integration', () => {
    let app: FastifyInstance | undefined;

    afterEach(async () => {
        if (app) {
            await app.close();
            app = undefined;
        }
    });

    it('converts HTML to markdown via real HTTP request', async () => {
        const result = await createApp();
        app = result.instance;
        const base = result.address;

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
        const result = await createApp();
        app = result.instance;

        const res = await fetch(`${result.address}/html`, {
            headers: { accept: 'text/html' }
        });
        const body = await res.text();

        expect(res.headers.get('content-type')).toContain('text/html');
        expect(body).toContain('<h1>');
    });

    it('does not interfere with JSON responses', async () => {
        const result = await createApp();
        app = result.instance;

        const res = await fetch(`${result.address}/json`, {
            headers: { accept: 'text/markdown' }
        });
        const body = await res.json();

        expect(body).toEqual({ message: 'hello' });
    });

    it('supports extraction via options', async () => {
        const result = await createApp({ extract: true });
        app = result.instance;

        const res = await fetch(`${result.address}/page`, {
            headers: { accept: 'text/markdown' }
        });
        const body = await res.text();

        expect(body).toContain('Article');
        expect(body).toContain('Content here.');
        expect(body).not.toContain('Home');
        expect(body).not.toContain('Copyright');
    });
});
