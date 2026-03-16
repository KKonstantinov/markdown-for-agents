'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UrlInputProps {
    initialUrl?: string;
    autoFetch?: boolean;
    onHtmlFetched: (html: string) => void;
}

export function UrlInput({ initialUrl = '', autoFetch = false, onHtmlFetched }: Readonly<UrlInputProps>) {
    const [url, setUrl] = useState(initialUrl);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const didAutoFetch = useRef(false);
    const onHtmlFetchedRef = useRef(onHtmlFetched);
    onHtmlFetchedRef.current = onHtmlFetched;

    const fetchUrl = useCallback((targetUrl: string) => {
        setIsLoading(true);
        setError(null);

        fetch(`/api/fetch?url=${encodeURIComponent(targetUrl)}`)
            .then(async response => {
                const data = (await response.json()) as { html?: string; error?: string };

                if (!response.ok) {
                    setError(data.error ?? `Request failed (${String(response.status)})`);
                    return;
                }

                if (data.html) {
                    onHtmlFetchedRef.current(data.html);
                }
            })
            .catch(() => {
                setError('Failed to fetch URL. Check your connection and try again.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (autoFetch && initialUrl && !didAutoFetch.current) {
            didAutoFetch.current = true;
            fetchUrl(initialUrl);
        }
    }, [autoFetch, initialUrl, fetchUrl]);

    function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        if (!url.trim() || isLoading) return;
        fetchUrl(url.trim());
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex gap-2">
                <input
                    type="url"
                    value={url}
                    onChange={e => {
                        setUrl(e.target.value);
                    }}
                    placeholder="https://example.com"
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:placeholder-gray-500"
                />
                <button
                    type="submit"
                    disabled={!url.trim() || isLoading}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Fetching
                        </span>
                    ) : (
                        'Convert'
                    )}
                </button>
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
    );
}
