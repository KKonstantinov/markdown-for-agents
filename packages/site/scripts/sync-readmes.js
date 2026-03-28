import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');
const outDir = resolve(__dirname, '../content/docs/packages');

const mappings = [
    {
        source: 'packages/core/README.md',
        target: 'core.mdx',
        title: 'Core (markdown-for-agents)',
        description: 'Runtime-agnostic HTML to Markdown converter built for AI agents. One dependency, works everywhere.'
    },
    {
        source: 'packages/audit/README.md',
        target: 'audit.mdx',
        title: 'Audit (@markdown-for-agents/audit)',
        description: 'CLI & library to audit token and byte savings when converting HTML to Markdown for AI agents.'
    },
    {
        source: 'packages/middleware/express/README.md',
        target: 'express.mdx',
        title: 'Express Middleware (@markdown-for-agents/express)',
        description: 'Express middleware to serve Markdown to AI agents via content negotiation.'
    },
    {
        source: 'packages/middleware/fastify/README.md',
        target: 'fastify.mdx',
        title: 'Fastify Plugin (@markdown-for-agents/fastify)',
        description: 'Fastify plugin to serve Markdown to AI agents via content negotiation.'
    },
    {
        source: 'packages/middleware/hono/README.md',
        target: 'hono.mdx',
        title: 'Hono Middleware (@markdown-for-agents/hono)',
        description: 'Hono middleware to serve Markdown to AI agents via content negotiation.'
    },
    {
        source: 'packages/middleware/nextjs/README.md',
        target: 'nextjs.mdx',
        title: 'Next.js Middleware (@markdown-for-agents/nextjs)',
        description: 'Next.js middleware to serve Markdown to AI agents via content negotiation.'
    },
    {
        source: 'packages/middleware/web/README.md',
        target: 'web.mdx',
        title: 'Web Standard Middleware (@markdown-for-agents/web)',
        description: 'Web Standard middleware to serve Markdown to AI agents from Cloudflare Workers, Deno, Bun, and Node.js.'
    },
    {
        source: 'python/README.md',
        target: 'python.mdx',
        title: 'Python (markdown-for-agents)',
        description: 'HTML-to-Markdown converter built for AI agents. Zero dependencies, pure Python.'
    }
];

mkdirSync(outDir, { recursive: true });

for (const { source, target, title, description } of mappings) {
    const content = readFileSync(resolve(root, source), 'utf8');
    const frontmatter = `---\ntitle: "${title}"\ndescription: "${description}"\n---\n\n`;
    writeFileSync(resolve(outDir, target), frontmatter + content);
}

console.log(`Synced ${mappings.length} README files to ${outDir}`);
