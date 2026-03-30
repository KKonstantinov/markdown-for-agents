import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

export const docs = defineDocs({
    dir: 'content/docs'
});

export default defineConfig({
    mdxOptions: {
        remarkPlugins: [remarkMdxMermaid]
    }
});
