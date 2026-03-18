from __future__ import annotations

from urllib.parse import urljoin

from .._types import Rule, RuleContext
from ..dom.nodes import Text

inline_rules: list[Rule] = [
    Rule(
        filter=["strong", "b"],
        replacement=lambda ctx: _strong_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter=["em", "i"],
        replacement=lambda ctx: _em_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter=["del", "s", "strike"],
        replacement=lambda ctx: _del_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter="code",
        replacement=lambda ctx: _code_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter="a",
        replacement=lambda ctx: _a_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter="img",
        replacement=lambda ctx: _img_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter=["abbr", "mark"],
        replacement=lambda ctx: ctx.convert_children(ctx.node),
        priority=0,
    ),
    Rule(
        filter="sub",
        replacement=lambda ctx: _sub_replacement(ctx),
        priority=0,
    ),
    Rule(
        filter="sup",
        replacement=lambda ctx: _sup_replacement(ctx),
        priority=0,
    ),
]


def _strong_replacement(ctx: RuleContext) -> str | None:
    content = ctx.convert_children(ctx.node).strip()
    if not content:
        return None
    d = ctx.options.strong_delimiter
    return f"{d}{content}{d}"


def _em_replacement(ctx: RuleContext) -> str | None:
    content = ctx.convert_children(ctx.node).strip()
    if not content:
        return None
    d = ctx.options.em_delimiter
    return f"{d}{content}{d}"


def _del_replacement(ctx: RuleContext) -> str | None:
    content = ctx.convert_children(ctx.node).strip()
    if not content:
        return None
    return f"~~{content}~~"


def _code_replacement(ctx: RuleContext) -> str | None:
    from .._types import SKIP as _SKIP

    if ctx.inside_pre:
        return _SKIP  # type: ignore[return-value]
    text = "".join(c.data if isinstance(c, Text) else "" for c in ctx.node.children)
    if not text:
        return None
    # Use double backticks if content contains a backtick
    delimiter = "``" if "`" in text else "`"
    padded = f" {text} " if text.startswith("`") or text.endswith("`") else text
    return f"{delimiter}{padded}{delimiter}"


def _a_replacement(ctx: RuleContext) -> str | None:
    href = ctx.node.attribs.get("href", "")
    content = ctx.convert_children(ctx.node).strip()
    if not content:
        return None

    resolved_href = href
    if ctx.options.base_url and href and not href.startswith("http") and not href.startswith("#"):
        resolved_href = urljoin(ctx.options.base_url, href)

    title = ctx.node.attribs.get("title")
    if title:
        return f'[{content}]({resolved_href} "{title}")'
    return f"[{content}]({resolved_href})"


def _img_replacement(ctx: RuleContext) -> str:
    src = ctx.node.attribs.get("src", "")
    alt = ctx.node.attribs.get("alt", "")
    title = ctx.node.attribs.get("title")

    resolved_src = src
    if ctx.options.base_url and src and not src.startswith("http") and not src.startswith("data:"):
        resolved_src = urljoin(ctx.options.base_url, src)

    if title:
        return f'![{alt}]({resolved_src} "{title}")'
    return f"![{alt}]({resolved_src})"


def _sub_replacement(ctx: RuleContext) -> str | None:
    content = ctx.convert_children(ctx.node).strip()
    if not content:
        return None
    return f"~{content}~"


def _sup_replacement(ctx: RuleContext) -> str | None:
    content = ctx.convert_children(ctx.node).strip()
    if not content:
        return None
    return f"^{content}^"
