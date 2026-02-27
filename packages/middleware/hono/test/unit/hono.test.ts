import { describe, it, expect, vi } from 'vitest';
import { markdown } from '../../src/index.js';
import { describeContentSignalHeader, describeVaryHeader, type HeaderTestHarness } from '../../../header-test-helpers.js';

// Minimal mock of Hono's Context for testing
function createMockContext(acceptHeader: string, responseBody: string, responseContentType: string) {
    const resHeaders = new Headers({
        'content-type': responseContentType
    });

    const context = {
        req: {
            header: (name: string): string | undefined => {
                if (name === 'accept') return acceptHeader;
            }
        },
        res: new Response(responseBody, { headers: resHeaders })
    };

    return context;
}

describe('hono middleware', () => {
    it('converts HTML to markdown when Accept: text/markdown', async () => {
        const mw = markdown();
        const c = createMockContext('text/markdown', '<h1>Title</h1><p>Body</p>', 'text/html');

        const next = vi.fn().mockResolvedValue(undefined);
        await mw(c as any, next);

        const body = await c.res.text();
        expect(body).toContain('# Title');
        expect(body).toContain('Body');
        expect(c.res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
        expect(c.res.headers.get('x-markdown-tokens')).toBeTruthy();
    });

    it('passes through when Accept is not text/markdown', async () => {
        const mw = markdown();
        const c = createMockContext('text/html', '<h1>Title</h1>', 'text/html');

        const next = vi.fn().mockResolvedValue(undefined);
        await mw(c as any, next);

        // next() was called, but res was not replaced
        expect(next).toHaveBeenCalled();
    });

    it('passes through non-HTML responses', async () => {
        const mw = markdown();
        const c = createMockContext('text/markdown', '{"ok":true}', 'application/json');

        const next = vi.fn().mockResolvedValue(undefined);
        await mw(c as any, next);

        expect(c.res.headers.get('content-type')).toBe('application/json');
    });

    it('supports custom token header', async () => {
        const mw = markdown({ tokenHeader: 'x-tokens' });
        const c = createMockContext('text/markdown', '<p>Hello</p>', 'text/html');

        const next = vi.fn().mockResolvedValue(undefined);
        await mw(c as any, next);

        expect(c.res.headers.get('x-tokens')).toBeTruthy();
        expect(c.res.headers.get('x-markdown-tokens')).toBeNull();
    });

    describe('ETag header', () => {
        it('sets ETag on converted responses', async () => {
            const mw = markdown();
            const c = createMockContext('text/markdown', '<h1>Title</h1>', 'text/html');

            const next = vi.fn().mockResolvedValue(undefined);
            await mw(c as any, next);

            expect(c.res.headers.get('etag')).toMatch(/^".+"$/);
        });

        it('does not set ETag on pass-through responses', async () => {
            const mw = markdown();
            const c = createMockContext('text/html', '<h1>Title</h1>', 'text/html');

            const next = vi.fn().mockResolvedValue(undefined);
            await mw(c as any, next);

            expect(c.res.headers.get('etag')).toBeNull();
        });
    });

    const honoHarness: HeaderTestHarness = {
        async send(options, accept, contentType, body, extraHeaders) {
            const mw = markdown(options);
            const resHeaders = new Headers({ 'content-type': contentType });
            if (extraHeaders) {
                for (const [k, v] of Object.entries(extraHeaders)) {
                    resHeaders.set(k, v);
                }
            }
            const c = {
                req: {
                    header: (name: string): string | undefined => {
                        if (name === 'accept') return accept;
                    }
                },
                res: new Response(body, { headers: resHeaders })
            };
            const next = vi.fn().mockResolvedValue(undefined);
            await mw(c as any, next);
            return { getHeader: (name: string) => c.res.headers.get(name) };
        }
    };

    describeContentSignalHeader(honoHarness);
    describeVaryHeader(honoHarness);
});
