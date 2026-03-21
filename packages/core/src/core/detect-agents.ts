/**
 * Built-in list of known AI agent user-agent substrings.
 *
 * Used by {@link shouldServeMarkdown} when `detectAgents` is `true`.
 * Exported so consumers can extend the list:
 *
 * ```ts
 * markdown({ detectAgents: [...KNOWN_AGENTS, 'my-custom-bot'] })
 * ```
 *
 * Sources for each entry are listed inline.
 */
export const KNOWN_AGENTS: readonly string[] = [
    // Anthropic — https://support.claude.com/en/articles/8896518
    'claudebot',
    'claude-user',
    'claude-searchbot',

    // OpenAI — https://platform.openai.com/docs/bots
    'chatgpt-user',
    'gptbot',
    'oai-searchbot',

    // Perplexity — https://docs.perplexity.ai/docs/resources/perplexity-crawlers
    'perplexitybot',
    'perplexity-user',

    // Meta — https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/
    'meta-externalagent',

    // Amazon — https://developer.amazon.com/amazonbot
    'amazonbot',

    // Cohere — https://cohere.com
    'cohere-ai'
];

/**
 * Determine whether an incoming request should receive a markdown response.
 *
 * Returns `true` when:
 * 1. The `Accept` header includes `text/markdown` (always checked), **or**
 * 2. `detectAgents` is enabled and the `User-Agent` matches a known pattern.
 *
 * When `detectAgents` is a `string[]` it **replaces** (not extends) the
 * built-in list.
 */
export function shouldServeMarkdown(
    acceptHeader: string,
    userAgent: string | undefined,
    detectAgents: boolean | string[] | undefined
): boolean {
    if (acceptHeader.includes('text/markdown')) return true;

    if (!detectAgents || !userAgent) return false;

    const patterns = detectAgents === true ? KNOWN_AGENTS : detectAgents;
    const ua = userAgent.toLowerCase();
    return patterns.some(pattern => ua.includes(pattern.toLowerCase()));
}

/**
 * Returns `true` when agent detection is enabled, which means the `Vary`
 * header should include `User-Agent`.
 */
export function isAgentDetectionEnabled(detectAgents: boolean | string[] | undefined): boolean {
    return detectAgents === true || (Array.isArray(detectAgents) && detectAgents.length > 0);
}
