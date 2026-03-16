import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');

let child: ChildProcess | undefined;

async function waitForServer(url: string, timeout = 60_000): Promise<void> {
    const start = Date.now();
    for (;;) {
        if (Date.now() - start > timeout) {
            throw new Error(`Server did not start within ${String(timeout)}ms`);
        }
        try {
            const res = await fetch(url, { headers: { accept: 'text/html' } });
            if (res.ok) return;
        } catch {
            // not ready yet
        }
        await new Promise(r => setTimeout(r, 500));
    }
}

export async function setup() {
    const port = 3000 + Math.floor(Math.random() * 5000);
    const baseUrl = `http://127.0.0.1:${String(port)}`;

    child = spawn(process.execPath, [nextBin, 'dev', '--turbopack', '--port', String(port)], {
        cwd: path.resolve(import.meta.dirname, '../..'),
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'development' }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        if (text.includes('Error') || text.includes('error')) {
            console.error('[next dev stderr]', text);
        }
    });

    await waitForServer(baseUrl);

    process.env['TEST_BASE_URL'] = baseUrl;
}

export function teardown() {
    child?.kill('SIGTERM');
}
