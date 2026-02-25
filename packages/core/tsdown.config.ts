import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        'extract/index': 'src/extract/index.ts',
        'tokens/index': 'src/tokens/index.ts'
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2022',
    clean: true,
    outDir: 'dist',
    external: ['htmlparser2', 'domhandler']
});
