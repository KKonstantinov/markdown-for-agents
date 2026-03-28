'use client';

import type { ConvertResult, TokenEstimate } from 'markdown-for-agents';

interface StatsPanelProps {
    result: ConvertResult | null;
    originalHtmlSize: number;
    htmlTokenEstimate: TokenEstimate | null;
    durationMs: number | null;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${String(bytes)} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatNumber(n: number): string {
    return n.toLocaleString();
}

function ReductionCard({ label, before, after }: Readonly<{ label: string; before: string; after: string }>) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">{label}</p>
            <div className="mt-1 flex items-baseline gap-2">
                <span className="text-sm text-red-400/80 line-through dark:text-red-400/70">{before}</span>
                <span className="text-gray-400 dark:text-gray-500">&rarr;</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{after}</span>
            </div>
        </div>
    );
}

function StatCard({ label, value, accent }: Readonly<{ label: string; value: string; accent?: boolean }>) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">{label}</p>
            <p
                className={`mt-1 text-lg font-semibold ${accent ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}
            >
                {value}
            </p>
        </div>
    );
}

function formatDuration(ms: number): string {
    if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
    if (ms < 1000) return `${ms.toFixed(1)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
}

export function StatsPanel({ result, originalHtmlSize, htmlTokenEstimate, durationMs }: Readonly<StatsPanelProps>) {
    if (!result) {
        return (
            <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
                Stats will appear here after conversion.
            </div>
        );
    }

    const markdownSize = new TextEncoder().encode(result.markdown).byteLength;
    const savings = originalHtmlSize > 0 ? ((1 - markdownSize / originalHtmlSize) * 100).toFixed(1) : '0.0';

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <ReductionCard
                label="Tokens"
                before={htmlTokenEstimate ? formatNumber(htmlTokenEstimate.tokens) : '—'}
                after={formatNumber(result.tokenEstimate.tokens)}
            />
            <ReductionCard
                label="Characters"
                before={htmlTokenEstimate ? formatNumber(htmlTokenEstimate.characters) : '—'}
                after={formatNumber(result.tokenEstimate.characters)}
            />
            <ReductionCard
                label="Words"
                before={htmlTokenEstimate ? formatNumber(htmlTokenEstimate.words) : '—'}
                after={formatNumber(result.tokenEstimate.words)}
            />
            <ReductionCard label="Size" before={formatBytes(originalHtmlSize)} after={formatBytes(markdownSize)} />
            <StatCard label="Savings" value={`${savings}%`} accent={Number(savings) > 0} />
            <StatCard label="Conversion time" value={durationMs == null ? '—' : formatDuration(durationMs)} />
        </div>
    );
}
