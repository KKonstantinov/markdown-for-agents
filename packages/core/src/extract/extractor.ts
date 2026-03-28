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

/**
 * Recursively walks the DOM tree and removes elements that match any
 * of the strip criteria. Removal is done in-place by splicing the
 * parent's `children` array.
 *
 * @param node - The parent node whose children will be inspected.
 * @param stripTags - Tag names to remove (e.g. `nav`, `footer`).
 * @param stripRoles - ARIA roles to remove (e.g. `navigation`, `banner`).
 * @param stripClasses - CSS class substrings or regex patterns to match for removal.
 * @param stripIds - Element ID substrings or regex patterns to match for removal.
 */
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

/**
 * Determines whether an element should be stripped from the DOM tree.
 *
 * Checks against tag name, ARIA role, CSS class, and element ID in that order.
 *
 * @param el - The element to evaluate.
 * @param stripTags - Tag names to match.
 * @param stripRoles - ARIA roles to match.
 * @param stripClasses - CSS class substrings or regex patterns to match.
 * @param stripIds - Element ID substrings or regex patterns to match.
 * @returns `true` if the element matches any strip criterion.
 */
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
    if (className && matchesAny(stripBrackets(className), stripClasses)) return true;

    const id = el.attribs.id;
    if (id && matchesAny(id, stripIds)) return true;

    return false;
}

/**
 * Remove Tailwind CSS arbitrary-value brackets from a class string so that
 * CSS custom property names (e.g. `[--fd-sidebar-width:268px]`) don't
 * trigger semantic class-name patterns like `/sidebar/`.
 */
function stripBrackets(value: string): string {
    return value.replaceAll(/\[[^\]]*\]/g, '');
}

/**
 * Tests a string against a list of patterns.
 *
 * @param value - The string to test (e.g. a class name or element ID).
 * @param patterns - String substrings (checked with `includes`) or `RegExp` instances.
 * @returns `true` if `value` matches at least one pattern.
 */
function matchesAny(value: string, patterns: (string | RegExp)[]): boolean {
    for (const pattern of patterns) {
        if ((typeof pattern === 'string' && value.includes(pattern)) || (pattern instanceof RegExp && pattern.test(value))) return true;
    }
    return false;
}
