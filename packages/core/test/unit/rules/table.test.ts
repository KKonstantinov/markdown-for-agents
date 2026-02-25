import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { convert } from '../../../src/core/converter.js';

const fixture = (name: string) => readFileSync(path.resolve(import.meta.dirname, '../../fixtures', name), 'utf8');

describe('table rules', () => {
    it('converts table with thead and tbody', () => {
        const html = fixture('table.html');
        const { markdown } = convert(html);

        expect(markdown).toContain('| Name | Age | City |');
        expect(markdown).toContain('| --- | --- | --- |');
        expect(markdown).toContain('| Alice | 30 | New York |');
        expect(markdown).toContain('| Bob | 25 | San Francisco |');
    });

    it('escapes pipe characters in cell content', () => {
        const { markdown } = convert('<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>x | y</td></tr></tbody></table>');
        expect(markdown).toContain(String.raw`x \| y`);
    });

    it('handles table without thead (no separator row)', () => {
        const { markdown } = convert('<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>');
        expect(markdown).toContain('| A | B |');
        expect(markdown).toContain('| C | D |');
        // No separator row
        expect(markdown).not.toContain('| --- |');
    });

    it('handles table with tfoot', () => {
        const { markdown } = convert('<table><thead><tr><th>X</th></tr></thead><tfoot><tr><td>Total</td></tr></tfoot></table>');
        expect(markdown).toContain('| X |');
        expect(markdown).toContain('| Total |');
    });

    it('handles empty table cells', () => {
        const { markdown } = convert(
            '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td></td><td>data</td></tr></tbody></table>'
        );
        expect(markdown).toContain('| A | B |');
        expect(markdown).toContain('|  | data |');
    });

    it('handles single-column table', () => {
        const { markdown } = convert('<table><thead><tr><th>Only</th></tr></thead><tbody><tr><td>one</td></tr></tbody></table>');
        expect(markdown).toContain('| Only |');
        expect(markdown).toContain('| --- |');
        expect(markdown).toContain('| one |');
    });
});
