import { describe, it, expect } from 'vitest';
import { markdownMiddleware } from '../../src/index.js';

describe('web middleware', () => {
    const htmlHandler = () =>
        new Response('<h1>Title</h1><p>Body</p>', {
            headers: { 'content-type': 'text/html' }
        });

    it('converts HTML to markdown when Accept: text/markdown', async () => {
        const mw = markdownMiddleware();
        const req = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const res = await mw(req, htmlHandler);
        const body = await res.text();

        expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
        expect(res.headers.get('x-markdown-tokens')).toBeTruthy();
        expect(body).toContain('# Title');
        expect(body).toContain('Body');
    });

    it('passes through when Accept is not text/markdown', async () => {
        const mw = markdownMiddleware();
        const req = new Request('https://example.com', {
            headers: { accept: 'text/html' }
        });

        const res = await mw(req, htmlHandler);
        expect(res.headers.get('content-type')).toBe('text/html');
    });

    it('passes through non-HTML responses even with Accept: text/markdown', async () => {
        const mw = markdownMiddleware();
        const req = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });
        const jsonHandler = () =>
            new Response('{"ok":true}', {
                headers: { 'content-type': 'application/json' }
            });

        const res = await mw(req, jsonHandler);
        expect(res.headers.get('content-type')).toBe('application/json');
    });

    it('supports custom token header name', async () => {
        const mw = markdownMiddleware({ tokenHeader: 'x-tokens' });
        const req = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const res = await mw(req, htmlHandler);
        expect(res.headers.get('x-tokens')).toBeTruthy();
        expect(res.headers.get('x-markdown-tokens')).toBeNull();
    });

    describe('ETag header', () => {
        it('sets ETag on converted responses', async () => {
            const mw = markdownMiddleware();
            const req = new Request('https://example.com', {
                headers: { accept: 'text/markdown' }
            });

            const res = await mw(req, htmlHandler);
            expect(res.headers.get('etag')).toMatch(/^".+"$/);
        });

        it('does not set ETag on pass-through responses', async () => {
            const mw = markdownMiddleware();
            const req = new Request('https://example.com', {
                headers: { accept: 'text/html' }
            });

            const res = await mw(req, htmlHandler);
            expect(res.headers.get('etag')).toBeNull();
        });

        it('produces the same ETag for identical content', async () => {
            const mw = markdownMiddleware();

            const a = await mw(new Request('https://example.com', { headers: { accept: 'text/markdown' } }), htmlHandler);
            const b = await mw(new Request('https://example.com', { headers: { accept: 'text/markdown' } }), htmlHandler);

            expect(a.headers.get('etag')).toBe(b.headers.get('etag'));
        });
    });

    describe('Content-Signal header', () => {
        it('sets content-signal on converted responses when configured', async () => {
            const mw = markdownMiddleware({ contentSignal: { aiTrain: true, search: true, aiInput: true } });
            const req = new Request('https://example.com', {
                headers: { accept: 'text/markdown' }
            });

            const res = await mw(req, htmlHandler);
            expect(res.headers.get('content-signal')).toBe('ai-train=yes, search=yes, ai-input=yes');
        });

        it('does not set content-signal when not configured', async () => {
            const mw = markdownMiddleware();
            const req = new Request('https://example.com', {
                headers: { accept: 'text/markdown' }
            });

            const res = await mw(req, htmlHandler);
            expect(res.headers.get('content-signal')).toBeNull();
        });

        it('does not set content-signal on pass-through responses', async () => {
            const mw = markdownMiddleware({ contentSignal: { aiTrain: true } });
            const req = new Request('https://example.com', {
                headers: { accept: 'text/html' }
            });

            const res = await mw(req, htmlHandler);
            expect(res.headers.get('content-signal')).toBeNull();
        });
    });

    describe('Vary header', () => {
        it('sets Vary: Accept on converted responses', async () => {
            const mw = markdownMiddleware();
            const req = new Request('https://example.com', {
                headers: { accept: 'text/markdown' }
            });

            const res = await mw(req, htmlHandler);
            expect(res.headers.get('vary')).toContain('Accept');
        });

        it('sets Vary: Accept on pass-through responses', async () => {
            const mw = markdownMiddleware();
            const req = new Request('https://example.com', {
                headers: { accept: 'text/html' }
            });

            const res = await mw(req, htmlHandler);
            expect(res.headers.get('vary')).toContain('Accept');
        });

        it('appends to existing Vary header', async () => {
            const mw = markdownMiddleware();
            const req = new Request('https://example.com', {
                headers: { accept: 'text/markdown' }
            });
            const handlerWithVary = () =>
                new Response('<h1>Title</h1>', {
                    headers: {
                        'content-type': 'text/html',
                        vary: 'Accept-Encoding'
                    }
                });

            const res = await mw(req, handlerWithVary);
            const vary = res.headers.get('vary')!;
            expect(vary).toContain('Accept-Encoding');
            expect(vary).toContain('Accept');
        });
    });
});
