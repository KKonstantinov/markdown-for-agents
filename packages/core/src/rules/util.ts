import type { ChildNode } from 'domhandler';

export function getTextContent(node: ChildNode): string {
    if ('data' in node && typeof node.data === 'string') return node.data;
    if ('children' in node && Array.isArray(node.children)) {
        return node.children.map(child => getTextContent(child)).join('');
    }
    return '';
}
