export function randomPort() {
    return 3000 + Math.floor(Math.random() * 5000);
}

export async function waitForServer(baseUrl: string, timeoutMs = 10_000) {
    const start = Date.now();
    for (;;) {
        if (Date.now() - start > timeoutMs) throw new Error('Server did not start');
        try {
            const res = await fetch(baseUrl, { headers: { accept: 'text/html' } });
            if (res.ok) break;
        } catch {
            // not ready
        }
        await new Promise(r => setTimeout(r, 200));
    }
}
