import type { ServerType } from '@hono/node-server';
import { randomPort, waitForServer } from '../../../shared/setup-helpers.js';

let server: ServerType | undefined;

export async function setup() {
    const port = randomPort();
    process.env['PORT'] = String(port);

    const mod = await import('../../src/index.js');
    server = mod.server;

    const baseUrl = `http://127.0.0.1:${String(port)}`;
    await waitForServer(baseUrl);
    process.env['TEST_BASE_URL'] = baseUrl;
}

export function teardown() {
    server?.close();
}
