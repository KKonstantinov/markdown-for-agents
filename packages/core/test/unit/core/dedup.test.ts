import { describe, it, expect } from 'vitest';
import { convert } from '../../../src/core/converter.js';
import { deduplicateBlocks } from '../../../src/core/dedup.js';

describe('deduplicateBlocks', () => {
    it('removes exact duplicate blocks', () => {
        const input = '## Article Title\n\nSome content here.\n\n## Article Title\n\nSome content here.\n';
        const result = deduplicateBlocks(input);
        expect(result).toBe('## Article Title\n\nSome content here.\n');
    });

    it('preserves unique blocks', () => {
        const input = '## First\n\nContent one.\n\n## Second\n\nContent two.\n';
        const result = deduplicateBlocks(input);
        expect(result).toBe('## First\n\nContent one.\n\n## Second\n\nContent two.\n');
    });

    it('is case-insensitive for content blocks', () => {
        const input = 'Some content block here.\n\nSOME CONTENT BLOCK HERE.\n';
        const result = deduplicateBlocks(input);
        expect(result).toBe('Some content block here.\n');
    });

    it('is case-insensitive for sections', () => {
        const input = '## Article Title\n\nSome content here.\n\n## ARTICLE TITLE\n\nSOME CONTENT HERE.\n';
        const result = deduplicateBlocks(input);
        expect(result).toBe('## Article Title\n\nSome content here.\n');
    });

    it('normalizes whitespace for comparison', () => {
        const input = 'Some  spaced   content here.\n\nSome spaced content here.\n';
        const result = deduplicateBlocks(input);
        expect(result).toBe('Some  spaced   content here.\n');
    });

    it('preserves short blocks even if duplicated', () => {
        const input = '---\n\nContent\n\n---\n';
        const result = deduplicateBlocks(input);
        expect(result).toBe('---\n\nContent\n\n---\n');
    });

    it('preserves first occurrence and removes subsequent ones', () => {
        const input = '## Featured\n\n## Article Title\n\nDescription text.\n\n## All Articles\n\n## Article Title\n\nDescription text.\n';
        const result = deduplicateBlocks(input);
        expect(result).toContain('## Featured');
        expect(result).toContain('## All Articles');
        // Title and description should appear only once
        const titleCount = result.split('## Article Title').length - 1;
        expect(titleCount).toBe(1);
        const descCount = result.split('Description text.').length - 1;
        expect(descCount).toBe(1);
    });

    it('preserves repeated headings with different content', () => {
        const input =
            '## Service A\n\n### The situation\n\nCompany needed help with marketing.\n\n' +
            '## Service B\n\n### The situation\n\nCompany needed help with technology.\n';
        const result = deduplicateBlocks(input);
        const count = result.split('### The situation').length - 1;
        expect(count).toBe(2);
        expect(result).toContain('marketing');
        expect(result).toContain('technology');
    });

    it('removes repeated headings with identical content', () => {
        const input =
            '## Service A\n\n### The situation\n\nSame description for both services.\n\n' +
            '## Service B\n\n### The situation\n\nSame description for both services.\n';
        const result = deduplicateBlocks(input);
        // Section heading + content combo is duplicated → second removed
        const count = result.split('### The situation').length - 1;
        expect(count).toBe(1);
        expect(result).toContain('## Service A');
        expect(result).toContain('## Service B');
    });

    it('always preserves standalone headings', () => {
        const input = '## Heading One\n\n## Heading One\n\nSome content here.\n';
        const result = deduplicateBlocks(input);
        // First is standalone (followed by another heading), second has content
        // Both should be preserved since they're in different contexts
        expect(result).toBe('## Heading One\n\n## Heading One\n\nSome content here.\n');
    });

    it('handles empty input', () => {
        expect(deduplicateBlocks('')).toBe('\n');
        expect(deduplicateBlocks('\n\n')).toBe('\n');
    });

    describe('custom minLength', () => {
        it('deduplicates short blocks when minLength is lowered', () => {
            // "Content" is 7 chars normalized — below default 10, so kept by default
            const input = 'Content\n\nContent\n';
            expect(deduplicateBlocks(input)).toBe('Content\n\nContent\n');
            expect(deduplicateBlocks(input, 5)).toBe('Content\n');
        });

        it('preserves longer blocks when minLength is raised', () => {
            // "some content here." is 18 chars normalized — above default 10
            const input = 'Some content here.\n\nSome content here.\n';
            expect(deduplicateBlocks(input)).toBe('Some content here.\n');
            expect(deduplicateBlocks(input, 50)).toBe('Some content here.\n\nSome content here.\n');
        });

        it('applies minLength to section fingerprints', () => {
            const input = '## Hi\n\nShort.\n\n## Hi\n\nShort.\n';
            // Section fingerprint "## hi short." is 12 chars — above default 10
            expect(deduplicateBlocks(input)).toBe('## Hi\n\nShort.\n');
            // With minLength 50, the section fingerprint is too short → both kept
            expect(deduplicateBlocks(input, 50)).toBe('## Hi\n\nShort.\n\n## Hi\n\nShort.\n');
        });
    });
});

describe('convert with deduplicate option', () => {
    it('does not deduplicate by default', () => {
        const html = '<p>Duplicate paragraph content here.</p><p>Unique</p><p>Duplicate paragraph content here.</p>';
        const { markdown } = convert(html);
        const count = markdown.split('Duplicate paragraph content here.').length - 1;
        expect(count).toBe(2);
    });

    it('removes duplicate blocks when deduplicate: true', () => {
        const html = '<p>Duplicate paragraph content here.</p><p>Unique</p><p>Duplicate paragraph content here.</p>';
        const { markdown } = convert(html, { deduplicate: true });
        const count = markdown.split('Duplicate paragraph content here.').length - 1;
        expect(count).toBe(1);
        expect(markdown).toContain('Unique');
    });

    it('deduplicates heading + content combos', () => {
        const html = `
      <section>
        <h2>Featured Article</h2>
        <p>This is the article description that is long enough to be deduplicated.</p>
      </section>
      <section>
        <h2>All Articles</h2>
        <h2>Featured Article</h2>
        <p>This is the article description that is long enough to be deduplicated.</p>
      </section>
    `;
        const { markdown } = convert(html, { deduplicate: true });
        const headingCount = markdown.split('## Featured Article').length - 1;
        expect(headingCount).toBe(1);
        expect(markdown).toContain('## All Articles');
    });

    it('preserves short duplicates like separators', () => {
        const html = '<hr><p>Content</p><hr>';
        const { markdown } = convert(html, { deduplicate: true });
        const hrCount = markdown.split('---').length - 1;
        expect(hrCount).toBe(2);
    });

    it('preserves repeated structural headings with different content', () => {
        const html = `
      <section>
        <h2>Service A</h2>
        <h3>The situation</h3>
        <p>Company needed help with their marketing strategy and brand.</p>
      </section>
      <section>
        <h2>Service B</h2>
        <h3>The situation</h3>
        <p>Company needed help with their technology infrastructure setup.</p>
      </section>
    `;
        const { markdown } = convert(html, { deduplicate: true });
        const headingCount = markdown.split('### The situation').length - 1;
        expect(headingCount).toBe(2);
        expect(markdown).toContain('marketing');
        expect(markdown).toContain('technology');
    });

    it('token estimate reflects deduplicated content', () => {
        const html = '<p>Some repeated content block.</p><p>Some repeated content block.</p>';
        const original = convert(html);
        const deduped = convert(html, { deduplicate: true });
        expect(deduped.tokenEstimate.tokens).toBeLessThan(original.tokenEstimate.tokens);
    });

    it('accepts DeduplicateOptions with custom minLength', () => {
        // "Read more" is 9 chars — below default minLength 10, so normally kept
        const html = '<p>Read more</p><p>Main content that is long enough.</p><p>Read more</p>';
        const defaultDedup = convert(html, { deduplicate: true });
        const customDedup = convert(html, { deduplicate: { minLength: 5 } });

        const defaultCount = defaultDedup.markdown.split('Read more').length - 1;
        const customCount = customDedup.markdown.split('Read more').length - 1;

        expect(defaultCount).toBe(2); // preserved — below default minLength
        expect(customCount).toBe(1); // deduped — above custom minLength
    });

    it('uses default minLength when DeduplicateOptions is empty', () => {
        const html = '<p>Duplicate paragraph content here.</p><p>Unique</p><p>Duplicate paragraph content here.</p>';
        const withTrue = convert(html, { deduplicate: true });
        const withEmpty = convert(html, { deduplicate: {} });
        expect(withTrue.markdown).toBe(withEmpty.markdown);
    });
});
