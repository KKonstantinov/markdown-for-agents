import type { Rule } from '../types.js';
import { blockRules } from './block.js';
import { inlineRules } from './inline.js';
import { listRules } from './list.js';
import { tableRules } from './table.js';

let cached: Rule[] | null = null;

/**
 * Return the built-in conversion rules (block, inline, list, table).
 * The result is cached after the first call.
 */
export function getDefaultRules(): Rule[] {
    cached ??= [...blockRules, ...inlineRules, ...listRules, ...tableRules];
    return cached;
}

/**
 * Convenience factory for creating a {@link Rule}.
 *
 * @param filter - Tag name(s) or predicate to match elements.
 * @param replacement - Function that produces the markdown output.
 * @param priority - Sort priority (higher runs first). Defaults to `100`.
 */
export function createRule(filter: Rule['filter'], replacement: Rule['replacement'], priority = 100): Rule {
    return { filter, replacement, priority };
}
