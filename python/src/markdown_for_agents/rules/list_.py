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
    parent_el = ctx.parent if ctx.parent is not None and is_tag(ctx.parent) else None

    if isinstance(parent_el, Element) and parent_el.name == "ol":
        start = int(parent_el.attribs.get("start", "1"))
        # Count only <li> siblings before this one
        li_index = 0
        for i in range(ctx.sibling_index):
            sibling = parent_el.children[i]
            if is_tag(sibling) and isinstance(sibling, Element) and sibling.name == "li":
                li_index += 1
        bullet = f"{start + li_index}."
    else:
        bullet = ctx.options.bullet_char

    # Handle multi-line content by indenting continuation lines
    lines = content.split("\n")
    first = f"{indent}{bullet} {lines[0]}"
    if len(lines) == 1:
        return f"{first}\n"

    continuation_indent = indent + " " * (len(bullet) + 1)
    rest_lines: list[str] = []
    for line in lines[1:]:
        if line.strip():
            rest_lines.append(f"{continuation_indent}{line}")
        else:
            rest_lines.append("")
    rest = "\n".join(rest_lines)

    return f"{first}\n{rest}\n"
