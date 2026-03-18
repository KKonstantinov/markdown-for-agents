from __future__ import annotations

from ..dom.nodes import Element, Text


def get_text_content(node: Element | Text) -> str:
    """Recursively extract plain text content from a DOM node."""
    if isinstance(node, Text):
        return node.data
    if hasattr(node, "children"):
        return "".join(get_text_content(child) for child in node.children)
    return ""
