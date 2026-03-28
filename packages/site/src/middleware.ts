import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withMarkdown } from '@markdown-for-agents/nextjs';

const options = {
    extract: true,
    deduplicate: true,
    contentSignal: { aiTrain: true, search: true, aiInput: true }
};

export async function middleware(request: NextRequest, event: NextFetchEvent) {
    const accept = request.headers.get('accept') ?? '';
    if (!accept.includes('text/markdown')) {
        return NextResponse.next();
    }

    const handler = withMarkdown(async (req: NextRequest) => fetch(req.url, { headers: { accept: 'text/html' } }), {
        ...options,
        baseUrl: request.nextUrl.origin
    });

    return (await handler(request, event)) ?? NextResponse.next();
}

export const config = {
    matcher: ['/docs/:path*']
};
