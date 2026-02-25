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
});
