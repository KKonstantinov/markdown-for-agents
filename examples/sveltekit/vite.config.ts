import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [sveltekit()],
    test: {
        include: ['test/**/*.test.ts'],
        globalSetup: ['test/integration/setup.ts'],
        testTimeout: 60_000
    }
});
