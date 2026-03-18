from __future__ import annotations

import re

from .._types import Rule, RuleContext
from ..dom.nodes import Element, is_tag
from .util import get_text_content

_BARE_LANG_CLASSES = frozenset({"mermaid"})


def _detect_language(node: Element) -> str:
    """Detect the language identifier for a <pre> code block."""
    # Check <code> child element
    code_child: Element | None = None
    for c in node.children:
        if is_tag(c) and isinstance(c, Element) and c.name == "code":
            code_child = c
            break

    if code_child is not None:
        cls = code_child.attribs.get("class", "")
        match = re.search(r"language-(\S+)", cls)
        if match:
            return match.group(1)

    # Check <pre> element itself
    pre_cls = node.attribs.get("class", "")
    match = re.search(r"language-(\S+)", pre_cls)
    if match:
        return match.group(1)

    # Check bare class names
    for cls in pre_cls.split():
        if cls in _BARE_LANG_CLASSES:
            return cls

    return ""


block_rules: list[Rule] = [
    Rule(
        filter=["h1", "h2", "h3", "h4", "h5", "h6"],
        replacement=lambda ctx: _heading_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter="p",
        replacement=lambda ctx: _p_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter="blockquote",
        replacement=lambda ctx: _blockquote_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter="pre",
        replacement=lambda ctx: _pre_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter="hr",
        replacement=lambda ctx: "\n\n---\n\n",
        priority=0,
    ),
    Rule(
        filter="br",
        replacement=lambda ctx: "  \n",
        priority=0,
    ),
    Rule(
        filter=["script", "style", "noscript", "template"],
        replacement=lambda ctx: None,
        priority=0,
    ),
    Rule(
        filter=["head", "title", "meta", "link", "base"],
        replacement=lambda ctx: None,
        priority=0,
    ),
]


def _heading_replacement(ctx: RuleContext) -> str | None:
    level = int(ctx.node.name[1])
    content = ctx.convert_children(ctx.node).strip()
    if not content:
        return None

    if ctx.options.heading_style == "setext" and level <= 2:
        ch = "=" if level == 1 else "-"
        return f"\n\n{content}\n{ch * len(content)}\n\n"
    return f"\n\n{'#' * level} {content}\n\n"


def _p_replacement(ctx: RuleContext) -> str | None:
    content = ctx.convert_children(ctx.node).strip()
    if not content:
        return None
    return f"\n\n{content}\n\n"


def _blockquote_replacement(ctx: RuleContext) -> str | None:
    content = ctx.convert_children(ctx.node).strip()
    if not content:
        return None
    quoted = "\n".join(f"> {line}" for line in content.split("\n"))
    return f"\n\n{quoted}\n\n"


def _pre_replacement(ctx: RuleContext) -> str:
    lang = _detect_language(ctx.node)
    text = get_text_content(ctx.node)
    fence = ctx.options.fence_char * 3
    return f"\n\n{fence}{lang}\n{text}\n{fence}\n\n"
