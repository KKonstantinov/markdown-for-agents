import { convert, buildContentSignalHeader } from 'markdown-for-agents';
import type { MiddlewareOptions, Rule } from 'markdown-for-agents';

export type { MiddlewareOptions } from 'markdown-for-agents';

interface NextRequest {
    headers: Headers;
    url: string;
}

interface NextResponse {
    status: number;
    headers: Headers;
    text(): Promise<string>;
}

type NextMiddleware = (request: NextRequest) => Promise<NextResponse | Response | undefined | null>;

/**
 * Extract page metadata (`title`, `description`, `image`) from raw HTML by
 * scanning the full document, not just `<head>`.
 *
 * Next.js App Router in dev mode streams `<title>` and `<meta>` tags outside
 * `<head>` (they appear later in the body and are moved client-side via
 * script).  This function picks them up so they can be passed to `convert()`
 * via the `frontmatter` option.
 */
function extractStreamedMetadata(html: string): Record<string, string> {
    const meta: Record<string, string> = {};

    const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    if (titleMatch) {
        const text = titleMatch[1].trim();
        if (text) meta.title = text;
    }

    const metaTagRegex = /<meta\s[^>]*>/gi;
    let match;
    while ((match = metaTagRegex.exec(html)) !== null) {
        const tag = match[0];
        const content = tag.match(/content=["']([^"']*?)["']/i);
        if (!content?.[1].trim()) continue;

        const name = tag.match(/name=["']([^"']*?)["']/i);
        if (name && name[1].toLowerCase() === 'description' && !meta.description) {
            meta.description = content[1].trim();
        }

        const property = tag.match(/property=["']([^"']*?)["']/i);
        if (property && property[1].toLowerCase() === 'og:image' && !meta.image) {
            meta.image = content[1].trim();
        }
    }

    return meta;
}

/**
 * Extract the original image URL from a Next.js `/_next/image` optimization path.
 * Example: `/_next/image?url=%2Fphoto.png&w=640&q=75` → `/photo.png`
 */
function extractNextImageUrl(src: string): string | undefined {
    try {
        const url = new URL(src, 'http://placeholder');
        const originalUrl = url.searchParams.get('url');
        return originalUrl ?? undefined;
    } catch {
        return undefined;
    }
}

/**
 * Conversion rule that unwraps Next.js `/_next/image` optimization URLs
 * back to the original image path.
 *
 * Included by default in `withMarkdown`. Can also be used standalone:
 *
 * ```ts
 * import { nextImageRule } from "@markdown-for-agents/nextjs";
 * convert(html, { rules: [nextImageRule] });
 * ```
 */
export const nextImageRule: Rule = {
    filter: node => node.name === 'img' && (node.attribs.src || '').includes('/_next/image'),
    replacement: ({ node, options }) => {
        let src = node.attribs.src || '';
        const alt = node.attribs.alt || '';
        const title = node.attribs.title;

        const extracted = extractNextImageUrl(src);
        if (extracted) src = extracted;

        const resolvedSrc =
            options.baseUrl && src && !src.startsWith('http') && !src.startsWith('data:') ? new URL(src, options.baseUrl).href : src;

        if (title) {
            return `![${alt}](${resolvedSrc} "${title}")`;
        }
        return `![${alt}](${resolvedSrc})`;
    },
    priority: 1
};

/**
 * Wrap a Next.js middleware handler to convert HTML responses to markdown
 * when the client sends an `Accept: text/markdown` header.
 *
 * Automatically includes {@link nextImageRule} to unwrap `/_next/image`
 * optimization URLs.
 *
 * @param handler - The Next.js middleware to wrap.
 * @param options - Conversion and middleware options.
 * @returns A wrapped Next.js middleware function.
 *
 * @example
 * ```ts
 * import { withMarkdown } from "@markdown-for-agents/nextjs";
 *
 * export default withMarkdown(async (request) => {
 *   return new Response("<h1>Hello</h1>", {
 *     headers: { "content-type": "text/html" },
 *   });
 * });
 * ```
 */
export function withMarkdown(handler: NextMiddleware, options?: MiddlewareOptions): NextMiddleware {
    const tokenHeader = options?.tokenHeader ?? 'x-markdown-tokens';

    return async request => {
        const accept = request.headers.get('accept') ?? '';

        if (!accept.includes('text/markdown')) {
            const response = await handler(request);
            if (response) {
                // Always signal that responses vary by Accept so caches store
                // separate entries for HTML and Markdown representations.
                response.headers.append('vary', 'Accept');
            }
            return response;
        }

        const response = await handler(request);
        if (!response) return response;

        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('text/html')) {
            response.headers.append('vary', 'Accept');
            return response;
        }

        const html = await response.text();

        const streamedMeta = extractStreamedMetadata(html);

        const resolvedOptions: MiddlewareOptions = {
            ...options,
            rules: [nextImageRule, ...(options?.rules ?? [])]
        };

        // Pass streamed metadata via frontmatter so it overrides core's
        // head-only extraction.  Respects frontmatter:false (skip entirely)
        // and user-provided fields (which take priority over streamed values).
        if (options?.frontmatter !== false && Object.keys(streamedMeta).length > 0) {
            const userFields = typeof options?.frontmatter === 'object' ? options.frontmatter : {};
            resolvedOptions.frontmatter = { ...streamedMeta, ...userFields };
        }

        const { markdown, tokenEstimate, contentHash } = convert(html, resolvedOptions);

        const headers = new Headers(response.headers);
        headers.append('vary', 'Accept');
        headers.set('content-type', 'text/markdown; charset=utf-8');
        headers.set(tokenHeader, String(tokenEstimate.tokens));
        headers.set('etag', `"${contentHash}"`);
        if (options?.contentSignal) {
            const signalValue = buildContentSignalHeader(options.contentSignal);
            if (signalValue) headers.set('content-signal', signalValue);
        }

        return new Response(markdown, {
            status: response.status,
            headers
        });
    };
}
