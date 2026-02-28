/**
 * Runtime-agnostic HTML to Markdown converter with content extraction and plugin system.
 *
 * ```ts
 * import { convert } from "@markdown-for-agents/core";
 *
 * const result = convert("<h1>Hello</h1><p>World</p>");
 * console.log(result.markdown);
 * ```
 * @module
 */

export { convert } from './core/converter.js';
export { getDefaultRules, createRule } from './rules/index.js';
export { extractContent } from './extract/index.js';
export { estimateTokens } from './tokens/index.js';
export { buildContentSignalHeader } from './core/content-signal.js';

export type {
    ConvertOptions,
    ConvertResult,
    ContentSignalOptions,
    DeduplicateOptions,
    Rule,
    RuleContext,
    ExtractOptions,
    TokenEstimate,
    MiddlewareOptions,
    ResolvedOptions
} from './types.js';
