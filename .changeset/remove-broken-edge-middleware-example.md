---
'@markdown-for-agents/nextjs': patch
---

Remove broken "Next.js Middleware (Edge)" example from docs that used `fetch(request.url)` inside edge middleware, which causes an infinite loop. Next.js edge middleware cannot intercept response bodies — use `withMarkdown` with App Router route handlers instead.
