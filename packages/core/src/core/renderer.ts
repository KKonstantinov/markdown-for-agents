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
