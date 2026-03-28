import { useCallback, useEffect, useRef, useState } from 'react';
import { convert } from 'markdown-for-agents';
import type { ConvertResult } from 'markdown-for-agents';

export interface ConverterOptions {
    extract: boolean;
    deduplicate: boolean;
}

export interface ConverterState {
    result: ConvertResult | null;
    isConverting: boolean;
    durationMs: number | null;
}

export function useConverter(html: string, options: ConverterOptions): ConverterState {
    const [state, setState] = useState<ConverterState>({ result: null, isConverting: false, durationMs: null });
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    const runConversion = useCallback(
        (input: string) => {
            if (!input.trim()) {
                setState({ result: null, isConverting: false, durationMs: null });
                return;
            }

            try {
                const start = performance.now();
                const result = convert(input, {
                    extract: options.extract,
                    deduplicate: options.deduplicate
                });
                const durationMs = performance.now() - start;
                setState({ result, isConverting: false, durationMs });
            } catch {
                setState({ result: null, isConverting: false, durationMs: null });
            }
        },
        [options.extract, options.deduplicate]
    );

    useEffect(() => {
        if (!html.trim()) {
            setState({ result: null, isConverting: false, durationMs: null });
            return;
        }

        setState(prev => ({ ...prev, isConverting: true }));

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            runConversion(html);
        }, 300);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [html, runConversion]);

    return state;
}
