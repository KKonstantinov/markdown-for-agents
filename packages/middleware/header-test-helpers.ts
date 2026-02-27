import { describe, it, expect } from 'vitest';
import type { MiddlewareOptions } from '../core/src/index.js';

export interface HeaderTestHarness {
    send: (
        options: MiddlewareOptions | undefined,
        accept: string,
        contentType: string,
        body: string,
        extraHeaders?: Record<string, string>
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
