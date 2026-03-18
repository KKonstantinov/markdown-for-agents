"""Runtime-agnostic HTML to Markdown converter built for AI agents."""

from ._types import (
    SKIP,
    ContentSignalOptions,
    ConvertOptions,
    ConvertResult,
    DeduplicateOptions,
    ExtractOptions,
    MiddlewareOptions,
    ResolvedOptions,
    Rule,
    RuleContext,
    TokenEstimate,
)
from .core.content_signal import build_content_signal_header
from .core.converter import convert
from .extract import extract_content
from .rules import create_rule, get_default_rules
from .tokens import estimate_tokens

__all__ = [
    "build_content_signal_header",
    "convert",
    "create_rule",
    "extract_content",
    "estimate_tokens",
    "get_default_rules",
    "ContentSignalOptions",
    "ConvertOptions",
    "ConvertResult",
    "DeduplicateOptions",
    "ExtractOptions",
    "MiddlewareOptions",
    "ResolvedOptions",
    "Rule",
    "RuleContext",
    "SKIP",
    "TokenEstimate",
]
