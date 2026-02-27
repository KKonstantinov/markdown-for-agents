import { convert, buildContentSignalHeader } from 'markdown-for-agents';
import type { MiddlewareOptions } from 'markdown-for-agents';

export type { MiddlewareOptions } from 'markdown-for-agents';

// Minimal Fastify types — avoids requiring fastify as a compile-time dependency
interface FastifyRequest {
    headers: Record<string, string | string[] | undefined>;
}

interface FastifyReply {
    getHeader(name: string): string | undefined;
    header(name: string, value: string): this;
}

interface FastifyInstance {
    addHook(name: 'onSend', hook: (request: FastifyRequest, reply: FastifyReply, payload: unknown) => Promise<unknown>): void;
}

export type FastifyPlugin = (instance: FastifyInstance, opts: Record<string, unknown>, done: () => void) => void;

/**
 * Fastify plugin that converts HTML responses to markdown
 * when the client sends an `Accept: text/markdown` header.
 *
 * Registers an `onSend` hook that intercepts `text/html` responses.
 * The plugin skips Fastify's encapsulation so the hook applies to all routes.
 *
 * @param options - Conversion and middleware options.
 * @returns A Fastify plugin function.
 *
 * @example
 * ```ts
 * import Fastify from "fastify";
 * import { markdown } from "@markdown-for-agents/fastify";
 *
 * const app = Fastify();
 * app.register(markdown());
 * ```
 */
export function markdown(options?: MiddlewareOptions): FastifyPlugin {
    const tokenHeader = options?.tokenHeader ?? 'x-markdown-tokens';

    const plugin: FastifyPlugin = (fastify, _opts, done) => {
        fastify.addHook('onSend', (request, reply, payload) => {
            // Always signal that responses vary by Accept so caches store
            // separate entries for HTML and Markdown representations.
            const existing = reply.getHeader('vary');
            reply.header('vary', existing ? `${existing}, Accept` : 'Accept');

            const accept = typeof request.headers.accept === 'string' ? request.headers.accept : '';

            if (!accept.includes('text/markdown')) {
                return Promise.resolve(payload);
            }

            const contentType = reply.getHeader('content-type') ?? '';
            if (!contentType.includes('text/html')) {
                return Promise.resolve(payload);
            }

            if (typeof payload !== 'string') {
                return Promise.resolve(payload);
            }

            const { markdown: md, tokenEstimate, contentHash } = convert(payload, options);
            reply.header('content-type', 'text/markdown; charset=utf-8');
            reply.header(tokenHeader, String(tokenEstimate.tokens));
            reply.header('etag', `"${contentHash}"`);
            if (options?.contentSignal) {
                const signalValue = buildContentSignalHeader(options.contentSignal);
                if (signalValue) reply.header('content-signal', signalValue);
            }
            return Promise.resolve(md);
        });

        done();
    };

    // Skip Fastify's plugin encapsulation so the hook applies to all routes
    // This is what fastify-plugin does internally
    Object.defineProperty(plugin, Symbol.for('skip-override'), { value: true });

    return plugin;
}
