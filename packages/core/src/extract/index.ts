/**
 * Content extraction utilities for pulling main content from HTML pages.
 *
 * ```ts
 * import { extractContent } from "@markdown-for-agents/core/extract";
 *
 * const result = extractContent("<html><body><main>Content</main></body></html>");
 * console.log(result.markdown);
 * ```
 * @module
 */

export { extractContent } from './extractor.js';
