import { convert, buildContentSignalHeader } from 'markdown-for-agents';
import type { MiddlewareOptions } from 'markdown-for-agents';

export type { MiddlewareOptions } from 'markdown-for-agents';

// Minimal Express types — avoids requiring express as a compile-time dependency
interface ExpressRequest {
    headers: Record<string, string | string[] | undefined>;
}

interface ExpressResponse {
    getHeader(name: string): string | number | string[] | undefined;
    setHeader(name: string, value: string | number): this;
    send(body?: unknown): this;
}

type ExpressNextFunction = (error?: unknown) => void;

export type ExpressMiddleware = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => void;

/**
 * Express middleware that converts HTML responses to markdown
 * when the client sends an `Accept: text/markdown` header.
 *
 * @param options - Conversion and middleware options.
 * @returns An Express middleware function.
 *
 * @example
 * ```ts
 * import express from "express";
 * import { markdown } from "@markdown-for-agents/express";
 *
 * const app = express();
 * app.use(markdown());
 * ```
 */
export function markdown(options?: MiddlewareOptions): ExpressMiddleware {
    const tokenHeader = options?.tokenHeader ?? 'x-markdown-tokens';

    return (req, res, next) => {
        // Always signal that responses vary by Accept so caches store
        // separate entries for HTML and Markdown representations.
        const existing = res.getHeader('vary');
        const vary = existing ? `${String(existing)}, Accept` : 'Accept';
        res.setHeader('vary', vary);

        const accept = typeof req.headers.accept === 'string' ? req.headers.accept : '';
        if (!accept.includes('text/markdown')) {
            next();
            return;
        }

        const originalSend = res.send.bind(res);

        res.send = function (body?: unknown) {
            const contentType = String(res.getHeader('content-type') ?? '');

            if (!contentType.includes('text/html') || typeof body !== 'string') {
                return originalSend.call(this, body);
            }

            const { markdown: md, tokenEstimate, contentHash } = convert(body, options);
            res.setHeader('content-type', 'text/markdown; charset=utf-8');
            res.setHeader(tokenHeader, String(tokenEstimate.tokens));
            res.setHeader('etag', `"${contentHash}"`);
            if (options?.contentSignal) {
                const signalValue = buildContentSignalHeader(options.contentSignal);
                if (signalValue) res.setHeader('content-signal', signalValue);
            }
            return originalSend.call(this, md);
        };

        next();
    };
}
