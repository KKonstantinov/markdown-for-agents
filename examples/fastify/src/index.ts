import Fastify from 'fastify';
import { markdown } from '@markdown-for-agents/fastify';

const app = Fastify();

app.register(
    markdown({
        extract: true,
        deduplicate: true,
        contentSignal: { aiTrain: true, search: true, aiInput: true }
    })
);

const nav = '<nav><a href="/">Home</a> <a href="/about">About</a> <a href="/article">Article</a></nav>';
const footer = '<footer><p>&copy; 2025 markdown-for-agents</p></footer>';

app.get('/', (_request, reply) => {
    reply.header('content-type', 'text/html');
    return reply.send(
        `${nav}<main><h1>Welcome</h1><p>This is the home page of the <strong>markdown-for-agents</strong> Fastify example.</p><ul><li>Content extraction strips nav and footer</li><li>Markdown conversion preserves structure</li></ul></main>${footer}`
    );
});

app.get('/about', (_request, reply) => {
    reply.header('content-type', 'text/html');
    return reply.send(
        `${nav}<main><h1>About</h1><p>This page demonstrates the <strong>middleware pattern</strong> for site-wide markdown conversion.</p><p>When an AI agent sends <code>Accept: text/markdown</code>, the middleware intercepts the request and converts the HTML response to markdown automatically.</p></main>${footer}`
    );
});

app.get('/article', (_request, reply) => {
    reply.header('content-type', 'text/html');
    return reply.send(
        `${nav}<main><h1>Sample Article</h1><p>This is a <strong>sample article</strong> demonstrating the middleware pattern.</p><h2>Key Features</h2><ul><li>Content negotiation via Accept header</li><li>Automatic HTML to markdown conversion</li><li>Token estimation in response headers</li></ul><p>Visit <a href="https://example.com">Example</a> for more information.</p></main>${footer}`
    );
});

const port = Number(process.env['PORT'] ?? 3000);
const address = await app.listen({ port, host: '127.0.0.1' });
console.log(`Fastify example listening on ${address}`);

export { app };
