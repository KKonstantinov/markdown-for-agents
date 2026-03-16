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
}

export function useConverter(html: string, options: ConverterOptions): ConverterState {
    const [state, setState] = useState<ConverterState>({ result: null, isConverting: false });
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    const runConversion = useCallback(
        (input: string) => {
            if (!input.trim()) {
                setState({ result: null, isConverting: false });
                return;
            }

            try {
                const result = convert(input, {
                    extract: options.extract,
                    deduplicate: options.deduplicate
                });
                setState({ result, isConverting: false });
            } catch {
                setState({ result: null, isConverting: false });
            }
        },
        [options.extract, options.deduplicate]
    );

    useEffect(() => {
        if (!html.trim()) {
            setState({ result: null, isConverting: false });
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
