from __future__ import annotations

from .._types import Rule, RuleContext
from ..dom.nodes import Element, is_tag

list_rules: list[Rule] = [
    Rule(
        filter=["ul", "ol"],
        replacement=lambda ctx: _list_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter="li",
        replacement=lambda ctx: _li_replacement(ctx),
        priority=0,
    ),
]


def _list_replacement(ctx: RuleContext) -> str:
    content = ctx.convert_children(ctx.node)
    if ctx.list_depth == 0:
        return f"\n\n{content.strip()}\n\n"
    return f"\n{content.rstrip()}"


def _li_replacement(ctx: RuleContext) -> str | None:
    content = ctx.convert_children(ctx.node).strip()
    if not content:
        return None

    indent = "  " * max(0, ctx.list_depth - 1)
    bullet = _get_bullet(ctx)

    lines = content.split("\n")
    first = f"{indent}{bullet} {lines[0]}"
    if len(lines) == 1:
        return f"{first}\n"

    continuation_indent = indent + " " * (len(bullet) + 1)
    rest_lines = [f"{continuation_indent}{line}" if line.strip() else "" for line in lines[1:]]

    return f"{first}\n{chr(10).join(rest_lines)}\n"


def _get_bullet(ctx: RuleContext) -> str:
    """Determine the bullet marker for a list item."""
    parent_el = ctx.parent if ctx.parent is not None and is_tag(ctx.parent) else None

    if not isinstance(parent_el, Element) or parent_el.name != "ol":
        return ctx.options.bullet_char

    start = int(parent_el.attribs.get("start", "1"))
    li_index = _count_preceding_li(parent_el, ctx.sibling_index)
    return f"{start + li_index}."


def _count_preceding_li(parent: Element, sibling_index: int) -> int:
    """Count <li> elements before the given sibling index."""
    count = 0
    for i in range(sibling_index):
        sibling = parent.children[i]
        if is_tag(sibling) and isinstance(sibling, Element) and sibling.name == "li":
            count += 1
    return count
