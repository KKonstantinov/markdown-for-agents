import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { execFile } from 'node:child_process';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BIN = new URL('../../bin/agent-markdown-audit.mjs', import.meta.url).pathname;
const HTML = '<html><body><h1>Hello</h1><p>World</p></body></html>';

let server: Server;
let baseUrl: string;

function run(...args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise(resolve => {
        execFile('node', [BIN, ...args], (error, stdout, stderr) => {
            resolve({ stdout, stderr, code: error?.code ? 1 : error ? (error as { code: number }).code : 0 });
        });
    });
}

beforeAll(async () => {
    server = createServer((_, res) => {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end(HTML);
    });
    await new Promise<void>(resolve => server.listen(0, resolve));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    baseUrl = `http://localhost:${String(port)}`;
});

afterAll(async () => {
    await new Promise<void>(resolve =>
        server.close(() => {
            resolve();
        })
    );
});

describe('cli', () => {
    it('shows help with --help', async () => {
        const { stdout, code } = await run('--help');
        expect(code).toBe(0);
        expect(stdout).toContain('Usage:');
        expect(stdout).toContain('--print');
    });

    it('exits with code 1 when no args', async () => {
        const { code } = await run();
        expect(code).not.toBe(0);
    });

    it('prints audit table by default', async () => {
        const { stdout } = await run(baseUrl);
        expect(stdout).toContain('Audit:');
        expect(stdout).toContain('Tokens');
        expect(stdout).toContain('Savings');
        expect(stdout).not.toContain('Hello');
    });

    it('--print includes markdown content after the table', async () => {
        const { stdout } = await run(baseUrl, '--print');
        expect(stdout).toContain('Tokens');
        expect(stdout).toContain('Hello');
        expect(stdout).toContain('World');
    });

    it('--json includes markdown content', async () => {
        const { stdout } = await run(baseUrl, '--json');
        const json = JSON.parse(stdout) as { markdown: { content: string; bytes: number }; reduction: unknown };
        expect(json.markdown.content).toContain('Hello');
        expect(json.markdown.content).toContain('World');
        expect(json.markdown.bytes).toBeGreaterThan(0);
        expect(json.reduction).toBeDefined();
    });

    it('--json without --print does not print table', async () => {
        const { stdout } = await run(baseUrl, '--json');
        expect(stdout).not.toContain('Audit:');
        expect(stdout).not.toContain('Savings');
    });
});
