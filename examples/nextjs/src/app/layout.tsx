import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Example — markdown-for-agents',
    description: 'Next.js example app for markdown-for-agents'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
