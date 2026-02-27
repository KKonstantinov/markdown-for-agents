import type { Document, Element } from 'domhandler';

/** Options for the {@link convert} function. */
export interface ConvertOptions {
    /**
     * Enable content extraction mode to strip non-content elements
     * (nav, footer, ads, sidebars, etc.) before conversion.
     *
     * - `true` — use default extraction selectors
     * - `ExtractOptions` — customize which elements are stripped
     *
     * @defaultValue `false`
     */
    extract?: boolean | ExtractOptions;

    /**
     * Custom conversion rules to override or extend the built-in element handlers.
     *
     * Rules are merged with the defaults and sorted by {@link Rule.priority} (highest first).
     * A custom rule whose filter matches an element takes precedence over built-in rules.
     */
    rules?: Rule[];

    /**
     * Base URL used to resolve relative `href` and `src` attributes
     * into absolute URLs in the generated markdown.
     *
     * @example
     * ```ts
     * convert('<a href="/about">About</a>', { baseUrl: "https://example.com" });
     * // → [About](https://example.com/about)
     * ```
     */
    baseUrl?: string;

    /**
     * Heading style.
     * - `"atx"` — `# Heading`
     * - `"setext"` — underlined (only for h1/h2; h3–h6 always use atx)
     *
     * @defaultValue `"atx"`
     */
    headingStyle?: 'atx' | 'setext';

    /**
     * Bullet character for unordered lists.
     *
     * @defaultValue `"-"`
     */
    bulletChar?: '-' | '*' | '+';

    /**
     * Code block style.
     * - `"fenced"` — triple backtick / tilde fences
     * - `"indented"` — 4-space indentation
     *
     * @defaultValue `"fenced"`
     */
    codeBlockStyle?: 'fenced' | 'indented';

    /**
     * Character used for fenced code blocks.
     *
     * @defaultValue `` "`" ``
     */
    fenceChar?: '`' | '~';

    /**
     * Delimiter for `<strong>` / `<b>` elements.
     *
     * @defaultValue `"**"`
     */
    strongDelimiter?: '**' | '__';

    /**
     * Delimiter for `<em>` / `<i>` elements.
     *
     * @defaultValue `"*"`
     */
    emDelimiter?: '*' | '_';

    /**
     * Link rendering style.
     * - `"inlined"` — `[text](url)`
     * - `"referenced"` — `[text][1]` with reference definitions at the end
     *
     * @defaultValue `"inlined"`
     */
    linkStyle?: 'inlined' | 'referenced';

    /**
     * Remove duplicate content blocks from the output.
     * Useful for pages that repeat the same content in multiple sections
     * (e.g. mobile/desktop variants).
     *
     * - `true` — use default deduplication settings
     * - `DeduplicateOptions` — customize deduplication behavior
     *
     * @defaultValue `false`
     */
    deduplicate?: boolean | DeduplicateOptions;

    /**
     * Prepend YAML frontmatter (title, description, image) extracted from
     * the HTML `<head>` element.
     *
     * - `true` — extract metadata from `<head>` and prepend frontmatter
     * - `false` — skip frontmatter entirely
     * - `Record<string, string>` — merge custom fields with extracted metadata
     *   (custom fields override extracted ones)
     *
     * @defaultValue `true`
     */
    frontmatter?: boolean | Record<string, string>;

    /**
     * Custom token counter to replace the built-in heuristic.
     *
     * Receives the final markdown string and must return a
     * {@link TokenEstimate} (or at minimum an object with a `tokens` field).
     *
     * Useful for plugging in an exact tokenizer such as
     * [tiktoken](https://github.com/openai/tiktoken) or
     * [gpt-tokenizer](https://github.com/niieani/gpt-tokenizer).
     *
     * @defaultValue Built-in heuristic (~4 characters per token)
     *
     * @example
     * ```ts
     * import { encoding_for_model } from 'tiktoken';
     *
     * const enc = encoding_for_model('gpt-4o');
     * const { tokenEstimate } = convert(html, {
     *     tokenCounter: (text) => ({
     *         tokens: enc.encode(text).length,
     *         characters: text.length,
     *         words: text.split(/\s+/).filter(Boolean).length,
     *     }),
     * });
     * ```
     */
    tokenCounter?: (text: string) => TokenEstimate;
}

/**
 * Context object passed to a {@link Rule.replacement} function,
 * providing access to the current node, its surroundings, and
 * conversion utilities.
 */
export interface RuleContext {
    /** The HTML element being converted. */
    node: Element;

    /** The parent node (element or document root). */
    parent: Element | Document | null;

    /**
     * Recursively convert the children of the given node to markdown.
     * Call this to produce the inner content of a container element.
     */
    convertChildren: (node: Element | Document) => string;

    /** The fully resolved conversion options in effect. */
    options: ResolvedOptions;

    /** Current nesting depth inside `<ul>` / `<ol>` lists (0 = top-level). */
    listDepth: number;

    /** `true` when inside a `<pre>` block (whitespace is preserved). */
    insidePre: boolean;

    /** `true` when inside a `<table>`. */
    insideTable: boolean;

    /** Zero-based index of the current node among its parent's children. */
    siblingIndex: number;
}

/**
 * A conversion rule that maps one or more HTML elements to markdown output.
 *
 * @example
 * ```ts
 * const customRule: Rule = {
 *   filter: "details",
 *   replacement: ({ node, convertChildren }) => {
 *     const summary = node.children.find(c => c.name === "summary");
 *     return `**${convertChildren(summary)}**\n\n${convertChildren(node)}`;
 *   },
 *   priority: 10,
 * };
 * ```
 */
export interface Rule {
    /**
     * Determines which elements this rule applies to.
     *
     * - `string` — match by tag name (e.g. `"div"`)
     * - `string[]` — match any of several tag names
     * - `(node: Element) => boolean` — custom predicate for full control
     */
    filter: string | string[] | ((node: Element) => boolean);

    /**
     * Produce the markdown string for the matched element.
     *
     * @returns
     * - `string` — the markdown replacement (consumed, no further rules run)
     * - `null` — suppress the element entirely (no output)
     * - `undefined` — skip this rule and try the next matching rule
     */
    replacement: (context: RuleContext) => string | null | undefined;

    /**
     * Rules are sorted by priority (highest first). When two rules match the
     * same element, the one with the higher priority runs first.
     *
     * Built-in rules use priority `0`. Use a higher value to override them,
     * or a negative value to act as a fallback.
     *
     * @defaultValue `0`
     */
    priority?: number;
}

/**
 * Options for the content extraction pass that runs before conversion.
 * All arrays are **merged** with the built-in defaults (they do not replace them).
 * Use `keepHeader`, `keepFooter`, or `keepNav` to selectively preserve
 * elements that would otherwise be stripped.
 */
export interface ExtractOptions {
    /** Additional HTML tag names to strip (merged with defaults like `nav`, `aside`, `script`, etc.). */
    stripTags?: string[];

    /** Additional CSS class patterns to strip (merged with defaults like `/sidebar/i`, `/cookie/i`, etc.). */
    stripClasses?: (string | RegExp)[];

    /** Additional ARIA role values to strip (merged with defaults like `"navigation"`, `"banner"`, etc.). */
    stripRoles?: string[];

    /** Additional element ID patterns to strip (merged with defaults like `/sidebar/i`, `/modal/i`, etc.). */
    stripIds?: (string | RegExp)[];

    /** Keep `<header>` elements instead of stripping them. @defaultValue `false` */
    keepHeader?: boolean;

    /** Keep `<footer>` elements instead of stripping them. @defaultValue `false` */
    keepFooter?: boolean;

    /** Keep `<nav>` elements instead of stripping them. @defaultValue `false` */
    keepNav?: boolean;
}

/**
 * Options for the deduplication pass that runs after conversion.
 */
export interface DeduplicateOptions {
    /**
     * Minimum block length (in normalized characters) to consider for
     * deduplication. Blocks shorter than this are always kept, which
     * protects separators (`---`), short headings, and formatting elements.
     *
     * Lower values catch more duplicates (e.g. repeated "Read more" links).
     * Higher values make deduplication more conservative.
     *
     * @defaultValue `10`
     */
    minLength?: number;
}

/** Token, character, and word counts for a piece of text. */
export interface TokenEstimate {
    /** Estimated token count (heuristic: ~4 characters per token). */
    tokens: number;

    /** Total character count (`string.length`). */
    characters: number;

    /** Word count (whitespace-delimited). */
    words: number;
}

/** Result returned by {@link convert}. */
export interface ConvertResult {
    /** The generated markdown string. */
    markdown: string;

    /** Token / character / word estimates for the generated markdown. */
    tokenEstimate: TokenEstimate;

    /**
     * A short, deterministic content hash of the markdown output.
     *
     * Useful as an `ETag` value or cache key — the same markdown always
     * produces the same hash. Format: `"<length_base36>-<fnv1a_base36>"`.
     */
    contentHash: string;
}

/**
 * Fully resolved options after merging user-supplied values with defaults.
 * All optional fields from {@link ConvertOptions} become required.
 *
 * @internal Used by the conversion pipeline; not typically needed by consumers.
 */
export type ResolvedOptions = Required<Omit<ConvertOptions, 'extract' | 'rules' | 'tokenCounter' | 'deduplicate' | 'frontmatter'>> & {
    extract: boolean | ExtractOptions;
    deduplicate: boolean | DeduplicateOptions;
    frontmatter: boolean | Record<string, string>;
    rules: Rule[];
    tokenCounter?: (text: string) => TokenEstimate;
};

/**
 * Content-signal header options for publisher consent signals.
 *
 * Each field maps to a directive in the `content-signal` HTTP header.
 * Only explicitly set fields are included in the header value.
 *
 * @see https://developers.cloudflare.com/agents/guides/enable-markdown-for-agents/
 */
export interface ContentSignalOptions {
    /** Signal whether content may be used for AI training. Maps to `ai-train=yes/no`. */
    aiTrain?: boolean;

    /** Signal whether content may appear in search results. Maps to `search=yes/no`. */
    search?: boolean;

    /** Signal whether content may be used as AI input/context. Maps to `ai-input=yes/no`. */
    aiInput?: boolean;
}

/**
 * Options accepted by all framework middleware adapters.
 * Extends {@link ConvertOptions} with middleware-specific settings.
 */
export interface MiddlewareOptions extends ConvertOptions {
    /**
     * Response header name used to expose the estimated token count.
     *
     * @defaultValue `"x-markdown-tokens"`
     */
    tokenHeader?: string;

    /**
     * Set a `content-signal` HTTP header on converted responses to communicate
     * publisher consent for AI training, search indexing, and AI input usage.
     *
     * Only set when explicitly configured (opt-in).
     */
    contentSignal?: ContentSignalOptions;
}
