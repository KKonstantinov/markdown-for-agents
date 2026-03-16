'use client';

interface HtmlInputProps {
    value: string;
    onChange: (value: string) => void;
}

const PLACEHOLDER = `<article>
  <h1>Hello World</h1>
  <p>Paste your <strong>HTML</strong> here and see it converted to Markdown instantly.</p>
  <ul>
    <li>Supports headings, lists, tables, code blocks</li>
    <li>Toggle content extraction and deduplication</li>
    <li>See token savings in real time</li>
  </ul>
</article>`;

export function HtmlInput({ value, onChange }: HtmlInputProps) {
    return (
        <textarea
            value={value}
            onChange={e => {
                onChange(e.target.value);
            }}
            placeholder={PLACEHOLDER}
            spellCheck={false}
            className="h-full w-full resize-none rounded-lg border border-gray-300 bg-white p-4 font-mono text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:placeholder-gray-500"
        />
    );
}
