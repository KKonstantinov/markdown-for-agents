# Next.js Example — markdown-for-agents

A complete Next.js app demonstrating the site-wide proxy pattern for [`@markdown-for-agents/nextjs`](https://www.npmjs.com/package/@markdown-for-agents/nextjs).

## How It Works

A Next.js proxy intercepts requests with `Accept: text/markdown`, fetches the page as HTML, and converts it to Markdown automatically. Normal browser requests pass through untouched.

```ts
// src/proxy.ts
import { withMarkdown } from '@markdown-for-agents/nextjs';

export async function proxy(request, event) {
    if (!request.headers.get('accept')?.includes('text/markdown')) {
        return NextResponse.next();
    }
    const handler = withMarkdown(async req => fetch(req.url, { headers: { accept: 'text/html' } }), {
        extract: true,
        baseUrl: request.nextUrl.origin
    });
    return (await handler(request, event)) ?? NextResponse.next();
}

export const config = { matcher: ['/', '/about', '/article'] };
```

Pages are standard React server components — the proxy converts them on the fly:

```tsx
// src/app/article/page.tsx
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';

export default function ArticlePage() {
    return (
        <>
            <Nav />
            <main>
                <h1>Sample Article</h1>
                <p>
                    This is a <strong>sample article</strong>.
                </p>
            </main>
            <Footer />
        </>
    );
}
```

## Running

```bash
# From the monorepo root
pnpm install
pnpm build

# Start the dev server
pnpm --filter @markdown-for-agents/example-nextjs dev
```

## Testing

```bash
# Test with curl
curl http://localhost:3000/                                   # HTML
curl -H "Accept: text/markdown" http://localhost:3000/        # Markdown

# Run integration tests
pnpm --filter @markdown-for-agents/example-nextjs test:integration
```

## Structure

```
src/
  components/
    nav.tsx                 # Shared navigation component
    footer.tsx              # Shared footer component
    feature-list.tsx        # Reusable list component
  app/
    layout.tsx              # Root layout
    page.tsx                # Home page
    about/page.tsx          # About page
    article/page.tsx        # Article page
  proxy.ts                  # Site-wide proxy pattern
test/
  integration/              # Integration tests (starts real dev server)
```
