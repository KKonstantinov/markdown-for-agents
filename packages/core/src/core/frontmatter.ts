import type { Document } from 'domhandler';
import { getTextContent } from '../rules/util.js';

/**
 * Patterns that require YAML quoting when present in a value.
 * Uses `: ` (colon-space) rather than bare `:` to avoid quoting URLs.
 */
const NEEDS_QUOTING = /: |[#"'{}[\]|>\n\\]|^\s|\s$/;

/**
 * Extract page metadata from the `<head>` element of an HTML document.
 *
 * Extracts:
 * - `title` from `<title>` text content
 * - `description` from `<meta name="description">`
 * - `image` from `<meta property="og:image">`
 *
 * @returns Only fields with non-empty values.
 */
export function extractMetadata(document: Document): Record<string, string> {
    const meta: Record<string, string> = {};

    const head = findHead(document);
    if (!head) return meta;

    for (const child of head.children) {
        if (!('name' in child) || typeof child.name !== 'string') continue;

        if (child.name === 'title') {
            const text = getTextContent(child).trim();
            if (text) meta.title = text;
        }

        if (child.name === 'meta' && 'attribs' in child) {
            const attrs = child.attribs as Record<string, string>;
            const name = 'name' in attrs ? attrs.name.toLowerCase() : undefined;
            const property = 'property' in attrs ? attrs.property.toLowerCase() : undefined;
            const content = 'content' in attrs ? attrs.content.trim() : undefined;

            if (!content) continue;

            if (name === 'description') {
                meta.description = content;
            } else if (property === 'og:image') {
                meta.image = content;
            }
        }
    }

    return meta;
}

/**
 * Serialize a metadata record into a YAML frontmatter block.
 *
 * Output order: `title`, `description`, `image`, then remaining keys alphabetically.
 * Returns an empty string if the record has no entries.
 */
export function serializeFrontmatter(meta: Record<string, string>): string {
    const keys = Object.keys(meta);
    if (keys.length === 0) return '';

    const priority = ['title', 'description', 'image'];
    const rest = keys.filter(k => !priority.includes(k));
    rest.sort();
    const ordered = [...priority.filter(k => k in meta), ...rest];

    const lines = ordered.map(key => `${key}: ${yamlQuote(meta[key])}`);
    return `---\n${lines.join('\n')}\n---\n`;
}

function yamlQuote(value: string): string {
    if (NEEDS_QUOTING.test(value)) {
        return `"${value.replaceAll('\\', '\\\\').replaceAll('"', String.raw`\"`)}"`;
    }
    return value;
}

/**
 * Walk the document to find a `<head>` element.
 * Handles both `<html><head>…` and bare `<head>` as a direct document child.
 */
function findHead(document: Document): import('domhandler').Element | undefined {
    for (const child of document.children) {
        if ('name' in child && child.name === 'head') {
            return child as import('domhandler').Element;
        }
        if ('name' in child && child.name === 'html' && 'children' in child) {
            for (const grandchild of child.children) {
                if ('name' in grandchild && (grandchild as import('domhandler').Element).name === 'head') {
                    return grandchild as import('domhandler').Element;
                }
            }
        }
    }
    return undefined;
}
