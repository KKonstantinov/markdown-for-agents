from __future__ import annotations

import time
from typing import Unpack

from .._types import (
    ConvertOptions,
    ConvertResult,
    DeduplicateOptions,
    ExtractOptions,
    ResolvedOptions,
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


def convert(html: str, **options: Unpack[ConvertOptions]) -> ConvertResult:
    """Convert an HTML string to markdown."""
    raw: dict[str, object] = dict(options)
    server_timing = bool(raw.pop("server_timing", False))

    if not raw:
        return _run_pipeline(html, _DEFAULTS, server_timing)

    rules_list = raw.pop("rules", None)
    if rules_list is not None:
        raw["rules"] = tuple(rules_list)  # type: ignore[arg-type]

    opts = ResolvedOptions(**raw)  # type: ignore[arg-type]
    return _run_pipeline(html, opts, server_timing)


def _run_pipeline(html: str, opts: ResolvedOptions, server_timing: bool) -> ConvertResult:
    """Execute the 6-stage conversion pipeline."""
    start = time.perf_counter() if server_timing else 0.0

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
