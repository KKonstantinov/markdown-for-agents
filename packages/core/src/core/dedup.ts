/**
 * Default minimum fingerprint length to consider for deduplication.
 * Blocks shorter than this are always kept to avoid stripping
 * separators (---), short headings, or formatting elements.
 */
const DEFAULT_MIN_LENGTH = 10;

const HEADING_RE = /^#{1,6}\s/;

function normalize(text: string): string {
    return text.toLowerCase().replaceAll(/\s+/g, ' ');
}

/**
 * Removes duplicate content blocks from rendered Markdown.
 *
 * Uses section-aware deduplication: headings are grouped with their
 * immediately following content block to form compound fingerprints.
 * This prevents stripping repeated structural headings (e.g.
 * "### The situation") that appear in different content sections.
 *
 * - Heading + content = section fingerprint (heading + content combined)
 * - Standalone headings (followed by another heading or nothing) are
 *   always preserved
 * - Non-heading blocks are fingerprinted individually
 * - Blocks shorter than `minLength` characters are exempt from deduplication
 *
 * @param markdown - The rendered markdown string.
 * @param minLength - Minimum normalized character length for a block to be
 *   eligible for deduplication. Defaults to {@link DEFAULT_MIN_LENGTH} (10).
 */
export function deduplicateBlocks(markdown: string, minLength: number = DEFAULT_MIN_LENGTH): string {
    const blocks = markdown.split(/\n\n+/);
    const seen = new Set<string>();
    const kept: string[] = [];

    let i = 0;
    while (i < blocks.length) {
        const trimmed = blocks[i].trim();
        if (!trimmed) {
            i++;
            continue;
        }

        if (HEADING_RE.test(trimmed)) {
            // Find the next non-empty block
            let nextIdx = i + 1;
            while (nextIdx < blocks.length && !blocks[nextIdx].trim()) {
                nextIdx++;
            }

            const nextTrimmed = nextIdx < blocks.length ? blocks[nextIdx].trim() : '';
            const hasContent = nextTrimmed !== '' && !HEADING_RE.test(nextTrimmed);

            if (hasContent) {
                // Section: heading + content → compound fingerprint
                const sectionFp = normalize(trimmed + ' ' + nextTrimmed);

                if (sectionFp.length >= minLength && seen.has(sectionFp)) {
                    i = nextIdx + 1;
                    continue;
                }

                if (sectionFp.length >= minLength) {
                    seen.add(sectionFp);
                }

                // Register the content fingerprint so standalone duplicates
                // of the same content are still caught
                const contentFp = normalize(nextTrimmed);
                if (contentFp.length >= minLength) {
                    seen.add(contentFp);
                }

                kept.push(blocks[i], blocks[nextIdx]);
                i = nextIdx + 1;
                continue;
            }

            // Standalone heading (next block is another heading or end) — always keep
            kept.push(blocks[i]);
            i++;
            continue;
        }

        // Non-heading block — deduplicate individually
        const fingerprint = normalize(trimmed);

        if (fingerprint.length < minLength) {
            kept.push(blocks[i]);
            i++;
            continue;
        }

        if (seen.has(fingerprint)) {
            i++;
            continue;
        }

        seen.add(fingerprint);
        kept.push(blocks[i]);
        i++;
    }

    return kept.join('\n\n').trim() + '\n';
}
