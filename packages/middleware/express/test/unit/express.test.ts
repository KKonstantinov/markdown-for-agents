import { describe, it, expect, vi } from 'vitest';
import { markdown } from '../../src/index.js';
import { describeContentSignalHeader, describeVaryHeader, type HeaderTestHarness } from '../../../header-test-helpers.js';

function createMockReqRes(acceptHeader: string, contentType: string) {
    const req = {
        headers: { accept: acceptHeader } as Record<string, string | string[] | undefined>
    };

    const sentHeaders = new Map<string, string | number>([['content-type', contentType]]);

    let sentBody: unknown;

    const res = {
        getHeader: (name: string) => sentHeaders.get(name),
        setHeader(name: string, value: string | number) {
            sentHeaders.set(name, value);
            return res;
        },
        send(body?: unknown) {
            sentBody = body;
            return res;
        }
    };

    return {
        req,
        res,
        getSentBody: () => sentBody,
        getSentHeader: (name: string) => sentHeaders.get(name)
    };
}

describe('express middleware', () => {
    it('converts HTML to markdown when Accept: text/markdown', () => {
        const mw = markdown();
        const { req, res, getSentBody, getSentHeader } = createMockReqRes('text/markdown', 'text/html');
        const next = vi.fn();

        mw(req, res, next);
        expect(next).toHaveBeenCalled();

        // Simulate Express calling res.send with HTML
        res.send('<h1>Title</h1><p>Body</p>');

        expect(getSentBody()).toContain('# Title');
        expect(getSentBody()).toContain('Body');
        expect(getSentHeader('content-type')).toBe('text/markdown; charset=utf-8');
        expect(getSentHeader('x-markdown-tokens')).toBeTruthy();
    });

    it('passes through when Accept is not text/markdown', () => {
        const mw = markdown();
        const { req, res, getSentBody } = createMockReqRes('text/html', 'text/html');
        const next = vi.fn();

        mw(req, res, next);
        expect(next).toHaveBeenCalled();

        // res.send should not have been overridden
        res.send('<h1>Title</h1>');
        expect(getSentBody()).toBe('<h1>Title</h1>');
    });

    it('passes through non-HTML responses', () => {
        const mw = markdown();
        const { req, res, getSentBody, getSentHeader } = createMockReqRes('text/markdown', 'application/json');
        const next = vi.fn();

        mw(req, res, next);
        res.send('{"ok":true}');

        expect(getSentBody()).toBe('{"ok":true}');
        expect(getSentHeader('content-type')).toBe('application/json');
    });

    it('passes through non-string body', () => {
        const mw = markdown();
        const { req, res, getSentBody } = createMockReqRes('text/markdown', 'text/html');
        const next = vi.fn();

        mw(req, res, next);
        const buffer = Buffer.from('<h1>Title</h1>');
        res.send(buffer);

        expect(getSentBody()).toBe(buffer);
    });

    it('supports custom token header', () => {
        const mw = markdown({ tokenHeader: 'x-tokens' });
        const { req, res, getSentHeader } = createMockReqRes('text/markdown', 'text/html');
        const next = vi.fn();

        mw(req, res, next);
        res.send('<p>Hello</p>');

        expect(getSentHeader('x-tokens')).toBeTruthy();
        expect(getSentHeader('x-markdown-tokens')).toBeUndefined();
    });

    it('forwards convert options', () => {
        const mw = markdown({ extract: true });
        const { req, res, getSentBody } = createMockReqRes('text/markdown', 'text/html');
        const next = vi.fn();

        mw(req, res, next);
        res.send('<nav><a href="/">Home</a></nav><main><p>Content</p></main><footer>Footer</footer>');

        const body = getSentBody() as string;
        expect(body).toContain('Content');
        expect(body).not.toContain('Home');
        expect(body).not.toContain('Footer');
    });

    it('handles missing accept header', () => {
        const mw = markdown();
        const { req, res, getSentBody } = createMockReqRes('text/html', 'text/html');
        req.headers.accept = undefined;
        const next = vi.fn();

        mw(req, res, next);
        expect(next).toHaveBeenCalled();

        res.send('<h1>Title</h1>');
        expect(getSentBody()).toBe('<h1>Title</h1>');
    });

    describe('ETag header', () => {
        it('sets ETag on converted responses', () => {
            const mw = markdown();
            const { req, res, getSentHeader } = createMockReqRes('text/markdown', 'text/html');
            const next = vi.fn();

            mw(req, res, next);
            res.send('<h1>Title</h1>');

            const etag = getSentHeader('etag') as string;
            expect(etag).toMatch(/^".+"$/);
        });

        it('does not set ETag on pass-through responses', () => {
            const mw = markdown();
            const { req, res, getSentHeader } = createMockReqRes('text/html', 'text/html');
            const next = vi.fn();

            mw(req, res, next);
            res.send('<h1>Title</h1>');

            expect(getSentHeader('etag')).toBeUndefined();
        });

        it('produces the same ETag for identical content', () => {
            const mw = markdown();
            const next = vi.fn();

            const a = createMockReqRes('text/markdown', 'text/html');
            mw(a.req, a.res, next);
            a.res.send('<p>Hello</p>');

            const b = createMockReqRes('text/markdown', 'text/html');
            mw(b.req, b.res, next);
            b.res.send('<p>Hello</p>');

            expect(a.getSentHeader('etag')).toBe(b.getSentHeader('etag'));
        });

        it('produces different ETags for different content', () => {
            const mw = markdown();
            const next = vi.fn();

            const a = createMockReqRes('text/markdown', 'text/html');
            mw(a.req, a.res, next);
            a.res.send('<p>Hello</p>');

            const b = createMockReqRes('text/markdown', 'text/html');
            mw(b.req, b.res, next);
            b.res.send('<p>World</p>');

            expect(a.getSentHeader('etag')).not.toBe(b.getSentHeader('etag'));
        });
    });

    const expressHarness: HeaderTestHarness = {
        async send(options, accept, contentType, body, extraHeaders) {
            const mw = markdown(options);
            const { req, res, getSentHeader } = createMockReqRes(accept, contentType);
            if (extraHeaders) {
                for (const [k, v] of Object.entries(extraHeaders)) {
                    res.setHeader(k, v);
                }
            }
            const next = vi.fn();
            mw(req, res, next);
            res.send(body);
            return { getHeader: (name: string) => getSentHeader(name) as string | undefined };
        }
    };

    describeContentSignalHeader(expressHarness);
    describeVaryHeader(expressHarness);
});
