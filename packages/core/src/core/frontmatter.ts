import { isTag } from 'domhandler';
import type { Document, Element } from 'domhandler';
import { getTextContent } from '../rules/util.js';

/**
 * Patterns that require YAML quoting when present in a value.
 * Uses `: ` (colon-space) rather than bare `:` to avoid quoting URLs.
 */
const NEEDS_QUOTING = /: |[#"'{}[\]|>\n\\]|^\s|\s$/;

/**
 * Extracts page metadata from the `<head>` element of an HTML document.
 *
 * Extracts:
 * - `title` from `<title>` text content
 * - `description` from `<meta name="description">`
 * - `image` from `<meta property="og:image">`
 *
 * @param document - The parsed DOM document.
 * @returns A record containing only fields with non-empty values.
 */
export function extractMetadata(document: Document): Record<string, string> {
    const meta: Record<string, string> = {};

    const head = findHead(document);
    if (!head) return meta;

    for (const child of head.children) {
        if (!isTag(child)) continue;

        if (child.name === 'title') {
            const text = getTextContent(child).trim();
            if (text) meta.title = text;
        }

        if (child.name === 'meta') {
            const entry = extractFromMeta(child.attribs);
            if (entry) meta[entry[0]] = entry[1];
        }
    }

    return meta;
}

/**
 * Extracts a key-value pair from a `<meta>` element's attributes.
 *
 * Recognizes `<meta name="description">` and `<meta property="og:image">`.
 *
 * @param attrs - The element's attribute map.
 * @returns A `[key, value]` tuple, or `undefined` for unrecognized or empty meta elements.
 */
function extractFromMeta(attrs: Record<string, string>): [string, string] | undefined {
    if (!('content' in attrs)) return undefined;
    const content = attrs.content.trim();
    if (!content) return undefined;

    if ('name' in attrs && attrs.name.toLowerCase() === 'description') return ['description', content];
    if ('property' in attrs && attrs.property.toLowerCase() === 'og:image') return ['image', content];

    return undefined;
}

/**
 * Serializes a metadata record into a YAML frontmatter block.
 *
 * Output order: `title`, `description`, `image`, then remaining keys alphabetically.
 *
 * @param meta - The key-value metadata record to serialize.
 * @returns A `---`-delimited YAML frontmatter string, or an empty string if `meta` is empty.
 */
export function serializeFrontmatter(meta: Record<string, string>): string {
    const keys = Object.keys(meta);
    if (keys.length === 0) return '';

    const priority = ['title', 'description', 'image'];
    const rest = keys.filter(k => !priority.includes(k));
    rest.sort((a, b) => a.localeCompare(b));
    const ordered = [...priority.filter(k => k in meta), ...rest];

    const lines = ordered.map(key => `${key}: ${yamlQuote(meta[key])}`);
    return `---\n${lines.join('\n')}\n---\n`;
}

/**
 * Wraps a YAML value in double quotes if it contains characters that
 * require quoting (colons, hashes, brackets, leading/trailing whitespace, etc.).
 *
 * @param value - The raw YAML value string.
 * @returns The value as-is or wrapped in escaped double quotes.
 */
function yamlQuote(value: string): string {
    if (NEEDS_QUOTING.test(value)) {
        const escaped = value.replaceAll('\\', String.raw`\\`).replaceAll('"', String.raw`\"`);
        return `"${escaped}"`;
    }
    return value;
}

/**
 * Walks the document to find a `<head>` element.
 *
 * Handles both `<html><head>...` and bare `<head>` as a direct document child.
 *
 * @param document - The parsed DOM document.
 * @returns The `<head>` element, or `undefined` if not found.
 */
function findHead(document: Document): Element | undefined {
    for (const child of document.children) {
        if (!isTag(child)) continue;

        if (child.name === 'head') return child;

        if (child.name === 'html') {
            for (const grandchild of child.children) {
                if (isTag(grandchild) && grandchild.name === 'head') {
                    return grandchild;
                }
            }
        }
    }
    return undefined;
}
