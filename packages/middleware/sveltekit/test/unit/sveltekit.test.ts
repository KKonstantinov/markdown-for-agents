import { describe, it, expect, vi } from 'vitest';
import type { Handle } from '@sveltejs/kit';
import { markdown } from '../../src/index.js';
import { describeContentSignalHeader, describeServerTimingHeader, describeVaryHeader } from '../../../header-test-helpers.js';
import type { HeaderTestHarness } from '../../../header-test-helpers.js';

type HandleInput = Parameters<Handle>[0];
type MockEvent = HandleInput['event'];
type MockResolve = HandleInput['resolve'];

function createEvent(accept: string): MockEvent {
    return {
        request: new Request('https://example.com/page', {
            headers: { accept }
        })
    } as MockEvent;
}

function createResolve(body: string, contentType: string, extraHeaders?: Record<string, string>): MockResolve {
    return vi.fn(async () => {
        const headers = new Headers({ 'content-type': contentType });
        if (extraHeaders) {
            for (const [key, value] of Object.entries(extraHeaders)) {
                headers.set(key, value);
            }
        }
        return new Response(body, { headers });
    }) as MockResolve;
}

describe('sveltekit middleware', () => {
    it('converts HTML to markdown when Accept: text/markdown', async () => {
        const handle = markdown();
        const resolve = createResolve('<h1>Title</h1><p>Body</p>', 'text/html');

        const response = await handle({ event: createEvent('text/markdown'), resolve });
        const body = await response.text();

        expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
        expect(response.headers.get('x-markdown-tokens')).toBeTruthy();
        expect(body).toContain('# Title');
        expect(body).toContain('Body');
    });

    it('passes through when Accept is not text/markdown', async () => {
        const handle = markdown();
        const resolve = createResolve('<h1>Title</h1>', 'text/html');

        const response = await handle({ event: createEvent('text/html'), resolve });

        expect(response.headers.get('content-type')).toBe('text/html');
        expect(await response.text()).toContain('<h1>Title</h1>');
    });

    it('passes through JSON endpoints even when Accept requests markdown', async () => {
        const handle = markdown();
        const resolve = createResolve('{"ok":true}', 'application/json');

        const response = await handle({ event: createEvent('text/markdown'), resolve });

        expect(response.headers.get('content-type')).toBe('application/json');
        expect(await response.json()).toEqual({ ok: true });
    });

    it('forwards SvelteKit resolve options', async () => {
        const transformPageChunk = ({ html }: { html: string }) => html;
        const handle = markdown({ resolveOptions: { transformPageChunk } });
        const resolve = createResolve('<h1>Title</h1>', 'text/html');
        const event = createEvent('text/html');

        await handle({ event, resolve });

        expect(resolve).toHaveBeenCalledWith(event, { transformPageChunk });
    });

    it('supports custom token header name', async () => {
        const handle = markdown({ tokenHeader: 'x-tokens' });
        const resolve = createResolve('<p>Hello</p>', 'text/html');

        const response = await handle({ event: createEvent('text/markdown'), resolve });

        expect(response.headers.get('x-tokens')).toBeTruthy();
        expect(response.headers.get('x-markdown-tokens')).toBeNull();
    });

    it('preserves redirect responses', async () => {
        const handle = markdown();
        const resolve = vi.fn(async () => Response.redirect('https://example.com/login', 302)) as MockResolve;

        const response = await handle({ event: createEvent('text/markdown'), resolve });

        expect(response.status).toBe(302);
        expect(response.headers.get('location')).toBe('https://example.com/login');
    });

    const svelteKitHarness: HeaderTestHarness = {
        async send(options, accept, contentType, body, extraHeaders) {
            const handle = markdown(options);
            const response = await handle({ event: createEvent(accept), resolve: createResolve(body, contentType, extraHeaders) });
            return { getHeader: (name: string) => response.headers.get(name) };
        }
    };

    describeContentSignalHeader(svelteKitHarness);
    describeServerTimingHeader(svelteKitHarness);
    describeVaryHeader(svelteKitHarness);
});
