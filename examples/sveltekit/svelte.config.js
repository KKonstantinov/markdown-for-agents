import adapter from '@sveltejs/adapter-node';

const config = {
    kit: {
        adapter: adapter(),
        alias: {
            '@markdown-for-agents/sveltekit': '../../packages/middleware/sveltekit/src/index.ts',
            '@markdown-for-agents/web': '../../packages/middleware/web/src/index.ts',
            'markdown-for-agents': '../../packages/core/src/index.ts'
        }
    }
};

export default config;
