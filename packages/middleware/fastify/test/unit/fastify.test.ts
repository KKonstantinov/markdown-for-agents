import { describe, it, expect } from 'vitest';
import { markdown } from '../../src/index.js';

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

function createMockReply(contentType: string) {
    const headers = new Map<string, string>([['content-type', contentType]]);

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

describe('fastify middleware', () => {
    it('registers an onSend hook', () => {
        const plugin = markdown();
        const { instance, hooks } = createMockFastify();
        const done = () => {};

        plugin(instance as never, {}, done);

        expect(hooks).toHaveLength(1);
    });

    it('converts HTML to markdown when Accept: text/markdown', async () => {
        const plugin = markdown();
        const { instance, hooks } = createMockFastify();
        plugin(instance as never, {}, () => {});

        const request = { headers: { accept: 'text/markdown' } };
        const { reply, getHeader } = createMockReply('text/html');

        const result = await hooks[0](request, reply, '<h1>Title</h1><p>Body</p>');

        expect(result).toContain('# Title');
        expect(result).toContain('Body');
        expect(getHeader('content-type')).toBe('text/markdown; charset=utf-8');
        expect(getHeader('x-markdown-tokens')).toBeTruthy();
    });

    it('passes through when Accept is not text/markdown', async () => {
        const plugin = markdown();
        const { instance, hooks } = createMockFastify();
        plugin(instance as never, {}, () => {});

        const request = { headers: { accept: 'text/html' } };
        const { reply } = createMockReply('text/html');

        const result = await hooks[0](request, reply, '<h1>Title</h1>');

        expect(result).toBe('<h1>Title</h1>');
    });

    it('passes through non-HTML responses', async () => {
        const plugin = markdown();
        const { instance, hooks } = createMockFastify();
        plugin(instance as never, {}, () => {});

        const request = { headers: { accept: 'text/markdown' } };
        const { reply, getHeader } = createMockReply('application/json');

        const result = await hooks[0](request, reply, '{"ok":true}');

        expect(result).toBe('{"ok":true}');
        expect(getHeader('content-type')).toBe('application/json');
    });

    it('passes through non-string payloads', async () => {
        const plugin = markdown();
        const { instance, hooks } = createMockFastify();
        plugin(instance as never, {}, () => {});

        const request = { headers: { accept: 'text/markdown' } };
        const { reply } = createMockReply('text/html');
        const buffer = Buffer.from('<h1>Title</h1>');

        const result = await hooks[0](request, reply, buffer);

        expect(result).toBe(buffer);
    });

    it('supports custom token header', async () => {
        const plugin = markdown({ tokenHeader: 'x-tokens' });
        const { instance, hooks } = createMockFastify();
        plugin(instance as never, {}, () => {});

        const request = { headers: { accept: 'text/markdown' } };
        const { reply, getHeader } = createMockReply('text/html');

        await hooks[0](request, reply, '<p>Hello</p>');

        expect(getHeader('x-tokens')).toBeTruthy();
        expect(getHeader('x-markdown-tokens')).toBeUndefined();
    });

    it('forwards convert options', async () => {
        const plugin = markdown({ extract: true });
        const { instance, hooks } = createMockFastify();
        plugin(instance as never, {}, () => {});

        const request = { headers: { accept: 'text/markdown' } };
        const { reply } = createMockReply('text/html');

        const result = await hooks[0](request, reply, '<nav><a href="/">Home</a></nav><main><p>Content</p></main><footer>Footer</footer>');

        expect(result).toContain('Content');
        expect(result).not.toContain('Home');
        expect(result).not.toContain('Footer');
    });

    it('handles missing accept header', async () => {
        const plugin = markdown();
        const { instance, hooks } = createMockFastify();
        plugin(instance as never, {}, () => {});

        const request = { headers: {} as Record<string, string | undefined> };
        const { reply } = createMockReply('text/html');

        const result = await hooks[0](request, reply, '<h1>Title</h1>');

        expect(result).toBe('<h1>Title</h1>');
    });
});
