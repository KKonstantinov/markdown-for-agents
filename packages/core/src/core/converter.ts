import { parse } from './parser.js';
import { walk } from './walker.js';
import { render } from './renderer.js';
import { deduplicateBlocks } from './dedup.js';
import { contentHash } from './hash.js';
import { extractContent } from '../extract/index.js';
import { estimateTokens } from '../tokens/index.js';
import { getDefaultRules } from '../rules/index.js';
import type { ConvertOptions, ConvertResult, ResolvedOptions } from '../types.js';

const DEFAULTS: ResolvedOptions = {
    extract: false,
    rules: [],
    baseUrl: '',
    headingStyle: 'atx',
    bulletChar: '-',
    codeBlockStyle: 'fenced',
    fenceChar: '`',
    strongDelimiter: '**',
    emDelimiter: '*',
    linkStyle: 'inlined',
    deduplicate: false
};

/**
 * Convert an HTML string to markdown.
 *
 * @param html - Raw HTML to convert.
 * @param options - Conversion settings (heading style, extraction, custom rules, etc.).
 * @returns The generated markdown and an estimated token count.
 *
 * @example
 * ```ts
 * const { markdown, tokenEstimate } = convert("<h1>Hello</h1><p>World</p>");
 * ```
 */
export function convert(html: string, options?: ConvertOptions): ConvertResult {
    const opts: ResolvedOptions = { ...DEFAULTS, ...options };

    const document = parse(html);

    if (opts.extract) {
        const extractOpts = typeof opts.extract === 'object' ? opts.extract : undefined;
        extractContent(document, extractOpts);
    }

    // eslint-disable-next-line unicorn/no-array-sort -- toSorted unavailable in ES2022 target
    const allRules = [...opts.rules, ...getDefaultRules()].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    const raw = walk(document, {
        options: opts,
        rules: allRules,
        listDepth: 0,
        insidePre: false,
        insideTable: false
    });

    let markdown = render(raw);

    if (opts.deduplicate) {
        const minLength = typeof opts.deduplicate === 'object' ? opts.deduplicate.minLength : undefined;
        markdown = deduplicateBlocks(markdown, minLength);
    }

    const tokenEstimate = opts.tokenCounter ? opts.tokenCounter(markdown) : estimateTokens(markdown);

    return { markdown, tokenEstimate, contentHash: contentHash(markdown) };
}
