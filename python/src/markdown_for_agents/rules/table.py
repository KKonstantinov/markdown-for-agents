from __future__ import annotations

from .._types import Rule, RuleContext
from ..dom.nodes import Element, is_tag

table_rules: list[Rule] = [
    Rule(
        filter="table",
        replacement=lambda ctx: _table_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter=["thead", "tbody", "tfoot"],
        replacement=lambda ctx: ctx.convert_children(ctx.node),
        priority=0,
    ),
    Rule(
        filter="tr",
        replacement=lambda ctx: _tr_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter=["th", "td"],
        replacement=lambda ctx: _td_replacement(ctx),
        priority=0,
    ),
]


def _table_replacement(ctx: RuleContext) -> str | None:
    content = ctx.convert_children(ctx.node).strip()
    if not content:
        return None
    return f"\n\n{content}\n\n"


def _tr_replacement(ctx: RuleContext) -> str | None:
    raw_cells = ctx.convert_children(ctx.node)
    cells = raw_cells.strip()
    if not cells:
        return None

    row = f"| {raw_cells.rstrip()} |"

    # Add separator row after the first <tr> in <thead>
    is_in_thead = ctx.parent is not None and isinstance(ctx.parent, Element) and ctx.parent.name == "thead"
    if is_in_thead:
        column_count = sum(
            1 for c in ctx.node.children if is_tag(c) and isinstance(c, Element) and c.name in ("th", "td")
        )
        separator = "| " + " | ".join("---" for _ in range(column_count)) + " |"
        return f"{row}\n{separator}\n"

    return f"{row}\n"


def _td_replacement(ctx: RuleContext) -> str:
    content = ctx.convert_children(ctx.node).strip().replace("|", "\\|").replace("\n", " ")

    # Add separator between cells (not before the first one)
    parent = ctx.node.parent
    prev_siblings = parent.children[: ctx.sibling_index] if parent is not None else []
    is_first_cell = not any(is_tag(c) and isinstance(c, Element) and c.name in ("th", "td") for c in prev_siblings)

    return content if is_first_cell else f" | {content}"
