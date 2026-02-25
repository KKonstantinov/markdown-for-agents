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
     * @defaultValue `false`
     */
    deduplicate?: boolean;
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
}

/**
 * Fully resolved options after merging user-supplied values with defaults.
 * All optional fields from {@link ConvertOptions} become required.
 *
 * @internal Used by the conversion pipeline; not typically needed by consumers.
 */
export type ResolvedOptions = Required<Omit<ConvertOptions, 'extract' | 'rules'>> & {
    extract: boolean | ExtractOptions;
    rules: Rule[];
};

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
}
