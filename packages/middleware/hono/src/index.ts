import type { MiddlewareHandler } from 'hono';
import { convert, buildContentSignalHeader } from 'markdown-for-agents';
import type { MiddlewareOptions } from 'markdown-for-agents';

export type { MiddlewareOptions } from 'markdown-for-agents';

/**
 * Hono middleware that converts HTML responses to markdown
 * when the client sends an `Accept: text/markdown` header.
 *
 * @param options - Conversion and middleware options.
 * @returns A Hono middleware handler.
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { markdown } from "@markdown-for-agents/hono";
 *
 * const app = new Hono();
 * app.use("*", markdown());
 * ```
 */
export function markdown(options?: MiddlewareOptions): MiddlewareHandler {
    const tokenHeader = options?.tokenHeader ?? 'x-markdown-tokens';

    return async (c, next) => {
        await next();

        // Always signal that responses vary by Accept so caches store
        // separate entries for HTML and Markdown representations.
        c.res.headers.append('vary', 'Accept');

        const accept = c.req.header('accept') ?? '';
        if (!accept.includes('text/markdown')) return;

        const contentType = c.res.headers.get('content-type') ?? '';
        if (!contentType.includes('text/html')) return;

        const html = await c.res.text();
        const { markdown: md, tokenEstimate, contentHash } = convert(html, options);

        c.res = new Response(md, {
            status: c.res.status,
            headers: c.res.headers
        });
        c.res.headers.set('content-type', 'text/markdown; charset=utf-8');
        c.res.headers.set(tokenHeader, String(tokenEstimate.tokens));
        c.res.headers.set('etag', `"${contentHash}"`);
        if (options?.contentSignal) {
            const signalValue = buildContentSignalHeader(options.contentSignal);
            if (signalValue) c.res.headers.set('content-signal', signalValue);
        }
    };
}
