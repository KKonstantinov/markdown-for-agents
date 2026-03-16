import { describe, it, expect } from 'vitest';

const baseUrl = process.env['TEST_BASE_URL']!;

describe('express middleware (/, /about, /article)', () => {
    it('returns HTML for normal requests to /', async () => {
        const res = await fetch(baseUrl, { headers: { accept: 'text/html' } });
        const body = await res.text();

        expect(res.headers.get('content-type')).toContain('text/html');
        expect(body).toContain('Welcome');
    });

    it('converts / to markdown', async () => {
        const res = await fetch(baseUrl, { headers: { accept: 'text/markdown' } });
        const body = await res.text();

        expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
        expect(body).toContain('# Welcome');
        expect(body).toContain('**markdown-for-agents**');
    });

    it('sets x-markdown-tokens on markdown responses', async () => {
        const res = await fetch(baseUrl, { headers: { accept: 'text/markdown' } });

        const tokens = Number(res.headers.get('x-markdown-tokens'));
        expect(tokens).toBeGreaterThan(0);
    });

    it('returns HTML for normal requests to /about', async () => {
        const res = await fetch(`${baseUrl}/about`, { headers: { accept: 'text/html' } });
        const body = await res.text();

        expect(res.headers.get('content-type')).toContain('text/html');
        expect(body).toContain('About');
    });

    it('converts /about to markdown', async () => {
        const res = await fetch(`${baseUrl}/about`, { headers: { accept: 'text/markdown' } });
        const body = await res.text();

        expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
        expect(body).toContain('# About');
        expect(body).toContain('**middleware pattern**');
    });

    it('converts /article to markdown', async () => {
        const res = await fetch(`${baseUrl}/article`, { headers: { accept: 'text/markdown' } });
        const body = await res.text();

        expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
        expect(body).toContain('# Sample Article');
        expect(body).toContain('**sample article**');
    });
});
