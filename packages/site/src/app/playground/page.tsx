'use client';

import { Playground } from '@/components/playground';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Page() {
    return (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <header className="mb-8 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <a href="/docs" className="text-2xl font-bold tracking-tight hover:underline sm:text-3xl">
                            markdown-for-agents
                        </a>
                        <a
                            href="https://github.com/KKonstantinov/markdown-for-agents"
                            aria-label="GitHub repository"
                            className="text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                            <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5">
                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                            </svg>
                        </a>
                        <a
                            href="https://www.npmjs.com/package/markdown-for-agents"
                            aria-label="npm package"
                            className="text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                            <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5">
                                <path d="M0 0v16h16V0H0zm13 13h-2V5H8v8H3V3h10v10z" />
                            </svg>
                        </a>
                        <a
                            href="https://pypi.org/project/markdown-for-agents/"
                            aria-label="PyPI package"
                            className="text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                            <svg viewBox="0 0 256 255" fill="currentColor" className="h-5 w-5">
                                <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072M92.802 19.66a11.12 11.12 0 1 1 0 22.24 11.12 11.12 0 0 1 0-22.24" />
                                <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897m34.114-19.586a11.12 11.12 0 1 1 0-22.24 11.12 11.12 0 0 1 0 22.24" />
                            </svg>
                        </a>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Interactive playground for the markdown-for-agents library - an HTML to Markdown converter for AI agents.
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Paste a URL or HTML to see how it strips away navigation, ads, and boilerplate to produce clean Markdown with 90+%
                        fewer tokens. One dependency, runs everywhere, with custom rules, server middleware, and more.
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                        <a
                            href="/docs"
                            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            Documentation
                        </a>
                        <a
                            href="/docs/getting-started"
                            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Get started
                        </a>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <Playground />
        </main>
    );
}
