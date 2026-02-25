import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { convert } from '../../../src/core/converter.js';

const fixture = (name: string) => readFileSync(path.resolve(import.meta.dirname, '../../fixtures', name), 'utf8');

describe('fixture-based integration', () => {
    describe('nested-lists.html', () => {
        it('converts nested unordered lists with correct indentation', () => {
            const html = fixture('nested-lists.html');
            const { markdown } = convert(html);

            expect(markdown).toContain('- Item one');
            expect(markdown).toContain('- Item two');
            expect(markdown).toContain('  - Nested A');
            expect(markdown).toContain('  - Nested B');
            expect(markdown).toContain('- Item three');
        });
    });

    describe('code-blocks.html', () => {
        it('converts fenced code block with language', () => {
            const html = fixture('code-blocks.html');
            const { markdown } = convert(html);

            expect(markdown).toContain('```typescript');
            expect(markdown).toContain('function greet(name: string): string {');
            expect(markdown).toContain('```');
        });

        it('converts inline code alongside fenced block', () => {
            const html = fixture('code-blocks.html');
            const { markdown } = convert(html);

            expect(markdown).toContain('`inline code`');
        });
    });

    describe('full-page.html', () => {
        it('converts full page without extraction', () => {
            const html = fixture('full-page.html');
            const { markdown } = convert(html);

            // Without extraction, everything is converted
            expect(markdown).toContain('Article Title');
            expect(markdown).toContain('main content');
            expect(markdown).toContain('Site Header');
        });

        it('extracts main content when extraction is enabled', () => {
            const html = fixture('full-page.html');
            const { markdown } = convert(html, { extract: true });

            expect(markdown).toContain('Article Title');
            expect(markdown).toContain('main content');
            expect(markdown).not.toContain('Site Header');
            expect(markdown).not.toContain('Copyright');
        });
    });

    describe('table.html', () => {
        it('produces valid GFM table', () => {
            const html = fixture('table.html');
            const { markdown } = convert(html);

            const lines = markdown.trim().split('\n');
            // Should have header row, separator row, and data rows
            expect(lines.length).toBeGreaterThanOrEqual(4);
            // Every line should start and end with |
            for (const line of lines) {
                expect(line.startsWith('|')).toBe(true);
                expect(line.endsWith('|')).toBe(true);
            }
        });
    });
});
