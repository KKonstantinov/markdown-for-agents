import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@markdown-for-agents/web': new URL('../web/src/index.ts', import.meta.url).pathname,
            'markdown-for-agents': new URL('../../core/src/index.ts', import.meta.url).pathname
        }
    },
    test: {
        include: ['test/**/*.test.ts']
    }
});
