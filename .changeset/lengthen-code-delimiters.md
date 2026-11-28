---
'markdown-for-agents': patch
---

Size code block fences and inline code delimiters to the content. A `<pre>` fence is now longer than any run of the fence character inside the block, and an inline `<code>` delimiter is longer than any backtick run inside the span, as CommonMark requires. Code that contains its
own fences or backtick runs used to close the delimiter early, which broke the rest of the Markdown.
