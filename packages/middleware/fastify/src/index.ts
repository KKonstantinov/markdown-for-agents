import type { FastifyPluginCallback } from 'fastify';
import { convert, buildContentSignalHeader } from 'markdown-for-agents';
import type { MiddlewareOptions } from 'markdown-for-agents';

export type { MiddlewareOptions } from 'markdown-for-agents';

/** Fastify plugin callback signature used by the `markdown()` factory. */
export type FastifyPlugin = FastifyPluginCallback;

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
            reply.header('vary', existing ? `${String(existing)}, Accept` : 'Accept');

            const accept = typeof request.headers.accept === 'string' ? request.headers.accept : '';

            if (!accept.includes('text/markdown')) {
                return Promise.resolve(payload);
            }

            const contentType = String(reply.getHeader('content-type') ?? '');
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
