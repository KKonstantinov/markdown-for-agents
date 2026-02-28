import type { Document, Element, ChildNode } from 'domhandler';
import { isTag } from 'domhandler';
import type { ExtractOptions } from '../types.js';
import { DEFAULT_STRIP_TAGS, DEFAULT_STRIP_ROLES, DEFAULT_STRIP_CLASSES, DEFAULT_STRIP_IDS } from './selectors.js';

/**
 * Remove non-content elements from a parsed HTML document in-place.
 *
 * Strips elements matching the built-in selectors (nav, ads, sidebars, etc.)
 * plus any additional patterns provided via {@link ExtractOptions}.
 *
 * @param document - The parsed DOM tree to prune.
 * @param options - Additional selectors and overrides.
 */
export function extractContent(document: Document, options?: ExtractOptions): void {
    const stripTags = new Set([...DEFAULT_STRIP_TAGS, ...(options?.stripTags ?? [])]);

    if (options?.keepHeader) stripTags.delete('header');
    if (options?.keepFooter) stripTags.delete('footer');
    if (options?.keepNav) stripTags.delete('nav');

    const stripRoles = new Set([...DEFAULT_STRIP_ROLES, ...(options?.stripRoles ?? [])]);

    const stripClasses = [...DEFAULT_STRIP_CLASSES, ...(options?.stripClasses ?? [])];

    const stripIds = [...DEFAULT_STRIP_IDS, ...(options?.stripIds ?? [])];

    pruneTree(document, stripTags, stripRoles, stripClasses, stripIds);
}

function pruneTree(
    node: Document | Element,
    stripTags: Set<string>,
    stripRoles: Set<string>,
    stripClasses: (string | RegExp)[],
    stripIds: (string | RegExp)[]
): void {
    const toRemove: ChildNode[] = [];

    for (const child of node.children) {
        if (!isTag(child)) continue;

        const el = child;

        if (shouldStrip(el, stripTags, stripRoles, stripClasses, stripIds)) {
            toRemove.push(child);
            continue;
        }

        pruneTree(el, stripTags, stripRoles, stripClasses, stripIds);
    }

    for (const child of toRemove) {
        const idx = node.children.indexOf(child);
        if (idx !== -1) {
            node.children.splice(idx, 1);
            child.parent = null;
        }
    }
}

function shouldStrip(
    el: Element,
    stripTags: Set<string>,
    stripRoles: Set<string>,
    stripClasses: (string | RegExp)[],
    stripIds: (string | RegExp)[]
): boolean {
    if (stripTags.has(el.name)) return true;

    const role = el.attribs.role;
    if (role && stripRoles.has(role)) return true;

    const className = el.attribs.class;
    if (className && matchesAny(className, stripClasses)) return true;

    const id = el.attribs.id;
    if (id && matchesAny(id, stripIds)) return true;

    return false;
}

function matchesAny(value: string, patterns: (string | RegExp)[]): boolean {
    for (const pattern of patterns) {
        if ((typeof pattern === 'string' && value.includes(pattern)) || (pattern instanceof RegExp && pattern.test(value))) return true;
    }
    return false;
}
