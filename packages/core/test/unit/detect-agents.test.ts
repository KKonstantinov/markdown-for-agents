import { describe, it, expect } from 'vitest';
import { shouldServeMarkdown, isAgentDetectionEnabled, KNOWN_AGENTS } from '../../src/core/detect-agents.js';

describe('KNOWN_AGENTS', () => {
    it('is a non-empty array', () => {
        expect(KNOWN_AGENTS.length).toBeGreaterThan(0);
    });

    it('contains only lowercase strings', () => {
        for (const agent of KNOWN_AGENTS) {
            expect(agent).toBe(agent.toLowerCase());
        }
    });
});

describe('shouldServeMarkdown', () => {
    it('returns true when Accept includes text/markdown regardless of detectAgents', () => {
        expect(shouldServeMarkdown('text/markdown', undefined, undefined)).toBe(true);
        expect(shouldServeMarkdown('text/markdown', undefined, false)).toBe(true);
        expect(shouldServeMarkdown('text/markdown', 'Mozilla/5.0', true)).toBe(true);
    });

    it('returns false for non-markdown Accept when detectAgents is false', () => {
        expect(shouldServeMarkdown('text/html', 'ClaudeBot/1.0', false)).toBe(false);
    });

    it('returns false for non-markdown Accept when detectAgents is undefined', () => {
        expect(shouldServeMarkdown('text/html', 'ClaudeBot/1.0', undefined)).toBe(false);
    });

    it('returns true for known bot user-agent when detectAgents is true', () => {
        expect(shouldServeMarkdown('text/html', 'Mozilla/5.0 (compatible; ClaudeBot/1.0)', true)).toBe(true);
        expect(shouldServeMarkdown('text/html', 'ChatGPT-User/1.0', true)).toBe(true);
        expect(shouldServeMarkdown('text/html', 'Mozilla/5.0 (compatible; GPTBot/1.1)', true)).toBe(true);
        expect(shouldServeMarkdown('text/html', 'PerplexityBot/1.0', true)).toBe(true);
        expect(shouldServeMarkdown('text/html', 'Amazonbot/0.1', true)).toBe(true);
    });

    it('returns false for unknown user-agent when detectAgents is true', () => {
        expect(shouldServeMarkdown('text/html', 'Mozilla/5.0 Chrome/120', true)).toBe(false);
    });

    it('matches user-agent case-insensitively', () => {
        expect(shouldServeMarkdown('text/html', 'CLAUDEBOT/1.0', true)).toBe(true);
        expect(shouldServeMarkdown('text/html', 'claudeBot/1.0', true)).toBe(true);
    });

    it('returns false when user-agent is undefined even with detectAgents true', () => {
        expect(shouldServeMarkdown('text/html', undefined, true)).toBe(false);
    });

    it('returns false when user-agent is empty even with detectAgents true', () => {
        expect(shouldServeMarkdown('text/html', '', true)).toBe(false);
    });

    it('uses custom string[] patterns instead of built-in list', () => {
        expect(shouldServeMarkdown('text/html', 'MyCustomBot/1.0', ['mycustombot'])).toBe(true);
        expect(shouldServeMarkdown('text/html', 'ClaudeBot/1.0', ['mycustombot'])).toBe(false);
    });

    it('matches custom patterns case-insensitively', () => {
        expect(shouldServeMarkdown('text/html', 'MYCUSTOMBOT/1.0', ['MyCustomBot'])).toBe(true);
    });

    it('returns false for empty custom patterns array', () => {
        expect(shouldServeMarkdown('text/html', 'ClaudeBot/1.0', [])).toBe(false);
    });
});

describe('isAgentDetectionEnabled', () => {
    it('returns false for undefined', () => {
        expect(isAgentDetectionEnabled(undefined)).toBe(false);
    });

    it('returns false for false', () => {
        expect(isAgentDetectionEnabled(false)).toBe(false);
    });

    it('returns true for true', () => {
        expect(isAgentDetectionEnabled(true)).toBe(true);
    });

    it('returns true for non-empty string[]', () => {
        expect(isAgentDetectionEnabled(['mybot'])).toBe(true);
    });

    it('returns false for empty string[]', () => {
        expect(isAgentDetectionEnabled([])).toBe(false);
    });
});
