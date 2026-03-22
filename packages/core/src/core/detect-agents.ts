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
 * Returns the reason for conversion, or `false` when the request should
 * pass through:
 *
 * - `'accept-header'` — the `Accept` header includes `text/markdown`
 * - `'agent-detected'` — `detectAgents` matched the `User-Agent`
 * - `false` — no match, pass through
 *
 * When `detectAgents` is a `string[]` it **replaces** (not extends) the
 * built-in list.
 */
export function shouldServeMarkdown(
    acceptHeader: string,
    userAgent: string | undefined,
    detectAgents: boolean | string[] | undefined
): 'accept-header' | 'agent-detected' | false {
    if (acceptHeader.includes('text/markdown')) return 'accept-header';

    if (!detectAgents || !userAgent) return false;

    const patterns = detectAgents === true ? KNOWN_AGENTS : detectAgents;
    const ua = userAgent.toLowerCase();
    return patterns.some(pattern => ua.includes(pattern.toLowerCase())) ? 'agent-detected' : false;
}

/**
 * Returns `true` when agent detection is enabled, which means the `Vary`
 * header should include `User-Agent`.
 */
/**
 * Returns the `Content-Type` value for converted responses.
 *
 * - `'accept-header'` — client explicitly asked for markdown → `text/markdown`
 * - `'agent-detected'` — auto-detected agent that didn't ask for markdown → `text/plain`
 *   (some agents reject responses with unexpected content types)
 */
export function markdownContentType(reason: 'accept-header' | 'agent-detected'): string {
    return reason === 'accept-header' ? 'text/markdown; charset=utf-8' : 'text/plain; charset=utf-8';
}

export function isAgentDetectionEnabled(detectAgents: boolean | string[] | undefined): boolean {
    return detectAgents === true || (Array.isArray(detectAgents) && detectAgents.length > 0);
}
