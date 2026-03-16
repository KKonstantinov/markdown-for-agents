import { useEffect, useRef, useState } from 'react';
import type { HighlighterGeneric } from 'shiki/bundle/web';

let highlighterPromise: Promise<HighlighterGeneric<never, never>> | null = null;

function getHighlighter(): Promise<HighlighterGeneric<never, never>> {
    if (!highlighterPromise) {
        highlighterPromise = import('shiki/bundle/web').then(({ createHighlighter }) =>
            createHighlighter({
                themes: ['github-light', 'github-dark'],
                langs: ['markdown']
            })
        );
    }
    return highlighterPromise;
}

export function useHighlighter(code: string | null): string | null {
    const [html, setHtml] = useState<string | null>(null);
    const latestCode = useRef(code);
    latestCode.current = code;

    useEffect(() => {
        if (!code) {
            setHtml(null);
            return;
        }

        const currentCode = code;

        void getHighlighter().then(highlighter => {
            if (latestCode.current !== currentCode) return;

            const result = highlighter.codeToHtml(currentCode, {
                lang: 'markdown',
                themes: { light: 'github-light', dark: 'github-dark' },
                defaultColor: 'light'
            });
            setHtml(result);
        });
    }, [code]);

    return html;
}
