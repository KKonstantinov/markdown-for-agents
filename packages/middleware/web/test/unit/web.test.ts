import { describe, it, expect } from 'vitest';
import { markdownMiddleware } from '../../src/index.js';
import { describeContentSignalHeader, describeVaryHeader, type HeaderTestHarness } from '../../../header-test-helpers.js';

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

    const webHarness: HeaderTestHarness = {
        async send(options, accept, contentType, body, extraHeaders) {
            const mw = markdownMiddleware(options);
            const req = new Request('https://example.com', {
                headers: { accept }
            });
            const handler = () =>
                new Response(body, {
                    headers: { 'content-type': contentType, ...extraHeaders }
                });
            const res = await mw(req, handler);
            return { getHeader: (name: string) => res.headers.get(name) };
        }
    };

    describeContentSignalHeader(webHarness);
    describeVaryHeader(webHarness);
});
