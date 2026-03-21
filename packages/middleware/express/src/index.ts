import type { Request, Response, NextFunction } from 'express';
import { convert, buildContentSignalHeader, shouldServeMarkdown, isAgentDetectionEnabled } from 'markdown-for-agents';
import type { MiddlewareOptions } from 'markdown-for-agents';

export type { MiddlewareOptions } from 'markdown-for-agents';

/** Standard Express middleware function signature used by the `markdown()` factory. */
export type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;

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
    const timingHeader = options?.timingHeader ?? 'x-markdown-timing';

    return (req, res, next) => {
        // Always signal that responses vary by Accept so caches store
        // separate entries for HTML and Markdown representations.
        const existing = res.getHeader('vary');
        const varyParts = [existing ? String(existing) : undefined, 'Accept'];
        if (isAgentDetectionEnabled(options?.detectAgents)) varyParts.push('User-Agent');
        res.setHeader('vary', varyParts.filter(Boolean).join(', '));

        const accept = typeof req.headers.accept === 'string' ? req.headers.accept : '';
        const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
        if (!shouldServeMarkdown(accept, userAgent, options?.detectAgents)) {
            next();
            return;
        }

        const originalSend = res.send.bind(res);

        res.send = function (body?: unknown) {
            const contentType = String(res.getHeader('content-type') ?? '');

            if (!contentType.includes('text/html') || typeof body !== 'string') {
                return originalSend.call(this, body);
            }

            const { markdown: md, tokenEstimate, contentHash, convertDuration } = convert(body, options);

            res.setHeader('content-type', 'text/markdown; charset=utf-8');
            res.setHeader(tokenHeader, String(tokenEstimate.tokens));
            res.setHeader('etag', `"${contentHash}"`);
            if (convertDuration !== undefined) {
                const timingValue = `mfa.convert;dur=${convertDuration.toFixed(1)};desc="HTML to Markdown"`;
                res.setHeader('server-timing', timingValue);
                res.setHeader(timingHeader, timingValue);
            }
            if (options?.contentSignal) {
                const signalValue = buildContentSignalHeader(options.contentSignal);
                if (signalValue) res.setHeader('content-signal', signalValue);
            }
            return originalSend.call(this, md);
        };

        next();
    };
}
