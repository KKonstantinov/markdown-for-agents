import type { Document, Element, Text } from 'domhandler';
import { isTag, isText } from 'domhandler';
import type { Rule, RuleContext, ResolvedOptions } from '../types.js';

export interface WalkerState {
    options: ResolvedOptions;
    rules: Rule[];
    listDepth: number;
    insidePre: boolean;
    insideTable: boolean;
}

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
 * Returns true when the last accumulated fragment ends with non-whitespace
 * AND the previous sibling is an element (not a text node).  This means two
 * adjacent element nodes produced content with no text node between them —
 * so we need to inject a separator.
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

function matchesFilter(filter: Rule['filter'], element: Element): boolean {
    if (typeof filter === 'string') return element.name === filter;
    if (Array.isArray(filter)) return filter.includes(element.name);
    return filter(element);
}
