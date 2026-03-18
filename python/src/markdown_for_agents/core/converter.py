from __future__ import annotations

import time

from .._types import (
    ConvertResult,
    DeduplicateOptions,
    ExtractOptions,
    ResolvedOptions,
    Rule,
)
from ..extract import extract_content
from ..rules import get_default_rules
from ..tokens import estimate_tokens
from .dedup import deduplicate_blocks
from .frontmatter import extract_metadata, serialize_frontmatter
from .hash import content_hash
from .parser import parse
from .renderer import render
from .walker import WalkerState, walk

_DEFAULTS = ResolvedOptions()


def convert(
    html: str,
    *,
    extract: bool | ExtractOptions = False,
    rules: list[Rule] | None = None,
    base_url: str = "",
    heading_style: str = "atx",
    bullet_char: str = "-",
    code_block_style: str = "fenced",
    fence_char: str = "`",
    strong_delimiter: str = "**",
    em_delimiter: str = "*",
    link_style: str = "inlined",
    deduplicate: bool | DeduplicateOptions = False,
    frontmatter: bool | dict[str, str] = True,
    token_counter: object | None = None,
    server_timing: bool = False,
) -> ConvertResult:
    """Convert an HTML string to markdown."""
    start = time.perf_counter() if server_timing else 0.0

    opts = ResolvedOptions(
        extract=extract,
        rules=tuple(rules) if rules else (),
        base_url=base_url,
        heading_style=heading_style,  # type: ignore[arg-type]
        bullet_char=bullet_char,  # type: ignore[arg-type]
        code_block_style=code_block_style,  # type: ignore[arg-type]
        fence_char=fence_char,  # type: ignore[arg-type]
        strong_delimiter=strong_delimiter,  # type: ignore[arg-type]
        em_delimiter=em_delimiter,  # type: ignore[arg-type]
        link_style=link_style,  # type: ignore[arg-type]
        deduplicate=deduplicate,
        frontmatter=frontmatter,
        token_counter=token_counter,  # type: ignore[arg-type]
    )

    document = parse(html)

    # Extract metadata from <head> before extract strips it
    frontmatter_block = ""
    if opts.frontmatter is not False:
        extracted = extract_metadata(document)
        user_fields = opts.frontmatter if isinstance(opts.frontmatter, dict) else {}
        merged = {**extracted, **user_fields}
        frontmatter_block = serialize_frontmatter(merged)

    if opts.extract:
        extract_opts = opts.extract if isinstance(opts.extract, ExtractOptions) else None
        extract_content(document, extract_opts)

    # Sort rules: user rules + defaults, highest priority first
    all_rules = sorted(
        list(opts.rules) + get_default_rules(),
        key=lambda r: r.priority,
        reverse=True,
    )

    raw = walk(
        document,
        WalkerState(
            options=opts,
            rules=all_rules,
            list_depth=0,
            inside_pre=False,
            inside_table=False,
        ),
    )

    md = render(raw)

    if opts.deduplicate:
        min_length = opts.deduplicate.min_length if isinstance(opts.deduplicate, DeduplicateOptions) else 10
        md = deduplicate_blocks(md, min_length)

    # Prepend frontmatter after render/dedup
    md = frontmatter_block + md

    token_est = opts.token_counter(md) if opts.token_counter is not None else estimate_tokens(md)

    convert_duration = (time.perf_counter() - start) * 1000 if server_timing else None

    return ConvertResult(
        markdown=md,
        token_estimate=token_est,
        content_hash=content_hash(md),
        convert_duration=convert_duration,
    )
