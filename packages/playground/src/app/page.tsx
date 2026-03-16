import { Playground } from '@/components/playground';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Page() {
    return (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <header className="mb-8 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <a
                            href="https://kkonstantinov.github.io/markdown-for-agents/"
                            className="text-2xl font-bold tracking-tight hover:underline sm:text-3xl"
                        >
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
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Interactive playground for the markdown-for-agents library — an HTML to Markdown converter for AI agents.
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Paste a URL or HTML to see how it strips away navigation, ads, and boilerplate to produce clean Markdown with 90+%
                        fewer tokens. One dependency, runs everywhere, with custom rules, server middleware, and more.
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                        <a
                            href="https://kkonstantinov.github.io/markdown-for-agents/"
                            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            Documentation
                        </a>
                        <a
                            href="https://kkonstantinov.github.io/markdown-for-agents/getting-started"
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
