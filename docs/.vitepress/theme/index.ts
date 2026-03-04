/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-confusing-void-expression */
import { h, nextTick, watch } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import { createMermaidRenderer } from 'vitepress-mermaid-renderer';
import './style.css';

export default {
    extends: DefaultTheme,
    Layout: () => {
        const { isDark } = useData();

        const initMermaid = () => {
            createMermaidRenderer({
                theme: isDark.value ? 'dark' : 'forest'
            });
        };

        nextTick(() => initMermaid());

        watch(
            () => isDark.value,
            () => {
                initMermaid();
            }
        );

        return h(DefaultTheme.Layout);
    }
} satisfies Theme;
