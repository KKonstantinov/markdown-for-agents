import type { ChildNode } from 'domhandler';

/**
 * Recursively extracts the plain text content from a DOM node.
 *
 * For text nodes, returns the text data directly. For element nodes,
 * concatenates the text content of all descendants. Returns an empty
 * string for nodes that contain no text (e.g. comment nodes).
 *
 * @param node - The DOM node to extract text from.
 * @returns The concatenated plain text content of the node and its descendants.
 */
export function getTextContent(node: ChildNode): string {
    if ('data' in node && typeof node.data === 'string') return node.data;
    if ('children' in node && Array.isArray(node.children)) {
        return node.children.map(child => getTextContent(child)).join('');
    }
    return '';
}
