/**
 * @module
 *
 * Fast token estimation utilities for LLM context budgeting.
 *
 * ```ts
 * import { estimateTokens } from "@markdown-for-agents/core/tokens";
 *
 * const estimate = estimateTokens("Hello world");
 * console.log(estimate.tokens);
 * ```
 */

import type { TokenEstimate } from '../types.js';

/**
 * Estimate the token, character, and word counts for a string.
 *
 * Uses a fast heuristic of ~4 characters per token, which is a reasonable
 * approximation for English text across most LLM tokenizers.
 *
 * @param text - The text to measure.
 */
export function estimateTokens(text: string): TokenEstimate {
    const characters = text.length;
    const words = text.split(/\s+/).filter(Boolean).length;
    // Rough heuristic: ~4 characters per token for English text
    const tokens = Math.ceil(characters / 4);

    return { tokens, characters, words };
}
