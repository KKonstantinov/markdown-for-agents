/**
 * SvelteKit handle middleware that converts HTML responses to Markdown
 * when the client sends an `Accept: text/markdown` header.
 *
 * ```ts
 * import { markdown } from '@markdown-for-agents/sveltekit';
 *
 * export const handle = markdown({ extract: true });
 * ```
 *
 * @module
 */

import type { Handle } from '@sveltejs/kit';
import { markdownMiddleware } from '@markdown-for-agents/web';
import type { MiddlewareOptions } from 'markdown-for-agents';

export type { MiddlewareOptions } from 'markdown-for-agents';

type ResolveOptions = NonNullable<Parameters<Parameters<Handle>[0]['resolve']>[1]>;

export interface SvelteKitMarkdownOptions extends MiddlewareOptions {
    /**
     * Options forwarded to SvelteKit's `resolve(event, options)` call.
     *
     * Use this for SvelteKit-specific response rendering hooks such as
     * `transformPageChunk`. The Markdown conversion runs after `resolve`
     * produces an HTML `Response`.
     */
    resolveOptions?: ResolveOptions;
}

/**
 * Create a SvelteKit `handle` hook that converts eligible HTML responses to
 * Markdown via the shared Web Standard adapter.
 *
 * Put this handle after hooks that populate `event.locals`, perform auth, or
 * rewrite requests, so those hooks affect the page SvelteKit renders before
 * Markdown conversion happens. Put hooks that must inspect the final Markdown
 * response after it.
 */
export function markdown(options?: SvelteKitMarkdownOptions): Handle {
    const { resolveOptions, ...middlewareOptions } = options ?? {};
    const middleware = markdownMiddleware(middlewareOptions);

    return async ({ event, resolve }) => {
        return middleware(event.request, async () => {
            const response = await resolve(event, resolveOptions);
            const headers = new Headers(response.headers);
            headers.delete('content-length');
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers
            });
        });
    };
}
