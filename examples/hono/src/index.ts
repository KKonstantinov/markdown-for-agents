import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { markdown } from '@markdown-for-agents/hono';

const app = new Hono();

const md = markdown({
    extract: true,
    deduplicate: true,
    contentSignal: { aiTrain: true, search: true, aiInput: true }
});

app.use('*', md);

const nav = '<nav><a href="/">Home</a> <a href="/about">About</a> <a href="/article">Article</a></nav>';
const footer = '<footer><p>&copy; 2025 markdown-for-agents</p></footer>';

app.get('/', c => {
    return c.html(
        `${nav}<main><h1>Welcome</h1><p>This is the home page of the <strong>markdown-for-agents</strong> Hono example.</p><ul><li>Content extraction strips nav and footer</li><li>Markdown conversion preserves structure</li></ul></main>${footer}`
    );
});

app.get('/about', c => {
    return c.html(
        `${nav}<main><h1>About</h1><p>This page demonstrates the <strong>middleware pattern</strong> for site-wide markdown conversion.</p><p>When an AI agent sends <code>Accept: text/markdown</code>, the middleware intercepts the request and converts the HTML response to markdown automatically.</p></main>${footer}`
    );
});

app.get('/article', c => {
    return c.html(
        `${nav}<main><h1>Sample Article</h1><p>This is a <strong>sample article</strong> demonstrating the middleware pattern.</p><h2>Key Features</h2><ul><li>Content negotiation via Accept header</li><li>Automatic HTML to markdown conversion</li><li>Token estimation in response headers</li></ul><p>Visit <a href="https://example.com">Example</a> for more information.</p></main>${footer}`
    );
});

const port = Number(process.env['PORT'] ?? 3000);
const server = serve({ fetch: app.fetch, port }, info => {
    console.log(`Hono example listening on http://localhost:${String(info.port)}`);
});

export { app, server };
