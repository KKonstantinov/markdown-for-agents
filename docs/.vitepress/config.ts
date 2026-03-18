import { defineConfig } from 'vitepress';

const ogImage = 'https://kkonstantinov.github.io/markdown-for-agents/og-image.png';
const siteUrl = 'https://kkonstantinov.github.io/markdown-for-agents/';
const title = 'markdown-for-agents';
const description = 'Runtime-agnostic HTML to Markdown converter built for AI agents. One dependency, works everywhere.';

export default defineConfig({
    title,
    description,

    base: '/markdown-for-agents/',
    cleanUrls: true,
    lastUpdated: true,

    head: [
        ['link', { rel: 'icon', type: 'image/svg+xml', href: '/markdown-for-agents/favicon.svg' }],

        // Open Graph
        ['meta', { property: 'og:type', content: 'website' }],
        ['meta', { property: 'og:title', content: title }],
        ['meta', { property: 'og:description', content: description }],
        ['meta', { property: 'og:url', content: siteUrl }],
        ['meta', { property: 'og:image', content: ogImage }],

        // Twitter Card
        ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
        ['meta', { name: 'twitter:title', content: title }],
        ['meta', { name: 'twitter:description', content: description }],
        ['meta', { name: 'twitter:image', content: ogImage }]
    ],

    themeConfig: {
        logo: '/favicon.svg',

        nav: [
            { text: 'Guide', link: '/getting-started' },
            { text: 'API', link: '/api' },
            { text: 'Python', link: '/packages/python' },
            { text: 'Playground', link: 'https://markdown-for-agents-playground.vercel.app', target: '_blank' },
            {
                text: 'Packages',
                items: [
                    { text: 'Core (markdown-for-agents)', link: '/packages/core' },
                    { text: 'Audit (@markdown-for-agents/audit)', link: '/packages/audit' },
                    { text: 'Express (@markdown-for-agents/express)', link: '/packages/express' },
                    { text: 'Fastify (@markdown-for-agents/fastify)', link: '/packages/fastify' },
                    { text: 'Hono (@markdown-for-agents/hono)', link: '/packages/hono' },
                    { text: 'Next.js (@markdown-for-agents/nextjs)', link: '/packages/nextjs' },
                    { text: 'Web Standard (@markdown-for-agents/web)', link: '/packages/web' }
                ]
            }
        ],

        sidebar: [
            {
                text: 'Guide',
                items: [
                    { text: 'Getting Started', link: '/getting-started' },
                    { text: 'Content Extraction', link: '/extraction' },
                    { text: 'Middleware', link: '/middleware' },
                    { text: 'Custom Rules', link: '/rules' }
                ]
            },
            {
                text: 'Python',
                items: [{ text: 'Python Package', link: '/packages/python' }]
            },
            {
                text: 'Packages',
                items: [
                    { text: 'Core', link: '/packages/core' },
                    { text: 'Audit', link: '/packages/audit' },
                    { text: 'Express', link: '/packages/express' },
                    { text: 'Fastify', link: '/packages/fastify' },
                    { text: 'Hono', link: '/packages/hono' },
                    { text: 'Next.js', link: '/packages/nextjs' },
                    { text: 'Web Standard', link: '/packages/web' }
                ]
            },
            {
                text: 'Reference',
                items: [
                    { text: 'API Reference', link: '/api' },
                    { text: 'Architecture', link: '/architecture' }
                ]
            }
        ],

        outline: [2, 3],

        editLink: {
            pattern: 'https://github.com/KKonstantinov/markdown-for-agents/edit/main/docs/:path'
        },

        footer: {
            message: 'Released under the <a href="https://github.com/KKonstantinov/markdown-for-agents/blob/main/LICENSE">MIT License</a>.',
            copyright: 'Copyright &copy; 2025-present'
        },

        search: {
            provider: 'local'
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/KKonstantinov/markdown-for-agents' },
            { icon: 'npm', link: 'https://www.npmjs.com/package/markdown-for-agents' }
        ]
    }
});
