---
'@markdown-for-agents/nextjs': patch
---

Replace broken "Next.js Middleware (Edge)" example with a working "Next.js Proxy (Site-wide)" pattern that avoids infinite loops by using `accept: 'text/html'` on the inner fetch.
