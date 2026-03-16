'use client';

export type InputMode = 'url' | 'html';

interface InputTabsProps {
    mode: InputMode;
    onChange: (mode: InputMode) => void;
}

export function InputTabs({ mode, onChange }: Readonly<InputTabsProps>) {
    return (
        <div className="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <button
                type="button"
                onClick={() => {
                    onChange('url');
                }}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    mode === 'url'
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
                URL
            </button>
            <button
                type="button"
                onClick={() => {
                    onChange('html');
                }}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    mode === 'html'
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
                HTML
            </button>
        </div>
    );
}
