import type { FastifyInstance } from 'fastify';
import { randomPort } from '../../../shared/setup-helpers.js';

let app: FastifyInstance | undefined;

export async function setup() {
    const port = randomPort();
    process.env['PORT'] = String(port);

    const mod = await import('../../src/index.js');
    app = mod.app;

    process.env['TEST_BASE_URL'] = `http://127.0.0.1:${String(port)}`;
}

export async function teardown() {
    await app?.close();
}
