'use client';

import { useCallback, useMemo, useState } from 'react';
import { InputTabs } from './input-tabs';
import type { InputMode } from './input-tabs';
import { UrlInput } from './url-input';
import { HtmlInput } from './html-input';
import { MarkdownOutput } from './markdown-output';
import { StatsPanel } from './stats-panel';
import { OptionsPanel } from './options-panel';
import { useConverter } from '@/hooks/use-converter';
import type { ConverterOptions } from '@/hooks/use-converter';
import { estimateTokens } from 'markdown-for-agents/tokens';

const SAMPLE_URL = 'https://docs.github.com/en/copilot/get-started/quickstart';

export function Playground() {
    const [inputMode, setInputMode] = useState<InputMode>('url');
    const [htmlValue, setHtmlValue] = useState('');
    const [options, setOptions] = useState<ConverterOptions>({ extract: true, deduplicate: false });

    const { result } = useConverter(htmlValue, options);

    const originalHtmlSize = useMemo(() => new TextEncoder().encode(htmlValue).byteLength, [htmlValue]);
    const htmlTokenEstimate = useMemo(() => (htmlValue ? estimateTokens(htmlValue) : null), [htmlValue]);

    const handleUrlFetched = useCallback((html: string) => {
        setHtmlValue(html);
    }, []);

    return (
        <div className="flex flex-col gap-6">
            {/* Controls bar */}
            <div className="flex flex-wrap items-center gap-4">
                <InputTabs mode={inputMode} onChange={setInputMode} />
                <OptionsPanel options={options} onChange={setOptions} />
            </div>

            {/* Input / Output columns */}
            <div className="grid h-[clamp(400px,60vh,800px)] gap-4 lg:grid-cols-2">
                <div className="flex min-h-0 flex-col">
                    {inputMode === 'url' ? (
                        <div className="flex min-h-0 flex-1 flex-col gap-4">
                            <UrlInput initialUrl={SAMPLE_URL} autoFetch onHtmlFetched={handleUrlFetched} />
                            {htmlValue && (
                                <div className="relative min-h-0 flex-1">
                                    <div className="absolute top-2 left-3 z-10 text-xs font-medium text-gray-400 dark:text-gray-500">
                                        Fetched HTML
                                    </div>
                                    <pre className="markdown-output h-full overflow-auto rounded-lg border border-gray-300 bg-white pt-7 pr-4 pb-4 pl-4 font-mono text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                        {htmlValue}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <HtmlInput value={htmlValue} onChange={setHtmlValue} />
                    )}
                </div>
                <div className="min-h-0">
                    <MarkdownOutput markdown={result?.markdown ?? null} />
                </div>
            </div>

            {/* Stats */}
            <StatsPanel result={result} originalHtmlSize={originalHtmlSize} htmlTokenEstimate={htmlTokenEstimate} />
        </div>
    );
}
