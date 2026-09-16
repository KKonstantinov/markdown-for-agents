import { describe, it, expect } from 'vitest';
import type { Handle } from '@sveltejs/kit';
import { markdown } from '../../src/index.js';

const handle = markdown({
    extract: true,
    serverTiming: true
});

function resolve(event: Parameters<Handle>[0]['event']): Response {
    if (new URL(event.request.url).pathname === '/json') {
        return Response.json({ message: 'hello' });
    }

    return new Response(
        `
        <html>
            <body>
                <nav><a href="/">Home</a></nav>
                <main>
                    <h1>Hello World</h1>
                    <p>This is a <strong>real</strong> SvelteKit response.</p>
                </main>
                <footer>Copyright</footer>
            </body>
        </html>
    `,
        {
            headers: { 'content-type': 'text/html; charset=utf-8' }
        }
    );
}

async function request(path: string, accept: string): Promise<Response> {
    return handle({
        event: {
            request: new Request(`https://example.com${path}`, {
                headers: { accept }
            })
        } as Parameters<Handle>[0]['event'],
        resolve
    });
}

describe('sveltekit middleware integration', () => {
    it('converts an HTML response through a real SvelteKit handle sequence', async () => {
        const response = await request('/', 'text/markdown');
        const body = await response.text();

        expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
        expect(response.headers.get('server-timing')).toMatch(/mfa\.convert;dur=[\d.]+;desc="HTML to Markdown"/);
        expect(body).toContain('# Hello World');
        expect(body).toContain('**real**');
        expect(body).not.toContain('Home');
        expect(body).not.toContain('Copyright');
    });

    it('returns HTML for ordinary browser requests', async () => {
        const response = await request('/', 'text/html');
        const body = await response.text();

        expect(response.headers.get('content-type')).toContain('text/html');
        expect(body).toContain('<h1>Hello World</h1>');
    });

    it('does not convert JSON endpoint responses', async () => {
        const response = await request('/json', 'text/markdown');

        expect(response.headers.get('content-type')).toBe('application/json');
        expect(await response.json()).toEqual({ message: 'hello' });
    });
});
