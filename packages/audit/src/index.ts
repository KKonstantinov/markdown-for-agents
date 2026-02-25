import { convert, estimateTokens } from 'markdown-for-agents';
import type { ConvertOptions, TokenEstimate } from 'markdown-for-agents';

export type { TokenEstimate } from 'markdown-for-agents';

/** Options for the {@link audit} function. */
export interface AuditOptions extends ConvertOptions {
    /** Options passed to the underlying `fetch()` call (headers, signal, etc.). */
    fetchOptions?: RequestInit;
}

/** Result returned by {@link audit}, comparing the original HTML against the converted markdown. */
export interface AuditResult {
    /** The URL that was fetched. */
    url: string;

    /** Size metrics for the original HTML. */
    html: {
        /** Byte size of the raw HTML (UTF-8). */
        bytes: number;
        /** Token / character / word estimates for the raw HTML. */
        tokens: TokenEstimate;
    };

    /** Size metrics and content for the generated markdown. */
    markdown: {
        /** The converted markdown string. */
        content: string;
        /** Byte size of the markdown (UTF-8). */
        bytes: number;
        /** Token / character / word estimates for the markdown. */
        tokens: TokenEstimate;
    };

    /** Reduction metrics (HTML minus markdown). */
    reduction: {
        /** Absolute byte reduction. */
        bytes: number;
        /** Byte reduction as a percentage of the original HTML size. */
        bytePercent: number;
        /** Absolute token reduction. */
        tokens: number;
        /** Token reduction as a percentage of the original HTML token count. */
        tokenPercent: number;
    };
}

/**
 * Fetches a URL, converts the HTML to Markdown, and compares token counts.
 *
 * Extraction is enabled by default. The base URL is derived from the input URL.
 * Both defaults can be overridden via options.
 */
export async function audit(url: string, options?: AuditOptions): Promise<AuditResult> {
    const { fetchOptions, ...convertOptions } = options ?? {};

    const headers = new Headers(fetchOptions?.headers);
    if (!headers.has('accept')) {
        headers.set('accept', 'text/html');
    }

    const response = await fetch(url, { ...fetchOptions, headers });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${String(response.status)} ${response.statusText}`);
    }

    const html = await response.text();
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(html).length;
    const htmlTokens = estimateTokens(html);

    const resolvedOptions: ConvertOptions = {
        extract: true,
        baseUrl: new URL(url).origin,
        ...convertOptions
    };

    const { markdown, tokenEstimate: mdTokens } = convert(html, resolvedOptions);
    const mdBytes = encoder.encode(markdown).length;

    const byteReduction = htmlBytes - mdBytes;
    const tokenReduction = htmlTokens.tokens - mdTokens.tokens;

    return {
        url,
        html: {
            bytes: htmlBytes,
            tokens: htmlTokens
        },
        markdown: {
            content: markdown,
            bytes: mdBytes,
            tokens: mdTokens
        },
        reduction: {
            bytes: byteReduction,
            bytePercent: htmlBytes > 0 ? (byteReduction / htmlBytes) * 100 : 0,
            tokens: tokenReduction,
            tokenPercent: htmlTokens.tokens > 0 ? (tokenReduction / htmlTokens.tokens) * 100 : 0
        }
    };
}
