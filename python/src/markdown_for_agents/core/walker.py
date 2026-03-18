from __future__ import annotations

from dataclasses import dataclass

from .._types import SKIP, ResolvedOptions, Rule, RuleContext
from ..dom.nodes import Document, Element, Text, is_tag, is_text


@dataclass(slots=True)
class WalkerState:
    """Contextual state threaded through the depth-first DOM traversal."""

    options: ResolvedOptions
    rules: list[Rule]
    list_depth: int
    inside_pre: bool
    inside_table: bool


def walk(node: Document | Element, state: WalkerState) -> str:
    """Depth-first traversal applying matching rules to each element."""
    fragments: list[str] = []

    for i, child in enumerate(node.children):
        if is_text(child):
            assert isinstance(child, Text)
            fragments.append(_process_text(child, state))
            continue

        if is_tag(child):
            assert isinstance(child, Element)
            result = _apply_rules(child, i, node, state)
            if result is not None:
                if result and not state.inside_pre and not state.inside_table and _needs_separator(fragments, node, i):
                    fragments.append(" ")
                fragments.append(result)

    return "".join(fragments)


def _needs_separator(fragments: list[str], parent: Document | Element, current_index: int) -> bool:
    """Check if a whitespace separator should be injected between adjacent elements."""
    if not fragments:
        return False

    last = fragments[-1]
    if not last or last[-1:].isspace():
        return False

    # Walk backwards to find the previous sibling
    for j in range(current_index - 1, -1, -1):
        prev = parent.children[j]
        if is_text(prev):
            return False
        if is_tag(prev):
            return True

    return False


def _process_text(node: Text, state: WalkerState) -> str:
    """Convert a text node to its markdown string representation."""
    if state.inside_pre:
        return node.data
    if state.inside_table and node.data.strip() == "":
        return ""
    import re

    return re.sub(r"\s+", " ", node.data)


def _apply_rules(
    element: Element,
    sibling_index: int,
    parent: Element | Document,
    state: WalkerState,
) -> str | None:
    """Try each rule against an element in priority order."""
    for rule in state.rules:
        if not _matches_filter(rule.filter, element):
            continue

        def _convert(n: Document | Element, s: WalkerState = state, e: Element = element) -> str:
            return walk(n, _derive_state(e, s))

        context = RuleContext(
            node=element,
            parent=parent,
            convert_children=_convert,
            options=state.options,
            list_depth=state.list_depth,
            inside_pre=state.inside_pre,
            inside_table=state.inside_table,
            sibling_index=sibling_index,
        )

        result = rule.replacement(context)
        if result is not SKIP:
            return result  # type: ignore[return-value]

    return walk(element, _derive_state(element, state))


def _derive_state(element: Element, state: WalkerState) -> WalkerState:
    """Create a derived walker state when descending into pre/table/list elements."""
    name = element.name
    is_pre = name == "pre"
    is_table = name == "table"
    is_list = name in ("ul", "ol")

    if not is_pre and not is_table and not is_list:
        return state

    return WalkerState(
        options=state.options,
        rules=state.rules,
        inside_pre=state.inside_pre or is_pre,
        inside_table=state.inside_table or is_table,
        list_depth=state.list_depth + 1 if is_list else state.list_depth,
    )


def _matches_filter(filter_: str | list[str] | object, element: Element) -> bool:
    """Test whether an element matches a rule's filter."""
    if isinstance(filter_, str):
        return element.name == filter_
    if isinstance(filter_, list):
        return element.name in filter_
    if callable(filter_):
        return bool(filter_(element))
    return False
