/**
 * Web-standard middleware that converts HTML responses to Markdown
 * when the client sends an `Accept: text/markdown` header.
 *
 * Compatible with any runtime that supports the Fetch API
 * (Cloudflare Workers, Deno, Bun, etc.).
 *
 * ```ts
 * import { markdownMiddleware } from "@markdown-for-agents/web";
 *
 * const md = markdownMiddleware({ extract: true });
 * const response = await md(request, handler);
 * ```
 * @module
 */

import { convert, buildContentSignalHeader } from 'markdown-for-agents';
import type { MiddlewareOptions } from 'markdown-for-agents';

export type { MiddlewareOptions } from 'markdown-for-agents';

/** A request handler that produces a `Response` (sync or async). */
type Handler = (request: Request) => Response | Promise<Response>;
/** A middleware function that wraps a {@link Handler} with pre/post-processing. */
type Middleware = (request: Request, next: Handler) => Response | Promise<Response>;

/**
 * Checks whether the client is requesting markdown content.
 *
 * @param request - The incoming `Request` object.
 * @returns `true` if the `Accept` header includes `text/markdown`.
 */
function wantsMarkdown(request: Request): boolean {
    const accept = request.headers.get('accept') ?? '';
    return accept.includes('text/markdown');
}

/**
 * Web-standard middleware that converts HTML responses to markdown
 * when the client sends an `Accept: text/markdown` header.
 *
 * Compatible with any runtime that supports the Fetch API
 * (Cloudflare Workers, Deno, Bun, etc.).
 *
 * @param options - Conversion and middleware options.
 * @returns A middleware function that wraps a {@link Handler}.
 *
 * @example
 * ```ts
 * import { markdownMiddleware } from "@markdown-for-agents/web";
 *
 * const md = markdownMiddleware({ extract: true });
 * const response = await md(request, handler);
 * ```
 */
export function markdownMiddleware(options?: MiddlewareOptions): Middleware {
    const tokenHeader = options?.tokenHeader ?? 'x-markdown-tokens';

    return async (request: Request, next: Handler): Promise<Response> => {
        const response = await next(request);

        // Always signal that responses vary by Accept so caches store
        // separate entries for HTML and Markdown representations.
        response.headers.append('vary', 'Accept');

        if (!wantsMarkdown(request)) {
            return response;
        }

        const contentType = response.headers.get('content-type') ?? '';

        if (!contentType.includes('text/html')) {
            return response;
        }

        const html = await response.text();

        const { markdown, tokenEstimate, contentHash, convertDuration } = convert(html, options);

        const headers = new Headers(response.headers);
        headers.set('content-type', 'text/markdown; charset=utf-8');
        headers.set(tokenHeader, String(tokenEstimate.tokens));
        headers.set('etag', `"${contentHash}"`);
        if (convertDuration !== undefined) {
            headers.set('server-timing', `mfa.convert;dur=${convertDuration.toFixed(1)};desc="HTML to Markdown"`);
        }
        if (options?.contentSignal) {
            const signalValue = buildContentSignalHeader(options.contentSignal);
            if (signalValue) headers.set('content-signal', signalValue);
        }

        return new Response(markdown, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    };
}
