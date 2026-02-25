import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { convert } from '../../src/core/converter.js';

const fixture = (name: string) => readFileSync(path.resolve(import.meta.dirname, '../fixtures', name), 'utf8');

describe('content extraction', () => {
    it('strips nav, header, footer, aside, scripts, styles', () => {
        const html = fixture('full-page.html');
        const { markdown } = convert(html, { extract: true });

        expect(markdown).not.toContain('Home');
        expect(markdown).not.toContain('About');
        expect(markdown).not.toContain('Site Header');
        expect(markdown).not.toContain('Copyright');
        expect(markdown).not.toContain('Related Posts');
        expect(markdown).not.toContain('console.log');
        expect(markdown).not.toContain('cookie');

        expect(markdown).toContain('Article Title');
        expect(markdown).toContain('main content');
    });

    it('keeps header when configured', () => {
        const html = fixture('full-page.html');
        const { markdown } = convert(html, {
            extract: { keepHeader: true }
        });

        expect(markdown).toContain('Site Header');
        expect(markdown).not.toContain('Home'); // nav still stripped
    });

    it('strips elements by class pattern', () => {
        const { markdown } = convert('<p>Keep</p><div class="sidebar-widget">Sidebar</div>', { extract: true });
        expect(markdown).toContain('Keep');
        expect(markdown).not.toContain('Sidebar');
    });

    it('strips elements by role', () => {
        const { markdown } = convert('<p>Keep</p><div role="navigation">Nav</div>', { extract: true });
        expect(markdown).toContain('Keep');
        expect(markdown).not.toContain('Nav');
    });

    it('keeps footer when configured', () => {
        const html = fixture('full-page.html');
        const { markdown } = convert(html, {
            extract: { keepFooter: true }
        });
        expect(markdown).toContain('Copyright');
        expect(markdown).not.toContain('Site Header'); // header still stripped
    });

    it('keeps nav when configured', () => {
        const html = fixture('full-page.html');
        const { markdown } = convert(html, {
            extract: { keepNav: true }
        });
        expect(markdown).toContain('Home');
        expect(markdown).not.toContain('Site Header'); // header still stripped
    });

    it('strips by custom stripTags', () => {
        const { markdown } = convert('<p>Keep</p><section>Remove</section>', {
            extract: { stripTags: ['section'] }
        });
        expect(markdown).toContain('Keep');
        expect(markdown).not.toContain('Remove');
    });

    it('strips by custom stripClasses', () => {
        const { markdown } = convert('<p>Keep</p><div class="my-custom-ad">Ad</div>', { extract: { stripClasses: [/my-custom/] } });
        expect(markdown).toContain('Keep');
        expect(markdown).not.toContain('Ad');
    });

    it('strips by custom stripIds', () => {
        const { markdown } = convert('<p>Keep</p><div id="remove-me">Gone</div>', {
            extract: { stripIds: ['remove-me'] }
        });
        expect(markdown).toContain('Keep');
        expect(markdown).not.toContain('Gone');
    });

    it('strips by default ID patterns', () => {
        const { markdown } = convert('<p>Keep</p><div id="sidebar-left">Side</div>', { extract: true });
        expect(markdown).toContain('Keep');
        expect(markdown).not.toContain('Side');
    });

    it('strips CTA sections', () => {
        const { markdown } = convert('<p>Article content</p><div class="cta-section"><p>Sign up now!</p></div>', { extract: true });
        expect(markdown).toContain('Article content');
        expect(markdown).not.toContain('Sign up');
    });

    it('strips author bio cards', () => {
        const { markdown } = convert('<p>Article content</p><div class="author-card"><p>John Doe</p></div>', { extract: true });
        expect(markdown).toContain('Article content');
        expect(markdown).not.toContain('John Doe');
    });

    it('strips avatar elements', () => {
        const { markdown } = convert('<p>Content</p><div class="avatar"><img src="photo.jpg"></div>', { extract: true });
        expect(markdown).toContain('Content');
        expect(markdown).not.toContain('photo.jpg');
    });

    it('strips pagination elements', () => {
        const { markdown } = convert('<p>Content</p><nav class="pagination"><a href="/prev">Previous</a><a href="/next">Next</a></nav>', {
            extract: true
        });
        expect(markdown).toContain('Content');
        expect(markdown).not.toContain('Previous');
        expect(markdown).not.toContain('Next');
    });

    it('strips prev-next navigation', () => {
        const { markdown } = convert('<p>Content</p><div class="prev-next"><a href="/prev">Prev</a></div>', { extract: true });
        expect(markdown).toContain('Content');
        expect(markdown).not.toContain('Prev');
    });
});
