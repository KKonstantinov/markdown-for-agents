import type { Document, Element, Text } from 'domhandler';
import { isTag, isText } from 'domhandler';
import type { Rule, RuleContext, ResolvedOptions } from '../types.js';

/**
 * Contextual state threaded through the depth-first DOM traversal.
 *
 * The walker creates derived copies of this state as it descends into
 * `<pre>`, `<table>`, and list elements to track nesting context.
 *
 * @internal
 */
export interface WalkerState {
    /** Resolved conversion options (user-supplied merged with defaults). */
    options: ResolvedOptions;
    /** Ordered list of rules to apply to each element (highest priority first). */
    rules: Rule[];
    /** Current nesting depth for ordered/unordered lists (0 = top level). */
    listDepth: number;
    /** Whether the current node is inside a `<pre>` block (preserves whitespace). */
    insidePre: boolean;
    /** Whether the current node is inside a `<table>` (strips whitespace-only text nodes). */
    insideTable: boolean;
}

/**
 * Performs a depth-first traversal of a DOM node, applying matching rules to
 * each element and collecting the resulting markdown fragments.
 *
 * Text nodes are normalized (whitespace collapsed) unless inside a `<pre>` block.
 * Adjacent element nodes that produce content with no intervening whitespace
 * receive an injected space to prevent malformed markdown output.
 *
 * @param node - The DOM node (Document or Element) whose children will be traversed.
 * @param state - The current walker state (options, rules, nesting context).
 * @returns The concatenated markdown string produced by all child nodes.
 * @internal
 */
export function walk(node: Document | Element, state: WalkerState): string {
    const fragments: string[] = [];

    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];

        if (isText(child)) {
            fragments.push(processText(child, state));
            continue;
        }

        if (isTag(child)) {
            const element = child;
            const result = applyRules(element, i, node, state);
            if (result !== null) {
                // When two adjacent elements produce content with no whitespace
                // between them (common in JSX/React output), insert a space to
                // prevent markdown like [Link1](/a)[Link2](/b).
                if (result.length > 0 && !state.insidePre && !state.insideTable && needsSeparator(fragments, node, i)) {
                    fragments.push(' ');
                }
                fragments.push(result);
            }
        }
    }

    return fragments.join('');
}

/**
 * Determines whether a whitespace separator should be injected between
 * two adjacent element nodes that produced content with no intervening text node.
 *
 * @param fragments - The markdown fragments accumulated so far.
 * @param parent - The parent node containing the current element.
 * @param currentIndex - The index of the current child within the parent.
 * @returns `true` if a space should be inserted before the current fragment.
 */
function needsSeparator(fragments: string[], parent: Document | Element, currentIndex: number): boolean {
    // Nothing accumulated yet — no separator needed
    if (fragments.length === 0) return false;

    const last = fragments.at(-1);
    // Last fragment already ends with whitespace — no separator needed
    if (!last || /\s$/.test(last)) return false;

    // Walk backwards to find the previous sibling — if it's a text node
    // the whitespace was already handled by processText.
    for (let j = currentIndex - 1; j >= 0; j--) {
        const prev = parent.children[j];
        if (isText(prev)) {
            // There was a text node between the two elements — whitespace
            // was already captured by processText
            return false;
        }
        if (isTag(prev)) {
            // Previous sibling was also an element — we need a separator
            return true;
        }
    }

    return false;
}

/**
 * Converts a text node to its markdown string representation.
 *
 * Inside `<pre>` blocks the raw text is preserved. Inside tables,
 * whitespace-only text nodes are discarded (HTML formatting noise).
 * Otherwise, runs of whitespace are collapsed to a single space.
 *
 * @param node - The text node to process.
 * @param state - Current walker state (used to check `insidePre` / `insideTable`).
 * @returns The processed text string, or an empty string if the node should be skipped.
 */
function processText(node: Text, state: WalkerState): string {
    if (state.insidePre) {
        return node.data;
    }
    // Inside tables, skip whitespace-only text nodes (HTML formatting noise)
    if (state.insideTable && /^\s+$/.test(node.data)) {
        return '';
    }
    return node.data.replaceAll(/\s+/g, ' ');
}

/**
 * Tries each rule against an element in priority order.
 *
 * If no rule claims the element (all return `undefined`), falls through
 * to recursively walking the element's children.
 *
 * @param element - The element to match against rules.
 * @param siblingIndex - The element's index within its parent's children.
 * @param parent - The element's parent node.
 * @param state - Current walker state.
 * @returns The first non-`undefined` rule result, or the recursive walk output.
 */
function applyRules(element: Element, siblingIndex: number, parent: Element | Document, state: WalkerState): string | null {
    for (const rule of state.rules) {
        if (!matchesFilter(rule.filter, element)) continue;

        const context: RuleContext = {
            node: element,
            parent,
            convertChildren: n => walk(n, deriveState(element, state)),
            options: state.options,
            listDepth: state.listDepth,
            insidePre: state.insidePre,
            insideTable: state.insideTable,
            siblingIndex
        };

        const result = rule.replacement(context);
        if (result !== undefined) return result;
    }

    return walk(element, deriveState(element, state));
}

/**
 * Creates a derived walker state when descending into `<pre>`, `<table>`,
 * or list elements. Returns the same state object unchanged for all other elements.
 *
 * @param element - The element being descended into.
 * @param state - The current walker state.
 * @returns A new state with updated nesting flags, or the original state if unchanged.
 */
function deriveState(element: Element, state: WalkerState): WalkerState {
    const name = element.name;
    const isPre = name === 'pre';
    const isTable = name === 'table';
    const isList = name === 'ul' || name === 'ol';

    if (!isPre && !isTable && !isList) return state;

    return {
        ...state,
        insidePre: state.insidePre || isPre,
        insideTable: state.insideTable || isTable,
        listDepth: isList ? state.listDepth + 1 : state.listDepth
    };
}

/**
 * Tests whether an element matches a rule's filter.
 *
 * @param filter - A tag name string, array of tag names, or predicate function.
 * @param element - The DOM element to test.
 * @returns `true` if the element matches the filter.
 */
function matchesFilter(filter: Rule['filter'], element: Element): boolean {
    if (typeof filter === 'string') return element.name === filter;
    if (Array.isArray(filter)) return filter.includes(element.name);
    return filter(element);
}
