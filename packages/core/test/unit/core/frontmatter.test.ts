import { describe, it, expect } from 'vitest';
import { extractMetadata, serializeFrontmatter } from '../../../src/core/frontmatter.js';
import { parse } from '../../../src/core/parser.js';

describe('extractMetadata', () => {
    it('extracts title from <title>', () => {
        const doc = parse('<html><head><title>My Page</title></head><body></body></html>');
        expect(extractMetadata(doc)).toEqual({ title: 'My Page' });
    });

    it('extracts description from <meta name="description">', () => {
        const doc = parse('<html><head><meta name="description" content="A great page"></head><body></body></html>');
        expect(extractMetadata(doc)).toEqual({ description: 'A great page' });
    });

    it('extracts image from <meta property="og:image">', () => {
        const doc = parse('<html><head><meta property="og:image" content="https://example.com/img.png"></head><body></body></html>');
        expect(extractMetadata(doc)).toEqual({ image: 'https://example.com/img.png' });
    });

    it('extracts all three fields together', () => {
        const doc = parse(`
            <html><head>
                <title>Title</title>
                <meta name="description" content="Desc">
                <meta property="og:image" content="https://img.example.com/photo.jpg">
            </head><body></body></html>
        `);
        expect(extractMetadata(doc)).toEqual({
            title: 'Title',
            description: 'Desc',
            image: 'https://img.example.com/photo.jpg'
        });
    });

    it('handles bare <head> without <html> wrapper', () => {
        const doc = parse('<head><title>Bare</title></head><body><p>Text</p></body>');
        expect(extractMetadata(doc)).toEqual({ title: 'Bare' });
    });

    it('returns empty object when no <head> exists', () => {
        const doc = parse('<p>No head here</p>');
        expect(extractMetadata(doc)).toEqual({});
    });

    it('skips fields with empty content', () => {
        const doc = parse('<html><head><title></title><meta name="description" content=""></head><body></body></html>');
        expect(extractMetadata(doc)).toEqual({});
    });

    it('trims whitespace from title', () => {
        const doc = parse('<html><head><title>  Spaced Title  </title></head><body></body></html>');
        expect(extractMetadata(doc)).toEqual({ title: 'Spaced Title' });
    });

    it('is case-insensitive for meta name/property', () => {
        const doc = parse('<html><head><meta name="Description" content="Caps"></head><body></body></html>');
        expect(extractMetadata(doc)).toEqual({ description: 'Caps' });
    });
});

describe('serializeFrontmatter', () => {
    it('returns empty string for empty record', () => {
        expect(serializeFrontmatter({})).toBe('');
    });

    it('serializes a single field', () => {
        expect(serializeFrontmatter({ title: 'Hello' })).toBe('---\ntitle: Hello\n---\n');
    });

    it('orders title, description, image first', () => {
        const result = serializeFrontmatter({
            image: 'https://example.com/img.png',
            title: 'Title',
            description: 'Desc'
        });
        const lines = result.split('\n');
        expect(lines[1]).toBe('title: Title');
        expect(lines[2]).toBe('description: Desc');
        expect(lines[3]).toBe('image: https://example.com/img.png');
    });

    it('sorts remaining keys alphabetically after priority keys', () => {
        const result = serializeFrontmatter({
            title: 'T',
            zebra: 'z',
            alpha: 'a'
        });
        const lines = result.split('\n');
        expect(lines[1]).toBe('title: T');
        expect(lines[2]).toBe('alpha: a');
        expect(lines[3]).toBe('zebra: z');
    });

    it('quotes values containing colons', () => {
        const result = serializeFrontmatter({ title: 'Key: Value' });
        expect(result).toContain('title: "Key: Value"');
    });

    it('quotes values containing hash', () => {
        const result = serializeFrontmatter({ title: 'Color #fff' });
        expect(result).toContain('title: "Color #fff"');
    });

    it('quotes values with double quotes inside', () => {
        const result = serializeFrontmatter({ title: 'Say "hello"' });
        expect(result).toContain(String.raw`title: "Say \"hello\""`);
    });

    it('quotes values starting with whitespace', () => {
        const result = serializeFrontmatter({ title: ' leading' });
        expect(result).toContain('title: " leading"');
    });

    it('quotes values ending with whitespace', () => {
        const result = serializeFrontmatter({ title: 'trailing ' });
        expect(result).toContain('title: "trailing "');
    });

    it('does not quote simple values', () => {
        const result = serializeFrontmatter({ title: 'Simple Title' });
        expect(result).toContain('title: Simple Title');
        expect(result).not.toContain('"');
    });

    it('escapes backslashes in quoted values', () => {
        const result = serializeFrontmatter({ title: String.raw`path\to` });
        expect(result).toContain(String.raw`title: "path\\to"`);
    });
});
