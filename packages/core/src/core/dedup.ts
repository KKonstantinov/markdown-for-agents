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

function findNextNonEmptyIndex(blocks: string[], start: number): number {
    let idx = start;
    while (idx < blocks.length && !blocks[idx].trim()) {
        idx++;
    }
    return idx;
}

function isDuplicate(seen: Set<string>, fingerprint: string, minLength: number): boolean {
    return fingerprint.length >= minLength && seen.has(fingerprint);
}

function registerFingerprint(seen: Set<string>, fingerprint: string, minLength: number): void {
    if (fingerprint.length >= minLength) {
        seen.add(fingerprint);
    }
}

/** Process a heading block with its following content as a section. */
function processHeadingBlock(blocks: string[], i: number, seen: Set<string>, minLength: number, kept: string[]): number {
    const trimmed = blocks[i].trim();
    const nextIdx = findNextNonEmptyIndex(blocks, i + 1);
    const nextTrimmed = nextIdx < blocks.length ? blocks[nextIdx].trim() : '';
    const hasContent = nextTrimmed !== '' && !HEADING_RE.test(nextTrimmed);

    if (!hasContent) {
        // Standalone heading (next block is another heading or end) — always keep
        kept.push(blocks[i]);
        return i + 1;
    }

    // Section: heading + content → compound fingerprint
    const sectionFp = normalize(trimmed + ' ' + nextTrimmed);

    if (isDuplicate(seen, sectionFp, minLength)) {
        return nextIdx + 1;
    }

    registerFingerprint(seen, sectionFp, minLength);
    // Register the content fingerprint so standalone duplicates
    // of the same content are still caught
    registerFingerprint(seen, normalize(nextTrimmed), minLength);
    kept.push(blocks[i], blocks[nextIdx]);
    return nextIdx + 1;
}

/** Deduplicate a non-heading content block individually. */
function processContentBlock(block: string, trimmed: string, seen: Set<string>, minLength: number, kept: string[]): void {
    const fingerprint = normalize(trimmed);

    if (isDuplicate(seen, fingerprint, minLength)) {
        return;
    }

    registerFingerprint(seen, fingerprint, minLength);
    kept.push(block);
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
            i = processHeadingBlock(blocks, i, seen, minLength, kept);
            continue;
        }

        processContentBlock(blocks[i], trimmed, seen, minLength, kept);
        i++;
    }

    return kept.join('\n\n').trim() + '\n';
}
