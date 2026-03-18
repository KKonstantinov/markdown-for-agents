from __future__ import annotations

from .._types import Rule, RuleContext
from .block import block_rules
from .inline import inline_rules
from .list_ import list_rules
from .table import table_rules

_cached: list[Rule] | None = None


def get_default_rules() -> list[Rule]:
    """Return the built-in conversion rules (block, inline, list, table)."""
    global _cached
    if _cached is None:
        _cached = [*block_rules, *inline_rules, *list_rules, *table_rules]
    return _cached


def create_rule(
    filter: str | list[str],
    replacement: object,
    priority: int = 100,
) -> Rule:
    """Convenience factory for creating a Rule."""
    return Rule(filter=filter, replacement=replacement, priority=priority)  # type: ignore[arg-type]


__all__ = ["get_default_rules", "create_rule", "Rule", "RuleContext"]
