'use client';

import { useCallback, useState } from 'react';
import { useHighlighter } from '@/hooks/use-highlighter';

interface MarkdownOutputProps {
    markdown: string | null;
}

export function MarkdownOutput({ markdown }: MarkdownOutputProps) {
    const [copied, setCopied] = useState(false);
    const highlightedHtml = useHighlighter(markdown);

    const handleCopy = useCallback(() => {
        if (!markdown) return;
        void navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }, [markdown]);

    return (
        <div className="relative flex h-full flex-col rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">Markdown Output</span>
                {markdown && (
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                )}
            </div>
            <div className="markdown-output flex-1 overflow-auto">
                {markdown ? (
                    highlightedHtml ? (
                        <div
                            className="shiki-wrapper h-full text-sm [&_pre]:h-full [&_pre]:overflow-auto [&_pre]:bg-transparent! [&_pre]:p-4 [&_pre]:font-mono [&_code]:break-words [&_code]:whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                        />
                    ) : (
                        <pre className="p-4 font-mono text-sm whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                            {markdown}
                        </pre>
                    )
                ) : (
                    <p className="p-4 text-sm text-gray-400 italic dark:text-gray-500">
                        Enter HTML or a URL to see the converted Markdown here.
                    </p>
                )}
            </div>
        </div>
    );
}
