import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { audit } from '../../src/index.js';

describe('audit', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('fetches a URL and returns comparison', async () => {
        const html = '<html><body><nav>Nav</nav><main><h1>Title</h1><p>Content here</p></main></body></html>';
        mockFetch.mockResolvedValue(new Response(html));

        const result = await audit('https://example.com/article');

        expect(result.url).toBe('https://example.com/article');
        expect(result.html.bytes).toBeGreaterThan(0);
        expect(result.html.tokens.tokens).toBeGreaterThan(0);
        expect(result.markdown.bytes).toBeGreaterThan(0);
        expect(result.markdown.tokens.tokens).toBeGreaterThan(0);
        expect(result.markdown.bytes).toBeLessThan(result.html.bytes);
        expect(result.reduction.tokenPercent).toBeGreaterThan(0);
        expect(result.reduction.bytePercent).toBeGreaterThan(0);
    });

    it('strips non-content elements by default (extract: true)', async () => {
        mockFetch.mockResolvedValue(new Response('<html><body><nav>Nav</nav><main><h1>Title</h1></main></body></html>'));

        const result = await audit('https://example.com');

        expect(result.markdown.content).not.toContain('Nav');
        expect(result.markdown.content).toContain('Title');
    });

    it('respects extract: false option', async () => {
        mockFetch.mockResolvedValue(new Response('<html><body><nav>Nav</nav><main><h1>Title</h1></main></body></html>'));

        const result = await audit('https://example.com', { extract: false });

        expect(result.markdown.content).toContain('Nav');
        expect(result.markdown.content).toContain('Title');
    });

    it('throws on non-OK response', async () => {
        mockFetch.mockResolvedValue(new Response('Not found', { status: 404, statusText: 'Not Found' }));

        await expect(audit('https://example.com/missing')).rejects.toThrow('404');
    });

    it('sends Accept: text/html header', async () => {
        mockFetch.mockResolvedValue(new Response('<p>Hello</p>'));

        await audit('https://example.com');

        const call = mockFetch.mock.calls[0] as [string, RequestInit];
        const headers = new Headers(call[1].headers);
        expect(headers.get('accept')).toBe('text/html');
    });

    it('derives baseUrl from the URL', async () => {
        mockFetch.mockResolvedValue(new Response('<a href="/path">Link</a>'));

        const result = await audit('https://example.com/page');

        expect(result.markdown.content).toContain('https://example.com/path');
    });

    it('handles empty HTML', async () => {
        mockFetch.mockResolvedValue(new Response(''));

        const result = await audit('https://example.com');

        expect(result.html.bytes).toBe(0);
        expect(result.html.tokens.tokens).toBe(0);
        expect(result.reduction.tokenPercent).toBe(0);
        expect(result.reduction.bytePercent).toBe(0);
    });

    it('passes custom fetchOptions', async () => {
        mockFetch.mockResolvedValue(new Response('<p>Hello</p>'));

        await audit('https://example.com', {
            fetchOptions: {
                headers: { authorization: 'Bearer token123' }
            }
        });

        const call = mockFetch.mock.calls[0] as [string, RequestInit];
        const headers = new Headers(call[1].headers);
        expect(headers.get('authorization')).toBe('Bearer token123');
        expect(headers.get('accept')).toBe('text/html');
    });
});
