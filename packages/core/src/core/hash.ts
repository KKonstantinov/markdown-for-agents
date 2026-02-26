/**
 * Fast, non-cryptographic FNV-1a hash for content fingerprinting.
 *
 * Produces a short, URL-safe string combining the input length with
 * a 32-bit hash — sufficient for ETag / cache-key purposes.
 *
 * @internal
 */
export function contentHash(str: string): string {
    let h = 0x81_1c_9d_c5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.codePointAt(i) ?? 0;
        h = Math.imul(h, 0x01_00_01_93);
    }
    return `${str.length.toString(36)}-${(h >>> 0).toString(36)}`;
}
