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

/**
 * Returns the length of the longest run of `char` in `text`.
 *
 * Used to size code fences and inline code delimiters so that runs of the
 * same character inside the content cannot close them early.
 *
 * @param text - The text to scan.
 * @param char - The single character to count runs of.
 * @returns The length of the longest consecutive run, or 0 if `char` does not occur.
 */
export function longestRun(text: string, char: string): number {
    let longest = 0;
    let current = 0;
    for (const c of text) {
        current = c === char ? current + 1 : 0;
        if (current > longest) longest = current;
    }
    return longest;
}
