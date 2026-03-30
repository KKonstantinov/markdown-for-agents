import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['markdown-for-agents', '@markdown-for-agents/nextjs'],
    images: {
        remotePatterns: [{ hostname: 'img.shields.io' }, { hostname: 'raw.githubusercontent.com' }],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
    }
};

const withMDX = createMDX();

export default withMDX(nextConfig);
