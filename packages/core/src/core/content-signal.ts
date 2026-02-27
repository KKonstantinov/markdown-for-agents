import type { ContentSignalOptions } from '../types.js';

/**
 * Build the value for a `content-signal` HTTP header from the given options.
 *
 * Only includes directives that are explicitly set (not `undefined`).
 * Returns `undefined` when no directives are set.
 *
 * @example
 * ```ts
 * buildContentSignalHeader({ aiTrain: true, search: true, aiInput: true });
 * // → "ai-train=yes, search=yes, ai-input=yes"
 * ```
 */
export function buildContentSignalHeader(options: ContentSignalOptions): string | undefined {
    const parts: string[] = [];

    if (options.aiTrain !== undefined) {
        parts.push(`ai-train=${options.aiTrain ? 'yes' : 'no'}`);
    }
    if (options.search !== undefined) {
        parts.push(`search=${options.search ? 'yes' : 'no'}`);
    }
    if (options.aiInput !== undefined) {
        parts.push(`ai-input=${options.aiInput ? 'yes' : 'no'}`);
    }

    return parts.length > 0 ? parts.join(', ') : undefined;
}
