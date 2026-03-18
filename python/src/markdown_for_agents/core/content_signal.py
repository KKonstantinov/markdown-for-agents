from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .._types import ContentSignalOptions


def build_content_signal_header(options: ContentSignalOptions) -> str | None:
    """Build the value for a content-signal HTTP header from the given options."""
    parts: list[str] = []

    if options.ai_train is not None:
        parts.append(f"ai-train={'yes' if options.ai_train else 'no'}")
    if options.search is not None:
        parts.append(f"search={'yes' if options.search else 'no'}")
    if options.ai_input is not None:
        parts.append(f"ai-input={'yes' if options.ai_input else 'no'}")

    return ", ".join(parts) if parts else None
