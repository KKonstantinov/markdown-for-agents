import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'markdown-for-agents',
    description: 'Runtime-agnostic HTML to Markdown converter built for AI agents. One dependency, works everywhere.',

    base: '/markdown-for-agents/',

    themeConfig: {
        nav: [
            { text: 'Guide', link: '/getting-started' },
            { text: 'API', link: '/api' },
            {
                text: 'npm',
                link: 'https://www.npmjs.com/package/markdown-for-agents'
            },
            {
                text: 'GitHub',
                link: 'https://github.com/KKonstantinov/markdown-for-agents'
            }
        ],

        sidebar: [
            {
                text: 'Guide',
                items: [
                    { text: 'Getting Started', link: '/getting-started' },
                    {
                        text: 'Content Extraction',
                        link: '/extraction'
                    },
                    { text: 'Middleware', link: '/middleware' },
                    { text: 'Custom Rules', link: '/rules' }
                ]
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

        search: {
            provider: 'local'
        },

        socialLinks: [
            {
                icon: 'github',
                link: 'https://github.com/KKonstantinov/markdown-for-agents'
            }
        ]
    }
});
