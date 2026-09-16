---
'markdown-for-agents': minor
---

Strip `hidden` and `aria-hidden="true"` elements in extraction mode, with a `keepHidden` option to opt out. Content a page hides from rendering or from the accessibility tree is decorative, collapsed, or a layout duplicate of visible text, and it used to leak into the Markdown as
run-together noise.

Collapse `<br>` and wrapped source lines inside headings to a single space. A Markdown heading is one line, so the trailing double-space break that `<br>` produces elsewhere used to split a heading into a heading and a stray paragraph.

The Python package gains the same behaviour and a matching `keep_hidden` option.
