import { writeFile } from 'node:fs/promises';
import { audit } from './index.js';

const HELP = `Usage: agent-markdown-audit <url> [options]

Fetch a URL and compare HTML vs Markdown token counts.

Options:
  --no-extract    Skip content extraction
  --json          Output as JSON
  --output <file> Save the converted Markdown to a file
  -h, --help      Show this help message

Examples:
  agent-markdown-audit https://example.com
  agent-markdown-audit https://example.com/article --json
  agent-markdown-audit https://example.com --output article.md`;

/**
 * Formats a number with locale-aware thousands separators.
 *
 * @param n - The number to format.
 * @returns A formatted string (e.g. `"1,234"`).
 */
function formatNumber(n: number): string {
    return n.toLocaleString('en-US');
}

/**
 * Formats a byte count as a human-readable string.
 *
 * @param n - The byte count.
 * @returns A formatted string (e.g. `"1.5 KB"`).
 */
function formatBytes(n: number): string {
    if (n < 1024) return `${String(n)} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formats a percentage as a reduction or increase string.
 *
 * @param n - The percentage value (positive = savings, negative = increase).
 * @returns A formatted string (e.g. `"-12.3%"` for savings or `"+5.1%"` for increase).
 */
function formatPercent(n: number): string {
    if (n >= 0) return `-${n.toFixed(1)}%`;
    return `+${Math.abs(n).toFixed(1)}%`;
}

/** CLI entry point — parses arguments, runs the audit, and prints results. */
async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(HELP);
        process.exitCode = args.includes('--help') || args.includes('-h') ? 0 : 1;
        return;
    }

    const url = args.find(a => !a.startsWith('-'));
    if (!url) {
        console.error('Error: URL is required');
        process.exitCode = 1;
        return;
    }

    const noExtract = args.includes('--no-extract');
    const jsonOutput = args.includes('--json');
    const outputIndex = args.indexOf('--output');
    const outputFile = outputIndex === -1 ? undefined : args[outputIndex + 1];

    const result = await audit(url, {
        extract: !noExtract
    });

    if (outputFile) {
        await writeFile(outputFile, result.markdown.content, 'utf8');
        console.log(`Markdown saved to ${outputFile}`);
    }

    if (jsonOutput) {
        console.log(
            JSON.stringify(
                {
                    url: result.url,
                    html: result.html,
                    markdown: {
                        bytes: result.markdown.bytes,
                        tokens: result.markdown.tokens
                    },
                    reduction: result.reduction
                },
                null,
                2
            )
        );
        return;
    }

    const col1 = 11;
    const col2 = 16;
    const col3 = 16;

    console.log(`\nAudit: ${result.url}\n`);
    console.log(`${''.padEnd(col1)}${'HTML'.padEnd(col2)}${'Markdown'.padEnd(col3)}Savings`);
    console.log('─'.repeat(col1 + col2 + col3 + 8));
    console.log(
        `${'Tokens'.padEnd(col1)}${formatNumber(result.html.tokens.tokens).padEnd(col2)}${formatNumber(result.markdown.tokens.tokens).padEnd(col3)}${formatPercent(result.reduction.tokenPercent)}`
    );
    console.log(
        `${'Chars'.padEnd(col1)}${formatNumber(result.html.tokens.characters).padEnd(col2)}${formatNumber(result.markdown.tokens.characters).padEnd(col3)}${formatPercent(result.reduction.tokenPercent)}`
    );
    console.log(
        `${'Words'.padEnd(col1)}${formatNumber(result.html.tokens.words).padEnd(col2)}${formatNumber(result.markdown.tokens.words).padEnd(col3)}`
    );
    console.log(
        `${'Size'.padEnd(col1)}${formatBytes(result.html.bytes).padEnd(col2)}${formatBytes(result.markdown.bytes).padEnd(col3)}${formatPercent(result.reduction.bytePercent)}`
    );
    console.log();
}

try {
    await main();
} catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
}
