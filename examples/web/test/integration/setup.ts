import type { Server } from 'node:http';

let server: Server | undefined;

export async function setup() {
    const port = 3000 + Math.floor(Math.random() * 5000);
    process.env['PORT'] = String(port);

    const mod = await import('../../src/index.js');
    server = mod.server;

    const baseUrl = `http://127.0.0.1:${String(port)}`;
    const start = Date.now();
    for (;;) {
        if (Date.now() - start > 10_000) throw new Error('Server did not start');
        try {
            const res = await fetch(baseUrl, { headers: { accept: 'text/html' } });
            if (res.ok) break;
        } catch {
            // not ready
        }
        await new Promise(r => setTimeout(r, 200));
    }

    process.env['TEST_BASE_URL'] = baseUrl;
}

export function teardown() {
    server?.close();
}
