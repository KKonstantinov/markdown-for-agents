import './globals.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const ogImage = '/og-image.png';
const siteUrl = 'https://markdown-for-agents.vercel.app/';
const title = 'markdown-for-agents';
const description = 'Runtime-agnostic HTML to Markdown converter built for AI agents. One dependency, works everywhere.';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: title,
        template: `%s | ${title}`
    },
    description,
    openGraph: {
        type: 'website',
        title,
        description,
        url: siteUrl,
        images: [{ url: ogImage }]
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage]
    },
    icons: { icon: '/favicon.svg' }
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="flex min-h-screen flex-col">
                <RootProvider>{children}</RootProvider>
            </body>
        </html>
    );
}
