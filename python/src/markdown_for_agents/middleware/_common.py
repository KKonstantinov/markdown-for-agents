from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Callable


def wants_markdown(accept: str) -> bool:
    """Check if the Accept header includes text/markdown."""
    return "text/markdown" in accept


def set_markdown_headers(
    set_header: Callable[[str, str], None],
    token_count: int,
    content_hash: str,
    token_header: str = "x-markdown-tokens",
    convert_duration: float | None = None,
    timing_header: str = "x-markdown-timing",
    content_signal: str | None = None,
) -> None:
    """Set standard markdown response headers using a set_header callback."""
    set_header("content-type", "text/markdown; charset=utf-8")
    set_header(token_header, str(token_count))
    set_header("etag", f'"{content_hash}"')
    if convert_duration is not None:
        timing_value = f'mfa.convert;dur={convert_duration:.1f};desc="HTML to Markdown"'
        set_header("server-timing", timing_value)
        set_header(timing_header, timing_value)
    if content_signal is not None:
        set_header("content-signal", content_signal)
