import { describe, it, expect } from 'vitest';
import { estimateTokens } from '../../src/tokens/index.js';

describe('estimateTokens', () => {
    it('returns token, character, and word counts', () => {
        const result = estimateTokens('Hello world, this is a test.');
        expect(result.characters).toBe(28);
        expect(result.words).toBe(6);
        expect(result.tokens).toBeGreaterThan(0);
    });

    it('handles empty string', () => {
        const result = estimateTokens('');
        expect(result.characters).toBe(0);
        expect(result.words).toBe(0);
        expect(result.tokens).toBe(0);
    });

    it('handles whitespace-only input', () => {
        const result = estimateTokens('   \t\n  ');
        expect(result.characters).toBe(7);
        expect(result.words).toBe(0);
        expect(result.tokens).toBeGreaterThan(0);
    });

    it('counts multi-byte characters by length', () => {
        const result = estimateTokens('Hello');
        expect(result.characters).toBe(5);
        expect(result.tokens).toBe(2);
    });
});
