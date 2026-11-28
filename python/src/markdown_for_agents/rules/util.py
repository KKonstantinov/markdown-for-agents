from __future__ import annotations

from ..dom.nodes import Element, Text


def get_text_content(node: Element | Text) -> str:
    """Recursively extract plain text content from a DOM node."""
    if isinstance(node, Text):
        return node.data
    if hasattr(node, "children"):
        return "".join(get_text_content(child) for child in node.children)
    return ""


def longest_run(text: str, char: str) -> int:
    """Return the length of the longest run of ``char`` in ``text``.

    Used to size code fences and inline code delimiters so that runs of the
    same character inside the content cannot close them early.
    """
    longest = current = 0
    for c in text:
        current = current + 1 if c == char else 0
        longest = max(longest, current)
    return longest
