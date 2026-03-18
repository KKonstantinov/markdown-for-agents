from __future__ import annotations

import re
from typing import TYPE_CHECKING

from ..dom.nodes import Document, Element, is_tag

if TYPE_CHECKING:
    from .._types import ExtractOptions
from .selectors import DEFAULT_STRIP_CLASSES, DEFAULT_STRIP_IDS, DEFAULT_STRIP_ROLES, DEFAULT_STRIP_TAGS


def extract_content(document: Document, options: ExtractOptions | None = None) -> None:
    """Remove non-content elements from a parsed HTML document in-place."""
    strip_tags = set(DEFAULT_STRIP_TAGS)
    if options is not None:
        strip_tags.update(options.strip_tags)
        if options.keep_header:
            strip_tags.discard("header")
        if options.keep_footer:
            strip_tags.discard("footer")
        if options.keep_nav:
            strip_tags.discard("nav")

    strip_roles = set(DEFAULT_STRIP_ROLES)
    if options is not None:
        strip_roles.update(options.strip_roles)

    strip_classes: list[str | re.Pattern[str]] = list(DEFAULT_STRIP_CLASSES)
    if options is not None:
        strip_classes.extend(options.strip_classes)

    strip_ids: list[str | re.Pattern[str]] = list(DEFAULT_STRIP_IDS)
    if options is not None:
        strip_ids.extend(options.strip_ids)

    _prune_tree(document, strip_tags, strip_roles, strip_classes, strip_ids)


def _prune_tree(
    node: Document | Element,
    strip_tags: set[str],
    strip_roles: set[str],
    strip_classes: list[str | re.Pattern[str]],
    strip_ids: list[str | re.Pattern[str]],
) -> None:
    """Recursively walk the DOM tree and remove elements matching strip criteria."""
    to_remove: list[Element] = []

    for child in node.children:
        if not is_tag(child):
            continue
        assert isinstance(child, Element)

        if _should_strip(child, strip_tags, strip_roles, strip_classes, strip_ids):
            to_remove.append(child)
            continue

        _prune_tree(child, strip_tags, strip_roles, strip_classes, strip_ids)

    for child in to_remove:
        if child in node.children:
            node.children.remove(child)
            child.parent = None


def _should_strip(
    el: Element,
    strip_tags: set[str],
    strip_roles: set[str],
    strip_classes: list[str | re.Pattern[str]],
    strip_ids: list[str | re.Pattern[str]],
) -> bool:
    """Determine whether an element should be stripped from the DOM tree."""
    if el.name in strip_tags:
        return True

    role = el.attribs.get("role", "")
    if role and role in strip_roles:
        return True

    class_name = el.attribs.get("class", "")
    if class_name and _matches_any(class_name, strip_classes):
        return True

    el_id = el.attribs.get("id", "")
    return bool(el_id and _matches_any(el_id, strip_ids))


def _matches_any(value: str, patterns: list[str | re.Pattern[str]]) -> bool:
    """Test a string against a list of patterns."""
    for pattern in patterns:
        if isinstance(pattern, str) and pattern in value or isinstance(pattern, re.Pattern) and pattern.search(value):
            return True
    return False
