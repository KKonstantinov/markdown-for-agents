import { describe, it, expect } from 'vitest';
import { markdown, type MiddlewareOptions } from '../../src/index.js';

type OnSendHook = (
    request: { headers: Record<string, string | string[] | undefined> },
    reply: {
        getHeader(name: string): string | undefined;
        header(name: string, value: string): unknown;
    },
    payload: unknown
) => Promise<unknown>;

function createMockFastify() {
    const hooks: OnSendHook[] = [];

    const instance = {
        addHook(name: string, hook: OnSendHook) {
            if (name === 'onSend') {
                hooks.push(hook);
            }
        }
    };

    return { instance, hooks };
}

function createMockReply(contentType: string, extraHeaders?: Record<string, string>) {
    const headers = new Map<string, string>([['content-type', contentType]]);
    if (extraHeaders) {
        for (const [k, v] of Object.entries(extraHeaders)) headers.set(k, v);
    }

    return {
        reply: {
            getHeader: (name: string) => headers.get(name),
            header(name: string, value: string) {
                headers.set(name, value);
                return this;
            }
        },
        getHeader: (name: string) => headers.get(name)
    };
}

function invokeHook(options?: MiddlewareOptions) {
    const plugin = markdown(options);
    const { instance, hooks } = createMockFastify();
    plugin(instance as never, {}, () => {});
    const hook = hooks[0];

    return async (accept: string | undefined, contentType: string, payload: unknown, extraHeaders?: Record<string, string>) => {
        const headers: Record<string, string | undefined> = accept === undefined ? {} : { accept };
        const request = { headers };
        const { reply, getHeader } = createMockReply(contentType, extraHeaders);
        const result = await hook(request, reply, payload);
        return { result, getHeader };
    };
}

describe('fastify middleware', () => {
    it('registers an onSend hook', () => {
        const plugin = markdown();
        const { instance, hooks } = createMockFastify();
        plugin(instance as never, {}, () => {});
        expect(hooks).toHaveLength(1);
    });

    it('converts HTML to markdown when Accept: text/markdown', async () => {
        const send = invokeHook();
        const { result, getHeader } = await send('text/markdown', 'text/html', '<h1>Title</h1><p>Body</p>');

        expect(result).toContain('# Title');
        expect(result).toContain('Body');
        expect(getHeader('content-type')).toBe('text/markdown; charset=utf-8');
        expect(getHeader('x-markdown-tokens')).toBeTruthy();
    });

    it('passes through when Accept is not text/markdown', async () => {
        const send = invokeHook();
        const { result } = await send('text/html', 'text/html', '<h1>Title</h1>');
        expect(result).toBe('<h1>Title</h1>');
    });

    it('passes through non-HTML responses', async () => {
        const send = invokeHook();
        const { result, getHeader } = await send('text/markdown', 'application/json', '{"ok":true}');

        expect(result).toBe('{"ok":true}');
        expect(getHeader('content-type')).toBe('application/json');
    });

    it('passes through non-string payloads', async () => {
        const send = invokeHook();
        const buffer = Buffer.from('<h1>Title</h1>');
        const { result } = await send('text/markdown', 'text/html', buffer);
        expect(result).toBe(buffer);
    });

    it('supports custom token header', async () => {
        const send = invokeHook({ tokenHeader: 'x-tokens' });
        const { getHeader } = await send('text/markdown', 'text/html', '<p>Hello</p>');

        expect(getHeader('x-tokens')).toBeTruthy();
        expect(getHeader('x-markdown-tokens')).toBeUndefined();
    });

    it('forwards convert options', async () => {
        const send = invokeHook({ extract: true });
        const { result } = await send(
            'text/markdown',
            'text/html',
            '<nav><a href="/">Home</a></nav><main><p>Content</p></main><footer>Footer</footer>'
        );

        expect(result).toContain('Content');
        expect(result).not.toContain('Home');
        expect(result).not.toContain('Footer');
    });

    it('handles missing accept header', async () => {
        const send = invokeHook();
        const { result } = await send(undefined, 'text/html', '<h1>Title</h1>');
        expect(result).toBe('<h1>Title</h1>');
    });

    describe('ETag header', () => {
        it('sets ETag on converted responses', async () => {
            const send = invokeHook();
            const { getHeader } = await send('text/markdown', 'text/html', '<h1>Title</h1>');
            expect(getHeader('etag')).toMatch(/^".+"$/);
        });

        it('does not set ETag on pass-through responses', async () => {
            const send = invokeHook();
            const { getHeader } = await send('text/html', 'text/html', '<h1>Title</h1>');
            expect(getHeader('etag')).toBeUndefined();
        });

        it('produces the same ETag for identical content', async () => {
            const send = invokeHook();
            const a = await send('text/markdown', 'text/html', '<p>Hello</p>');
            const b = await send('text/markdown', 'text/html', '<p>Hello</p>');
            expect(a.getHeader('etag')).toBe(b.getHeader('etag'));
        });
    });

    describe('Content-Signal header', () => {
        it('sets content-signal on converted responses when configured', async () => {
            const send = invokeHook({ contentSignal: { aiTrain: true, search: true, aiInput: true } });
            const { getHeader } = await send('text/markdown', 'text/html', '<h1>Title</h1>');
            expect(getHeader('content-signal')).toBe('ai-train=yes, search=yes, ai-input=yes');
        });

        it('does not set content-signal when not configured', async () => {
            const send = invokeHook();
            const { getHeader } = await send('text/markdown', 'text/html', '<h1>Title</h1>');
            expect(getHeader('content-signal')).toBeUndefined();
        });

        it('does not set content-signal on pass-through responses', async () => {
            const send = invokeHook({ contentSignal: { aiTrain: true } });
            const { getHeader } = await send('text/html', 'text/html', '<h1>Title</h1>');
            expect(getHeader('content-signal')).toBeUndefined();
        });
    });

    describe('Vary header', () => {
        it('sets Vary: Accept on converted responses', async () => {
            const send = invokeHook();
            const { getHeader } = await send('text/markdown', 'text/html', '<h1>Title</h1>');
            expect(getHeader('vary')).toBe('Accept');
        });

        it('sets Vary: Accept on pass-through responses', async () => {
            const send = invokeHook();
            const { getHeader } = await send('text/html', 'text/html', '<h1>Title</h1>');
            expect(getHeader('vary')).toBe('Accept');
        });

        it('appends to existing Vary header', async () => {
            const send = invokeHook();
            const { getHeader } = await send('text/markdown', 'text/html', '<h1>Title</h1>', { vary: 'Accept-Encoding' });
            expect(getHeader('vary')).toBe('Accept-Encoding, Accept');
        });
    });
});
