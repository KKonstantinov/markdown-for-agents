import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        cli: 'src/cli.ts'
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2022',
    clean: true,
    outDir: 'dist',
    external: ['markdown-for-agents']
});
