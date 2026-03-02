import { parseDocument } from 'htmlparser2';
import type { Document } from 'domhandler';

/**
 * Parses an HTML string into a DOM tree using `htmlparser2`.
 *
 * Tags and attribute names are lowercased for consistent matching in the rule system.
 *
 * @param html - Raw HTML string to parse.
 * @returns A `Document` node representing the parsed DOM tree.
 * @internal
 */
export function parse(html: string): Document {
    return parseDocument(html, {
        lowerCaseTags: true,
        lowerCaseAttributeNames: true
    });
}
