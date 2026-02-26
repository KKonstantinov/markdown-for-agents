import { describe, it, expect, vi } from 'vitest';
import { markdown } from '../../src/index.js';

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

    describe('Vary header', () => {
        it('sets Vary: Accept on converted responses', async () => {
            const mw = markdown();
            const c = createMockContext('text/markdown', '<h1>Title</h1>', 'text/html');

            const next = vi.fn().mockResolvedValue(undefined);
            await mw(c as any, next);

            expect(c.res.headers.get('vary')).toContain('Accept');
        });

        it('sets Vary: Accept on pass-through responses', async () => {
            const mw = markdown();
            const c = createMockContext('text/html', '<h1>Title</h1>', 'text/html');

            const next = vi.fn().mockResolvedValue(undefined);
            await mw(c as any, next);

            expect(c.res.headers.get('vary')).toContain('Accept');
        });

        it('appends to existing Vary header', async () => {
            const mw = markdown();
            const resHeaders = new Headers({
                'content-type': 'text/html',
                vary: 'Accept-Encoding'
            });
            const c = {
                req: {
                    header: (name: string): string | undefined => {
                        if (name === 'accept') return 'text/markdown';
                    }
                },
                res: new Response('<h1>Title</h1>', { headers: resHeaders })
            };

            const next = vi.fn().mockResolvedValue(undefined);
            await mw(c as any, next);

            const vary = c.res.headers.get('vary')!;
            expect(vary).toContain('Accept-Encoding');
            expect(vary).toContain('Accept');
        });
    });
});
