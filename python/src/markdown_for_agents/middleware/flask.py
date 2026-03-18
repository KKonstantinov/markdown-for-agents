from __future__ import annotations

from typing import TYPE_CHECKING

from .._types import MiddlewareOptions
from ..core.content_signal import build_content_signal_header
from ..core.converter import convert

if TYPE_CHECKING:
    from flask import Flask


def markdown_after_request(app: Flask, options: MiddlewareOptions | None = None) -> None:
    """Register an after_request hook that converts HTML to markdown."""
    opts = options or MiddlewareOptions()

    @app.after_request
    def _convert_to_markdown(response):  # type: ignore[no-untyped-def]
        from flask import request

        # Always add Vary header
        existing = response.headers.get("Vary", "")
        response.headers["Vary"] = f"{existing}, Accept" if existing else "Accept"

        accept = request.headers.get("Accept", "")
        if "text/markdown" not in accept:
            return response

        content_type = response.headers.get("Content-Type", "")
        if "text/html" not in content_type:
            return response

        html_text = response.get_data(as_text=True)
        result = convert(
            html_text,
            extract=opts.extract,
            rules=list(opts.rules) if opts.rules else None,
            base_url=opts.base_url,
            heading_style=opts.heading_style,
            bullet_char=opts.bullet_char,
            code_block_style=opts.code_block_style,
            fence_char=opts.fence_char,
            strong_delimiter=opts.strong_delimiter,
            em_delimiter=opts.em_delimiter,
            link_style=opts.link_style,
            deduplicate=opts.deduplicate,
            frontmatter=opts.frontmatter,
            token_counter=opts.token_counter,
            server_timing=opts.server_timing,
        )

        response.set_data(result.markdown)
        response.headers["Content-Type"] = "text/markdown; charset=utf-8"
        response.headers[opts.token_header] = str(result.token_estimate.tokens)
        response.headers["ETag"] = f'"{result.content_hash}"'

        if result.convert_duration is not None:
            timing_value = f'mfa.convert;dur={result.convert_duration:.1f};desc="HTML to Markdown"'
            response.headers["Server-Timing"] = timing_value
            response.headers[opts.timing_header] = timing_value

        if opts.content_signal is not None:
            signal_value = build_content_signal_header(opts.content_signal)
            if signal_value:
                response.headers["Content-Signal"] = signal_value

        return response
