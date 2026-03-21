import { describe, it, expect } from 'vitest';
import type { MiddlewareOptions } from '../core/src/index.js';

export interface HeaderTestHarness {
    send: (
        options: MiddlewareOptions | undefined,
        accept: string,
        contentType: string,
        body: string,
        extraHeaders?: Record<string, string>,
        requestHeaders?: Record<string, string>
    ) => Promise<{ getHeader: (name: string) => string | null | undefined }>;
}

export function describeContentSignalHeader(harness: HeaderTestHarness): void {
    describe('Content-Signal header', () => {
        it('sets content-signal on converted responses when configured', async () => {
            const { getHeader } = await harness.send(
                { contentSignal: { aiTrain: true, search: true, aiInput: true } },
                'text/markdown',
                'text/html',
                '<h1>Title</h1>'
            );
            expect(getHeader('content-signal')).toBe('ai-train=yes, search=yes, ai-input=yes');
        });

        it('does not set content-signal when not configured', async () => {
            const { getHeader } = await harness.send(undefined, 'text/markdown', 'text/html', '<h1>Title</h1>');
            expect(getHeader('content-signal')).toBeFalsy();
        });

        it('does not set content-signal on pass-through responses', async () => {
            const { getHeader } = await harness.send({ contentSignal: { aiTrain: true } }, 'text/html', 'text/html', '<h1>Title</h1>');
            expect(getHeader('content-signal')).toBeFalsy();
        });
    });
}

export function describeServerTimingHeader(harness: HeaderTestHarness): void {
    describe('Server-Timing header', () => {
        it('includes mfa.convert timing when serverTiming is enabled', async () => {
            const { getHeader } = await harness.send({ serverTiming: true }, 'text/markdown', 'text/html', '<h1>Title</h1>');
            const timing = getHeader('server-timing');
            expect(timing).toMatch(/mfa\.convert;dur=[\d.]+;desc="HTML to Markdown"/);
        });

        it('does not set Server-Timing when serverTiming is disabled', async () => {
            const { getHeader } = await harness.send(undefined, 'text/markdown', 'text/html', '<h1>Title</h1>');
            expect(getHeader('server-timing')).toBeFalsy();
        });

        it('does not set Server-Timing on pass-through responses', async () => {
            const { getHeader } = await harness.send({ serverTiming: true }, 'text/html', 'text/html', '<h1>Title</h1>');
            expect(getHeader('server-timing')).toBeFalsy();
        });
    });

    describe('x-markdown-timing header', () => {
        it('sets x-markdown-timing alongside Server-Timing when serverTiming is enabled', async () => {
            const { getHeader } = await harness.send({ serverTiming: true }, 'text/markdown', 'text/html', '<h1>Title</h1>');
            const timing = getHeader('x-markdown-timing');
            expect(timing).toMatch(/mfa\.convert;dur=[\d.]+;desc="HTML to Markdown"/);
        });

        it('does not set x-markdown-timing when serverTiming is disabled', async () => {
            const { getHeader } = await harness.send(undefined, 'text/markdown', 'text/html', '<h1>Title</h1>');
            expect(getHeader('x-markdown-timing')).toBeFalsy();
        });

        it('does not set x-markdown-timing on pass-through responses', async () => {
            const { getHeader } = await harness.send({ serverTiming: true }, 'text/html', 'text/html', '<h1>Title</h1>');
            expect(getHeader('x-markdown-timing')).toBeFalsy();
        });

        it('uses custom timingHeader name when provided', async () => {
            const { getHeader } = await harness.send(
                { serverTiming: true, timingHeader: 'x-custom-timing' },
                'text/markdown',
                'text/html',
                '<h1>Title</h1>'
            );
            expect(getHeader('x-custom-timing')).toMatch(/mfa\.convert;dur=[\d.]+;desc="HTML to Markdown"/);
            expect(getHeader('x-markdown-timing')).toBeFalsy();
        });
    });
}

export function describeVaryHeader(harness: HeaderTestHarness): void {
    describe('Vary header', () => {
        it('sets Vary: Accept on converted responses', async () => {
            const { getHeader } = await harness.send(undefined, 'text/markdown', 'text/html', '<h1>Title</h1>');
            expect(getHeader('vary')).toContain('Accept');
        });

        it('sets Vary: Accept on pass-through responses', async () => {
            const { getHeader } = await harness.send(undefined, 'text/html', 'text/html', '<h1>Title</h1>');
            expect(getHeader('vary')).toContain('Accept');
        });

        it('appends to existing Vary header', async () => {
            const { getHeader } = await harness.send(undefined, 'text/markdown', 'text/html', '<h1>Title</h1>', {
                vary: 'Accept-Encoding'
            });
            const vary = getHeader('vary')!;
            expect(vary).toContain('Accept-Encoding');
            expect(vary).toContain('Accept');
        });
    });
}

export function describeDetectAgentsHeader(harness: HeaderTestHarness): void {
    describe('detectAgents', () => {
        it('converts when user-agent matches a known bot and detectAgents is true', async () => {
            const { getHeader } = await harness.send({ detectAgents: true }, 'text/html', 'text/html', '<h1>Title</h1>', undefined, {
                'user-agent': 'Mozilla/5.0 (compatible; ClaudeBot/1.0)'
            });
            expect(getHeader('content-type')).toBe('text/markdown; charset=utf-8');
        });

        it('does not convert for unknown user-agent when detectAgents is true', async () => {
            const { getHeader } = await harness.send({ detectAgents: true }, 'text/html', 'text/html', '<h1>Title</h1>', undefined, {
                'user-agent': 'Mozilla/5.0 Chrome/120'
            });
            expect(getHeader('content-type')).toContain('text/html');
        });

        it('still converts for Accept: text/markdown regardless of user-agent', async () => {
            const { getHeader } = await harness.send({ detectAgents: true }, 'text/markdown', 'text/html', '<h1>Title</h1>', undefined, {
                'user-agent': 'Mozilla/5.0 Chrome/120'
            });
            expect(getHeader('content-type')).toBe('text/markdown; charset=utf-8');
        });

        it('converts for custom string[] patterns', async () => {
            const { getHeader } = await harness.send(
                { detectAgents: ['mycustombot'] },
                'text/html',
                'text/html',
                '<h1>Title</h1>',
                undefined,
                { 'user-agent': 'MyCustomBot/1.0' }
            );
            expect(getHeader('content-type')).toBe('text/markdown; charset=utf-8');
        });

        it('includes User-Agent in Vary when detectAgents is enabled (converted)', async () => {
            const { getHeader } = await harness.send({ detectAgents: true }, 'text/markdown', 'text/html', '<h1>Title</h1>');
            expect(getHeader('vary')).toContain('User-Agent');
        });

        it('includes User-Agent in Vary when detectAgents is enabled (pass-through)', async () => {
            const { getHeader } = await harness.send({ detectAgents: true }, 'text/html', 'text/html', '<h1>Title</h1>');
            expect(getHeader('vary')).toContain('User-Agent');
        });

        it('does not include User-Agent in Vary when detectAgents is disabled', async () => {
            const { getHeader } = await harness.send(undefined, 'text/markdown', 'text/html', '<h1>Title</h1>');
            const vary = getHeader('vary') ?? '';
            expect(vary).not.toContain('User-Agent');
        });
    });
}
