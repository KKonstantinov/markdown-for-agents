import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
    title: 'Playground — markdown-for-agents',
    description: 'Try the markdown-for-agents HTML-to-Markdown converter live in your browser.'
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body className="bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
                {children}
                <Analytics />
            </body>
        </html>
    );
}
