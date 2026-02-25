import { parseDocument } from 'htmlparser2';
import type { Document } from 'domhandler';

export function parse(html: string): Document {
    return parseDocument(html, {
        lowerCaseTags: true,
        lowerCaseAttributeNames: true
    });
}
