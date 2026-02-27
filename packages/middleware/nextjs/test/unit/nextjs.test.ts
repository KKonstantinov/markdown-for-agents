import { describe, it, expect } from 'vitest';
import { convert } from 'markdown-for-agents';
import { withMarkdown, nextImageRule } from '../../src/index.js';
import { describeContentSignalHeader, describeVaryHeader } from '../../../header-test-helpers.js';
import type { HeaderTestHarness } from '../../../header-test-helpers.js';

const htmlHandler = async () =>
    new Response('<h1>Title</h1><p>Body</p>', {
        headers: { 'content-type': 'text/html' }
    });

describe('nextjs middleware', () => {
    it('converts HTML to markdown when Accept: text/markdown', async () => {
        const handler = withMarkdown(htmlHandler);
        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        const body = await response!.text();

        expect(response!.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
        expect(response!.headers.get('x-markdown-tokens')).toBeTruthy();
        expect(body).toContain('# Title');
        expect(body).toContain('Body');
    });

    it('passes through when Accept is not text/markdown', async () => {
        const handler = withMarkdown(htmlHandler);
        const request = new Request('https://example.com', {
            headers: { accept: 'text/html' }
        });

        const response = await handler(request);
        expect(response!.headers.get('content-type')).toBe('text/html');
    });

    it('passes through non-HTML responses', async () => {
        const jsonHandler = async () =>
            new Response('{"ok":true}', {
                headers: { 'content-type': 'application/json' }
            });

        const handler = withMarkdown(jsonHandler);
        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        expect(response!.headers.get('content-type')).toBe('application/json');
    });

    it('handles null response from handler', async () => {
        const nullHandler = async () => null;
        const handler = withMarkdown(nullHandler);
        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        expect(response).toBeNull();
    });

    it('supports custom token header', async () => {
        const handler = withMarkdown(htmlHandler, { tokenHeader: 'x-tokens' });
        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        expect(response!.headers.get('x-tokens')).toBeTruthy();
        expect(response!.headers.get('x-markdown-tokens')).toBeNull();
    });

    it('auto-includes nextImageRule for /_next/image URLs', async () => {
        const nextImageHandler = async () =>
            new Response('<img src="/_next/image?url=%2Fphoto.png&w=640&q=75" alt="Photo">', { headers: { 'content-type': 'text/html' } });

        const handler = withMarkdown(nextImageHandler, {
            baseUrl: 'https://example.com'
        });
        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        const body = await response!.text();
        expect(body).toContain('![Photo](https://example.com/photo.png)');
    });
});

const nextjsHarness: HeaderTestHarness = {
    async send(options, accept, contentType, body, extraHeaders) {
        const innerHandler = async () =>
            new Response(body, {
                headers: { 'content-type': contentType, ...extraHeaders }
            });
        const handler = withMarkdown(innerHandler, options);
        const request = new Request('https://example.com', {
            headers: { accept }
        });
        const response = await handler(request);
        return { getHeader: (name: string) => response!.headers.get(name) };
    }
};

describeContentSignalHeader(nextjsHarness);

describe('ETag header', () => {
    it('sets ETag on converted responses', async () => {
        const handler = withMarkdown(htmlHandler);
        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        expect(response!.headers.get('etag')).toMatch(/^".+"$/);
    });

    it('does not set ETag on pass-through responses', async () => {
        const handler = withMarkdown(htmlHandler);
        const request = new Request('https://example.com', {
            headers: { accept: 'text/html' }
        });

        const response = await handler(request);
        expect(response!.headers.get('etag')).toBeNull();
    });
});

describeVaryHeader(nextjsHarness);

describe('Vary header (nextjs-specific)', () => {
    it('sets Vary: Accept on non-HTML responses', async () => {
        const jsonHandler = async () =>
            new Response('{"ok":true}', {
                headers: { 'content-type': 'application/json' }
            });

        const handler = withMarkdown(jsonHandler);
        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        expect(response!.headers.get('vary')).toContain('Accept');
    });
});

describe('streamed metadata (Next.js App Router)', () => {
    it('extracts metadata streamed outside <head>', async () => {
        const streamingHandler = async () =>
            new Response(
                '<html><head></head><body><div>Content</div><title>Streamed Title</title><meta name="description" content="Streamed desc"><meta property="og:image" content="https://example.com/img.png"></body></html>',
                { headers: { 'content-type': 'text/html' } }
            );

        const handler = withMarkdown(streamingHandler);
        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        const body = await response!.text();
        expect(body).toContain('title: Streamed Title');
        expect(body).toContain('description: Streamed desc');
        expect(body).toContain('image: https://example.com/img.png');
    });

    it('user-provided frontmatter overrides streamed metadata', async () => {
        const streamingHandler = async () =>
            new Response('<html><head></head><body><title>Streamed</title></body></html>', { headers: { 'content-type': 'text/html' } });

        const handler = withMarkdown(streamingHandler, {
            frontmatter: { title: 'Custom Title', author: 'Alice' }
        });
        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        const body = await response!.text();
        expect(body).toContain('title: Custom Title');
        expect(body).toContain('author: Alice');
        expect(body).not.toContain('Streamed');
    });

    it('respects frontmatter: false with streamed tags', async () => {
        const streamingHandler = async () =>
            new Response('<html><head></head><body><title>Streamed</title></body></html>', { headers: { 'content-type': 'text/html' } });

        const handler = withMarkdown(streamingHandler, { frontmatter: false });
        const request = new Request('https://example.com', {
            headers: { accept: 'text/markdown' }
        });

        const response = await handler(request);
        const body = await response!.text();
        expect(body).not.toContain('---');
        expect(body).not.toContain('Streamed');
    });
});

describe('nextImageRule', () => {
    it('extracts original URL from /_next/image path', () => {
        const { markdown } = convert('<img src="/_next/image?url=%2Fphoto.png&w=640&q=75" alt="Photo">', {
            baseUrl: 'https://example.com',
            rules: [nextImageRule]
        });
        expect(markdown).toContain('![Photo](https://example.com/photo.png)');
    });

    it('extracts encoded external URL from /_next/image', () => {
        const { markdown } = convert('<img src="/_next/image?url=https%3A%2F%2Fcdn.example.com%2Fimg.jpg&w=1200&q=80" alt="CDN Image">', {
            rules: [nextImageRule]
        });
        expect(markdown).toContain('![CDN Image](https://cdn.example.com/img.jpg)');
    });

    it('falls back to default img rule if url param is missing', () => {
        const { markdown } = convert('<img src="/_next/image?w=640&q=75" alt="No URL">', {
            baseUrl: 'https://example.com',
            rules: [nextImageRule]
        });
        expect(markdown).toContain('https://example.com/_next/image');
    });

    it('does not affect non-Next.js image URLs', () => {
        const { markdown } = convert('<img src="/images/photo.png" alt="Normal">', {
            baseUrl: 'https://example.com',
            rules: [nextImageRule]
        });
        expect(markdown).toContain('![Normal](https://example.com/images/photo.png)');
    });
});
