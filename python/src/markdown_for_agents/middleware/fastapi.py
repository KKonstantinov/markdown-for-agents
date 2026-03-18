from __future__ import annotations

from typing import TYPE_CHECKING

from .._types import MiddlewareOptions
from ..core.content_signal import build_content_signal_header
from ..core.converter import convert

if TYPE_CHECKING:
    from starlette.types import ASGIApp, Receive, Scope, Send

_RESPONSE_START = "http.response.start"
_RESPONSE_BODY = "http.response.body"
_SKIP_HEADERS = {b"content-type", b"content-length"}


class MarkdownMiddleware:
    """ASGI middleware that converts HTML responses to markdown when Accept: text/markdown."""

    def __init__(self, app: ASGIApp, options: MiddlewareOptions | None = None) -> None:
        self.app = app
        self.options = options or MiddlewareOptions()

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        from starlette.requests import Request

        request = Request(scope, receive)
        accept = request.headers.get("accept", "")

        if "text/markdown" not in accept:
            await self.app(scope, receive, send)
            return

        response_headers: list[tuple[bytes, bytes]] = []
        body_parts: list[bytes] = []
        status_code = 200

        async def send_wrapper(message: dict) -> None:  # type: ignore[type-arg]
            nonlocal status_code

            if message["type"] == _RESPONSE_START:
                status_code = message.get("status", 200)
                response_headers.clear()
                response_headers.extend(message.get("headers", []))
                return

            if message["type"] != _RESPONSE_BODY:
                return

            body_parts.append(message.get("body", b""))

            if message.get("more_body", False):
                return

            full_body = b"".join(body_parts)
            headers_dict = {k.decode(): v.decode() for k, v in response_headers}
            content_type = headers_dict.get("content-type", "")

            if "text/html" in content_type:
                await _send_converted(send, full_body, headers_dict, response_headers, status_code, self.options)
            else:
                await _send_passthrough(send, full_body, headers_dict, response_headers, status_code)

        await self.app(scope, receive, send_wrapper)


def _add_vary_header(new_headers: list[tuple[bytes, bytes]], headers_dict: dict[str, str]) -> None:
    """Append Vary: Accept to the header list."""
    existing_vary = headers_dict.get("vary", "")
    vary = f"{existing_vary}, Accept" if existing_vary else "Accept"
    new_headers.append((b"vary", vary.encode()))


async def _send_converted(
    send: Send,
    full_body: bytes,
    headers_dict: dict[str, str],
    response_headers: list[tuple[bytes, bytes]],
    status_code: int,
    opts: MiddlewareOptions,
) -> None:
    """Convert HTML body to markdown and send the response."""
    html_text = full_body.decode("utf-8", errors="replace")
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

    md_bytes = result.markdown.encode("utf-8")

    new_headers: list[tuple[bytes, bytes]] = [(k, v) for k, v in response_headers if k.lower() not in _SKIP_HEADERS]

    new_headers.append((b"content-type", b"text/markdown; charset=utf-8"))
    new_headers.append((b"content-length", str(len(md_bytes)).encode()))
    new_headers.append((opts.token_header.encode(), str(result.token_estimate.tokens).encode()))
    new_headers.append((b"etag", f'"{result.content_hash}"'.encode()))
    _add_vary_header(new_headers, headers_dict)

    if result.convert_duration is not None:
        timing_value = f'mfa.convert;dur={result.convert_duration:.1f};desc="HTML to Markdown"'
        new_headers.append((b"server-timing", timing_value.encode()))
        new_headers.append((opts.timing_header.encode(), timing_value.encode()))

    if opts.content_signal is not None:
        signal_value = build_content_signal_header(opts.content_signal)
        if signal_value:
            new_headers.append((b"content-signal", signal_value.encode()))

    await send({"type": _RESPONSE_START, "status": status_code, "headers": new_headers})
    await send({"type": _RESPONSE_BODY, "body": md_bytes})


async def _send_passthrough(
    send: Send,
    full_body: bytes,
    headers_dict: dict[str, str],
    response_headers: list[tuple[bytes, bytes]],
    status_code: int,
) -> None:
    """Pass through non-HTML responses, adding Vary header."""
    new_headers = list(response_headers)
    _add_vary_header(new_headers, headers_dict)

    await send({"type": _RESPONSE_START, "status": status_code, "headers": new_headers})
    await send({"type": _RESPONSE_BODY, "body": full_body})
