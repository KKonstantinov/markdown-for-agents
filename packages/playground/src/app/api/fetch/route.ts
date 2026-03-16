import { NextResponse } from 'next/server';
import { withRateLimit } from '@universal-rate-limit/nextjs';

const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5 MB

const PRIVATE_IP_RANGES = [
    /^127\./, // loopback
    /^10\./, // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
    /^192\.168\./, // 192.168.0.0/16
    /^0\./, // 0.0.0.0/8
    /^169\.254\./, // link-local
    /^::1$/, // IPv6 loopback
    /^f[cd]/, // IPv6 private
    /^fe80:/ // IPv6 link-local
];

function isPrivateIp(ip: string): boolean {
    return PRIVATE_IP_RANGES.some(range => range.test(ip));
}

async function handler(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing "url" query parameter' }, { status: 400 });
    }

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return NextResponse.json({ error: 'Only http and https URLs are allowed' }, { status: 400 });
    }

    // SSRF protection: resolve hostname and check for private IPs
    try {
        const { resolve4, resolve6 } = await import('node:dns/promises');
        const ips: string[] = [];
        try {
            ips.push(...(await resolve4(parsed.hostname)));
        } catch {
            /* no A records */
        }
        try {
            ips.push(...(await resolve6(parsed.hostname)));
        } catch {
            /* no AAAA records */
        }

        if (ips.length === 0) {
            return NextResponse.json({ error: 'Could not resolve hostname' }, { status: 400 });
        }

        if (ips.some(ip => isPrivateIp(ip))) {
            return NextResponse.json({ error: 'Private/internal URLs are not allowed' }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ error: 'DNS resolution failed' }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(10_000),
            redirect: 'follow',
            headers: {
                'User-Agent': 'markdown-for-agents-playground/1.0',
                Accept: 'text/html'
            }
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Upstream returned ${String(response.status)}` }, { status: 502 });
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('text/html')) {
            return NextResponse.json({ error: 'URL did not return HTML content' }, { status: 400 });
        }

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > MAX_BODY_SIZE) {
            return NextResponse.json({ error: 'Response exceeds 5 MB limit' }, { status: 413 });
        }

        const html = new TextDecoder().decode(buffer);

        return NextResponse.json({
            html,
            finalUrl: response.url
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === 'TimeoutError') {
            return NextResponse.json({ error: 'Request timed out (10s limit)' }, { status: 504 });
        }
        return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 502 });
    }
}

export const GET = withRateLimit(handler, { windowMs: 60_000, limit: 10 });
