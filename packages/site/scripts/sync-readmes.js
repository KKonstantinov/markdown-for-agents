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

// Badge pattern: [![alt](shield-url)](link-url)
const badgeRe = /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g;

// Header image pattern: ![alt](url) where url contains a header image
const headerImageRe = /^!\[([^\]]*)\]\((https:\/\/raw\.githubusercontent\.com\/[^)]*header[^)]*)\)$/;

function badgeLinesToFlex(badgeLines) {
    const badges = [];
    for (const line of badgeLines) {
        for (const match of line.matchAll(badgeRe)) {
            badges.push({ alt: match[1], img: match[2], href: match[3] });
        }
    }
    if (badges.length === 0) return badgeLines.join('\n');

    const links = badges.map(b => `  <a href="${b.href}"><img src="${b.img}" alt="${b.alt}" /></a>`);
    return `<div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>\n${links.join('\n')}\n</div>`;
}

function transformContent(content) {
    const lines = content.split('\n');
    const badgeLineIndices = [];
    let headerImageIndex = -1;
    let headerImageLine = '';

    for (let i = 0; i < lines.length; i++) {
        if (badgeRe.test(lines[i]) && lines[i].includes('shields.io')) {
            badgeLineIndices.push(i);
            badgeRe.lastIndex = 0;
        }
        const imgMatch = lines[i].match(headerImageRe);
        if (imgMatch && headerImageIndex === -1) {
            headerImageIndex = i;
            headerImageLine = lines[i];
        }
    }

    if (badgeLineIndices.length === 0) return content;

    const badgeLines = badgeLineIndices.map(i => lines[i]);
    const flexHtml = badgeLinesToFlex(badgeLines);

    // Build new lines array, removing old badge lines and header image,
    // then inserting image + badges after the H1 heading
    const removeSet = new Set(badgeLineIndices);
    if (headerImageIndex !== -1) removeSet.add(headerImageIndex);

    const result = [];
    let inserted = false;

    for (let i = 0; i < lines.length; i++) {
        if (removeSet.has(i)) continue;

        result.push(lines[i]);

        // Insert image + badges right after the H1 heading line
        if (!inserted && lines[i].startsWith('# ')) {
            result.push('');
            if (headerImageLine) {
                result.push(headerImageLine);
                result.push('');
            }
            result.push(flexHtml);
            inserted = true;
        }
    }

    // Collapse runs of 3+ blank lines down to 2
    const cleaned = [];
    let blanks = 0;
    for (const line of result) {
        if (line.trim() === '') {
            blanks++;
            if (blanks <= 2) cleaned.push(line);
        } else {
            blanks = 0;
            cleaned.push(line);
        }
    }

    return cleaned.join('\n');
}

mkdirSync(outDir, { recursive: true });

for (const { source, target, title, description } of mappings) {
    const content = readFileSync(resolve(root, source), 'utf8');
    const transformed = transformContent(content);
    const frontmatter = `---\ntitle: "${title}"\ndescription: "${description}"\n---\n\n`;
    writeFileSync(resolve(outDir, target), frontmatter + transformed);
}

console.log(`Synced ${mappings.length} README files to ${outDir}`);
