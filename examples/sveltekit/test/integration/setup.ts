import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { randomPort, waitForServer } from '../../../shared/setup-helpers.js';

const require = createRequire(import.meta.url);
const viteBin = path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js');

let child: ChildProcess | undefined;

export async function setup() {
    const port = randomPort();
    const baseUrl = `http://127.0.0.1:${String(port)}`;

    child = spawn(process.execPath, [viteBin, 'dev', '--host', '127.0.0.1', '--port', String(port)], {
        cwd: path.resolve(import.meta.dirname, '../..'),
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'development' }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        if (text.includes('Error') || text.includes('error')) {
            console.error('[sveltekit dev stderr]', text);
        }
    });

    await waitForServer(baseUrl, 60_000);
    process.env['TEST_BASE_URL'] = baseUrl;
}

export function teardown() {
    child?.kill('SIGTERM');
}
