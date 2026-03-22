/**
 * Hono middleware that converts HTML responses to Markdown
 * when the client sends an `Accept: text/markdown` header.
 *
 * ```ts
 * import { Hono } from "hono";
 * import { markdown } from "@markdown-for-agents/hono";
 *
 * const app = new Hono();
 * app.use("*", markdown());
 * ```
 * @module
 */

import type { MiddlewareHandler } from 'hono';
import { convert, buildContentSignalHeader, shouldServeMarkdown, isAgentDetectionEnabled, markdownContentType } from 'markdown-for-agents';
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
    const timingHeader = options?.timingHeader ?? 'x-markdown-timing';

    return async (c, next) => {
        await next();

        // Always signal that responses vary by Accept so caches store
        // separate entries for HTML and Markdown representations.
        c.res.headers.append('vary', 'Accept');
        if (isAgentDetectionEnabled(options?.detectAgents)) c.res.headers.append('vary', 'User-Agent');

        const accept = c.req.header('accept') ?? '';
        const userAgent = c.req.header('user-agent') ?? undefined;
        const reason = shouldServeMarkdown(accept, userAgent, options?.detectAgents);
        if (!reason) return;

        const contentType = c.res.headers.get('content-type') ?? '';
        if (!contentType.includes('text/html')) return;

        options?.logger?.info({ reason, path: c.req.path, userAgent });

        const html = await c.res.text();

        const { markdown: md, tokenEstimate, contentHash, convertDuration } = convert(html, options);

        c.res = new Response(md, {
            status: c.res.status,
            headers: c.res.headers
        });
        c.res.headers.set('content-type', markdownContentType(reason));
        c.res.headers.set(tokenHeader, String(tokenEstimate.tokens));
        c.res.headers.set('etag', `"${contentHash}"`);
        if (convertDuration !== undefined) {
            const timingValue = `mfa.convert;dur=${convertDuration.toFixed(1)};desc="HTML to Markdown"`;
            c.res.headers.set('server-timing', timingValue);
            c.res.headers.set(timingHeader, timingValue);
        }
        if (options?.contentSignal) {
            const signalValue = buildContentSignalHeader(options.contentSignal);
            if (signalValue) c.res.headers.set('content-signal', signalValue);
        }
    };
}
