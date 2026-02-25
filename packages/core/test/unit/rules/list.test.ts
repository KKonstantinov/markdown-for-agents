import { describe, it, expect } from 'vitest';
import { convert } from '../../../src/core/converter.js';

describe('list rules', () => {
    it('converts unordered lists', () => {
        const { markdown } = convert('<ul><li>A</li><li>B</li><li>C</li></ul>');
        expect(markdown).toContain('- A');
        expect(markdown).toContain('- B');
        expect(markdown).toContain('- C');
    });

    it('converts ordered lists', () => {
        const { markdown } = convert('<ol><li>First</li><li>Second</li></ol>');
        expect(markdown).toContain('1. First');
        expect(markdown).toContain('2. Second');
    });

    it('respects ol start attribute', () => {
        const { markdown } = convert('<ol start="5"><li>Five</li><li>Six</li></ol>');
        expect(markdown).toContain('5. Five');
        expect(markdown).toContain('6. Six');
    });

    it('handles nested lists', () => {
        const html = `
      <ul>
        <li>Parent
          <ul>
            <li>Child A</li>
            <li>Child B</li>
          </ul>
        </li>
        <li>Sibling</li>
      </ul>
    `;
        const { markdown } = convert(html);
        expect(markdown).toContain('- Parent');
        expect(markdown).toContain('  - Child A');
        expect(markdown).toContain('  - Child B');
        expect(markdown).toContain('- Sibling');
    });

    it('supports custom bullet character', () => {
        const { markdown } = convert('<ul><li>Item</li></ul>', {
            bulletChar: '*'
        });
        expect(markdown).toContain('* Item');
    });

    it('handles empty list', () => {
        const { markdown } = convert('<ul></ul>');
        expect(markdown).toBe('\n');
    });

    it('handles deeply nested lists (3+ levels)', () => {
        const html = `
      <ul>
        <li>Level 1
          <ul>
            <li>Level 2
              <ul>
                <li>Level 3</li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    `;
        const { markdown } = convert(html);
        expect(markdown).toContain('- Level 1');
        expect(markdown).toContain('  - Level 2');
        expect(markdown).toContain('    - Level 3');
    });

    it('handles mixed ul/ol nesting', () => {
        const html = `
      <ul>
        <li>Bullet
          <ol>
            <li>Numbered A</li>
            <li>Numbered B</li>
          </ol>
        </li>
      </ul>
    `;
        const { markdown } = convert(html);
        expect(markdown).toContain('- Bullet');
        expect(markdown).toContain('  1. Numbered A');
        expect(markdown).toContain('  2. Numbered B');
    });
});
