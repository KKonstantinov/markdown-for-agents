import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Playground',
    description: 'Try the markdown-for-agents HTML-to-Markdown converter live in your browser.'
};

export default function PlaygroundLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
