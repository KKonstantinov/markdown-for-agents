from __future__ import annotations

import re

from ..dom.nodes import Document, Element, is_tag
from ..rules.util import get_text_content

_NEEDS_QUOTING = re.compile(r": |[#\"'{}[\]|>\n\\]|^\s|\s$")


def extract_metadata(document: Document) -> dict[str, str]:
    """Extract page metadata from the <head> element of an HTML document."""
    meta: dict[str, str] = {}

    head = _find_head(document)
    if head is None:
        return meta

    for child in head.children:
        if not is_tag(child):
            continue
        assert isinstance(child, Element)

        if child.name == "title":
            text = get_text_content(child).strip()
            if text:
                meta["title"] = text

        if child.name == "meta":
            entry = _extract_from_meta(child.attribs)
            if entry is not None:
                meta[entry[0]] = entry[1]

    return meta


def _extract_from_meta(attrs: dict[str, str]) -> tuple[str, str] | None:
    """Extract a key-value pair from a <meta> element's attributes."""
    if "content" not in attrs:
        return None
    content = attrs["content"].strip()
    if not content:
        return None

    if "name" in attrs and attrs["name"].lower() == "description":
        return ("description", content)
    if "property" in attrs and attrs["property"].lower() == "og:image":
        return ("image", content)

    return None


def serialize_frontmatter(meta: dict[str, str]) -> str:
    """Serialize a metadata record into a YAML frontmatter block."""
    keys = list(meta.keys())
    if not keys:
        return ""

    priority = ["title", "description", "image"]
    rest = sorted([k for k in keys if k not in priority])
    ordered = [k for k in priority if k in meta] + rest

    lines = [f"{key}: {_yaml_quote(meta[key])}" for key in ordered]
    return f"---\n{chr(10).join(lines)}\n---\n"


def _yaml_quote(value: str) -> str:
    """Wrap a YAML value in double quotes if it contains characters that require quoting."""
    if _NEEDS_QUOTING.search(value):
        escaped = value.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return value


def _find_head(document: Document) -> Element | None:
    """Walk the document to find a <head> element."""
    for child in document.children:
        if not is_tag(child):
            continue
        assert isinstance(child, Element)

        if child.name == "head":
            return child

        if child.name == "html":
            for grandchild in child.children:
                if is_tag(grandchild):
                    assert isinstance(grandchild, Element)
                    if grandchild.name == "head":
                        return grandchild

    return None
