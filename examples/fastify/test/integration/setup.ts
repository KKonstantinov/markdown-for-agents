import type { FastifyInstance } from 'fastify';

let app: FastifyInstance | undefined;

export async function setup() {
    const port = 3000 + Math.floor(Math.random() * 5000);
    process.env['PORT'] = String(port);

    const mod = await import('../../src/index.js');
    app = mod.app;

    process.env['TEST_BASE_URL'] = `http://127.0.0.1:${String(port)}`;
}

export async function teardown() {
    await app?.close();
}
