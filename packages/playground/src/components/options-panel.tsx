'use client';

import type { ConverterOptions } from '@/hooks/use-converter';

interface OptionsPanelProps {
    options: ConverterOptions;
    onChange: (options: ConverterOptions) => void;
}

function Tooltip({ text }: Readonly<{ text: string }>) {
    return (
        <span className="group relative">
            <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-gray-300 text-[10px] font-medium text-gray-400 dark:border-gray-600 dark:text-gray-500">
                ?
            </span>
            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs leading-relaxed text-gray-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-700">
                {text}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
            </span>
        </span>
    );
}

function Toggle({
    label,
    tooltip,
    checked,
    onChange
}: Readonly<{
    label: string;
    tooltip: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}>) {
    return (
        <label className="flex cursor-pointer items-center gap-2">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => {
                    onChange(!checked);
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
                <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                        checked ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                />
            </button>
            <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                {label}
                <Tooltip text={tooltip} />
            </span>
        </label>
    );
}

export function OptionsPanel({ options, onChange }: Readonly<OptionsPanelProps>) {
    return (
        <div className="flex gap-6">
            <Toggle
                label="Extract content"
                tooltip="Strips navigation, footers, sidebars, and ads from the HTML, keeping only the main content. Best for full web pages."
                checked={options.extract}
                onChange={extract => {
                    onChange({ ...options, extract });
                }}
            />
            <Toggle
                label="Deduplicate"
                tooltip="Removes repeated content blocks (e.g. headers/footers that appear multiple times). Useful for pages with duplicated sections."
                checked={options.deduplicate}
                onChange={deduplicate => {
                    onChange({ ...options, deduplicate });
                }}
            />
        </div>
    );
}
