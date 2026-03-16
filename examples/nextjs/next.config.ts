import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['markdown-for-agents', '@markdown-for-agents/nextjs']
};

export default nextConfig;
