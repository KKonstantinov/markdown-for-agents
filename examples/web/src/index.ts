import { createServer } from 'node:http';
import { markdownMiddleware } from '@markdown-for-agents/web';

const mw = markdownMiddleware({
    extract: true,
    deduplicate: true,
    contentSignal: { aiTrain: true, search: true, aiInput: true }
});

const nav = '<nav><a href="/">Home</a> <a href="/about">About</a> <a href="/article">Article</a></nav>';
const footer = '<footer><p>&copy; 2025 markdown-for-agents</p></footer>';

function htmlResponse(html: string): Response {
    return new Response(html, { headers: { 'content-type': 'text/html' } });
}

function handler(request: Request): Response {
    const url = new URL(request.url);
    switch (url.pathname) {
        case '/': {
            return htmlResponse(
                `${nav}<main><h1>Welcome</h1><p>This is the home page of the <strong>markdown-for-agents</strong> Web example.</p><ul><li>Content extraction strips nav and footer</li><li>Markdown conversion preserves structure</li></ul></main>${footer}`
            );
        }
        case '/about': {
            return htmlResponse(
                `${nav}<main><h1>About</h1><p>This page demonstrates the <strong>middleware pattern</strong> for site-wide markdown conversion.</p><p>When an AI agent sends <code>Accept: text/markdown</code>, the middleware intercepts the request and converts the HTML response to markdown automatically.</p></main>${footer}`
            );
        }
        case '/article': {
            return htmlResponse(
                `${nav}<main><h1>Sample Article</h1><p>This is a <strong>sample article</strong> demonstrating the middleware pattern.</p><h2>Key Features</h2><ul><li>Content negotiation via Accept header</li><li>Automatic HTML to markdown conversion</li><li>Token estimation in response headers</li></ul><p>Visit <a href="https://example.com">Example</a> for more information.</p></main>${footer}`
            );
        }
        default: {
            return new Response('Not Found', { status: 404 });
        }
    }
}

const port = Number(process.env['PORT'] ?? 3000);

async function handleRequest(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) {
    const url = `http://127.0.0.1:${String(port)}${req.url ?? '/'}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }

    const request = new Request(url, { method: req.method, headers });
    const response = await mw(request, () => Promise.resolve(handler(request)));

    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(await response.text());
}

const server = createServer((req, res) => {
    void handleRequest(req, res);
});

server.listen(port, '127.0.0.1', () => {
    console.log(`Web example listening on http://127.0.0.1:${String(port)}`);
});

export { server };
