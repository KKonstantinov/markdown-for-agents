/**
 * @module
 *
 * Content extraction utilities for pulling main content from HTML pages.
 *
 * ```ts
 * import { extractContent } from "@markdown-for-agents/core/extract";
 *
 * const result = extractContent("<html><body><main>Content</main></body></html>");
 * console.log(result.markdown);
 * ```
 */

export { extractContent } from './extractor.js';
