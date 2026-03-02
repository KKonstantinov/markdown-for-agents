/**
 * Normalizes raw markdown output into clean, well-formatted text.
 *
 * Performs the following transformations:
 * - Normalizes line endings to `\n`
 * - Collapses whitespace-only lines into empty lines
 * - Collapses 3+ consecutive newlines into exactly 2
 * - Trims trailing whitespace from each line (preserving intentional `  ` line breaks)
 * - Ensures the output ends with a single newline
 *
 * @param raw - The raw markdown string produced by the walker.
 * @returns The cleaned and normalized markdown string.
 * @internal
 */
export function render(raw: string): string {
    return (
        raw
            .replaceAll(/\r\n?/g, '\n')
            // Collapse whitespace-only lines into empty lines
            .replaceAll(/\n[ \t]+\n/g, '\n\n')
            // Collapse 3+ consecutive newlines into 2
            .replaceAll(/\n{3,}/g, '\n\n')
            .split('\n')
            .map(line => {
                if (/\S {2}$/.test(line)) {
                    return line.replace(/\s+$/, '') + '  ';
                }
                return line.trimEnd();
            })
            .join('\n')
            .trim() + '\n'
    );
}
