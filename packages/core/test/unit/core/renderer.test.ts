import { describe, it, expect } from 'vitest';
import { render } from '../../../src/core/renderer.js';

describe('render', () => {
    it(String.raw`normalizes \r\n to \n`, () => {
        expect(render('line1\r\nline2\r\n')).toBe('line1\nline2\n');
    });

    it(String.raw`normalizes standalone \r to \n`, () => {
        expect(render('line1\rline2')).toBe('line1\nline2\n');
    });

    it('collapses whitespace-only lines to empty lines', () => {
        expect(render('a\n   \nb')).toBe('a\n\nb\n');
    });

    it('collapses 3+ consecutive newlines to 2', () => {
        expect(render('a\n\n\n\nb')).toBe('a\n\nb\n');
    });

    it('trims trailing whitespace from lines', () => {
        expect(render('hello   \nworld  ')).toBe('hello\nworld\n');
    });

    it('preserves trailing double-space for line breaks', () => {
        expect(render('line1  \nline2')).toBe('line1  \nline2\n');
    });

    it('trims the entire output and appends a single newline', () => {
        expect(render('\n\n  hello  \n\n')).toBe('hello\n');
    });

    it('handles empty input', () => {
        expect(render('')).toBe('\n');
    });
});
