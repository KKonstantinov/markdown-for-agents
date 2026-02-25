import { convert } from 'markdown-for-agents';
import type { MiddlewareOptions } from 'markdown-for-agents';

export type { MiddlewareOptions } from 'markdown-for-agents';

type Handler = (request: Request) => Response | Promise<Response>;
type Middleware = (request: Request, next: Handler) => Response | Promise<Response>;

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
        if (!wantsMarkdown(request)) {
            return next(request);
        }

        const response = await next(request);
        const contentType = response.headers.get('content-type') ?? '';

        if (!contentType.includes('text/html')) {
            return response;
        }

        const html = await response.text();
        const { markdown, tokenEstimate } = convert(html, options);

        const headers = new Headers(response.headers);
        headers.set('content-type', 'text/markdown; charset=utf-8');
        headers.set(tokenHeader, String(tokenEstimate.tokens));

        return new Response(markdown, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    };
}
