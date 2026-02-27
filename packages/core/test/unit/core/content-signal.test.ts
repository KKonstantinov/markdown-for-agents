import { describe, it, expect } from 'vitest';
import { buildContentSignalHeader } from '../../../src/core/content-signal.js';

describe('buildContentSignalHeader', () => {
    it('returns all directives when all are set to true', () => {
        expect(buildContentSignalHeader({ aiTrain: true, search: true, aiInput: true })).toBe('ai-train=yes, search=yes, ai-input=yes');
    });

    it('returns all directives when all are set to false', () => {
        expect(buildContentSignalHeader({ aiTrain: false, search: false, aiInput: false })).toBe('ai-train=no, search=no, ai-input=no');
    });

    it('returns only set directives', () => {
        expect(buildContentSignalHeader({ aiTrain: true })).toBe('ai-train=yes');
        expect(buildContentSignalHeader({ search: false })).toBe('search=no');
        expect(buildContentSignalHeader({ aiInput: true })).toBe('ai-input=yes');
    });

    it('returns undefined when no keys are set', () => {
        expect(buildContentSignalHeader({})).toBeUndefined();
    });

    it('handles mixed true/false values', () => {
        expect(buildContentSignalHeader({ aiTrain: true, search: false, aiInput: true })).toBe('ai-train=yes, search=no, ai-input=yes');
    });

    it('ignores undefined values', () => {
        expect(buildContentSignalHeader({ aiTrain: true, search: undefined, aiInput: true })).toBe('ai-train=yes, ai-input=yes');
    });
});
