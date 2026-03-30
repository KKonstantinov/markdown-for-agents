import type { MetadataRoute } from 'next';
import { execSync } from 'node:child_process';
import { source } from '@/lib/source';

const baseUrl = 'https://markdown-for-agents.vercel.app';

function getGitLastModified(filePath: string): Date {
    try {
        const timestamp = execSync(`git log -1 --format=%cI -- "${filePath}"`, { encoding: 'utf8' }).trim();
        if (timestamp) return new Date(timestamp);
    } catch {
        // fall through
    }
    return new Date();
}

export default function sitemap(): MetadataRoute.Sitemap {
    const docs = source.getPages().map(page => ({
        url: `${baseUrl}${page.url}`,
        lastModified: getGitLastModified(`packages/site/content/${page.path}`)
    }));

    return [
        { url: baseUrl, lastModified: getGitLastModified('packages/site/src/app/page.tsx') },
        { url: `${baseUrl}/playground`, lastModified: getGitLastModified('packages/site/src/app/playground/page.tsx') },
        ...docs
    ];
}
