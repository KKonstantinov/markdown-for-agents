import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={source.getPageTree()}
            nav={{
                title: 'markdown-for-agents',
                url: '/docs'
            }}
            links={[
                { text: 'Playground', url: '/playground' },
                { text: 'GitHub', url: 'https://github.com/KKonstantinov/markdown-for-agents', external: true }
            ]}
        >
            {children}
        </DocsLayout>
    );
}
