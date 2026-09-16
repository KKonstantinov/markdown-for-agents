import { describe, it, expect } from 'vitest';
import { middlewareIntegrationSuite } from '../../../shared/integration-suite.js';

const baseUrl = process.env['TEST_BASE_URL']!;

middlewareIntegrationSuite('sveltekit');

describe('sveltekit middleware fixture pass-through routes', () => {
    it('does not convert +server.ts JSON endpoints', async () => {
        const response = await fetch(`${baseUrl}/json`, {
            headers: { accept: 'text/markdown' }
        });

        expect(response.headers.get('content-type')).toContain('application/json');
        expect(await response.json()).toEqual({ message: 'hello' });
    });
});
