from __future__ import annotations

from typing import TYPE_CHECKING

from .._types import MiddlewareOptions
from ..core.content_signal import build_content_signal_header
from ..core.converter import convert

if TYPE_CHECKING:
    from django.http import HttpRequest, HttpResponse


class MarkdownMiddleware:
    """Django middleware that converts HTML responses to markdown when Accept: text/markdown."""

    def __init__(self, get_response: object, options: MiddlewareOptions | None = None) -> None:
        self.get_response = get_response  # type: ignore[assignment]
        self.options = options or MiddlewareOptions()

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)  # type: ignore[operator]

        # Always add Vary header
        existing = response.get("Vary", "")
        response["Vary"] = f"{existing}, Accept" if existing else "Accept"

        accept = request.META.get("HTTP_ACCEPT", "")
        if "text/markdown" not in accept:
            return response  # type: ignore[return-value]

        content_type = response.get("Content-Type", "")
        if "text/html" not in content_type:
            return response  # type: ignore[return-value]

        opts = self.options
        html_text = response.content.decode("utf-8", errors="replace")
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

        response.content = result.markdown.encode("utf-8")
        response["Content-Type"] = "text/markdown; charset=utf-8"
        response[opts.token_header] = str(result.token_estimate.tokens)
        response["ETag"] = f'"{result.content_hash}"'

        if result.convert_duration is not None:
            timing_value = f'mfa.convert;dur={result.convert_duration:.1f};desc="HTML to Markdown"'
            response["Server-Timing"] = timing_value
            response[opts.timing_header] = timing_value

        if opts.content_signal is not None:
            signal_value = build_content_signal_header(opts.content_signal)
            if signal_value:
                response["Content-Signal"] = signal_value

        return response  # type: ignore[return-value]
