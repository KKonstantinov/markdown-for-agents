from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING, Literal, Protocol, TypedDict

if TYPE_CHECKING:
    from .dom.nodes import Document, Element


@dataclass(frozen=True, slots=True)
class TokenEstimate:
    """Token, character, and word counts for a piece of text."""

    tokens: int
    characters: int
    words: int


@dataclass(frozen=True, slots=True)
class ConvertResult:
    """Result returned by convert()."""

    markdown: str
    token_estimate: TokenEstimate
    content_hash: str
    convert_duration: float | None = None


class TokenCounter(Protocol):
    def __call__(self, text: str) -> TokenEstimate: ...


@dataclass(frozen=True, slots=True)
class ExtractOptions:
    """Options for the content extraction pass."""

    strip_tags: tuple[str, ...] = ()
    strip_classes: tuple[str, ...] = ()
    strip_roles: tuple[str, ...] = ()
    strip_ids: tuple[str, ...] = ()
    keep_header: bool = False
    keep_footer: bool = False
    keep_nav: bool = False


@dataclass(frozen=True, slots=True)
class DeduplicateOptions:
    """Options for the deduplication pass."""

    min_length: int = 10


@dataclass(frozen=True, slots=True)
class ContentSignalOptions:
    """Content-signal header options for publisher consent signals."""

    ai_train: bool | None = None
    search: bool | None = None
    ai_input: bool | None = None


# Sentinel for rule fall-through (Python equivalent of returning undefined in JS)
class _Sentinel:
    """Sentinel object used to signal rule fall-through."""

    __slots__ = ()

    def __repr__(self) -> str:
        return "SKIP"


SKIP = _Sentinel()
"""Sentinel value returned by a rule replacement to skip and try the next rule."""


@dataclass(slots=True)
class RuleContext:
    """Context object passed to a Rule replacement function."""

    node: Element
    parent: Element | Document | None
    convert_children: ConvertChildrenFn
    options: ResolvedOptions
    list_depth: int
    inside_pre: bool
    inside_table: bool
    sibling_index: int


ConvertChildrenFn = Callable[["Element | Document"], str]


# Type for rule filter
RuleFilter = str | list[str] | Callable[["Element"], bool]

# Type for rule replacement return
RuleResult = str | None | _Sentinel


class RuleReplacementFn(Protocol):
    def __call__(self, ctx: RuleContext) -> RuleResult: ...


@dataclass(frozen=True, slots=True)
class Rule:
    """A conversion rule that maps HTML elements to markdown output."""

    filter: RuleFilter
    replacement: RuleReplacementFn
    priority: int = 0


@dataclass(frozen=True, slots=True)
class ResolvedOptions:
    """Fully resolved options after merging user-supplied values with defaults."""

    extract: bool | ExtractOptions = False
    rules: tuple[Rule, ...] = ()
    base_url: str = ""
    heading_style: Literal["atx", "setext"] = "atx"
    bullet_char: Literal["-", "*", "+"] = "-"
    code_block_style: Literal["fenced", "indented"] = "fenced"
    fence_char: Literal["`", "~"] = "`"
    strong_delimiter: Literal["**", "__"] = "**"
    em_delimiter: Literal["*", "_"] = "*"
    link_style: Literal["inlined", "referenced"] = "inlined"
    deduplicate: bool | DeduplicateOptions = False
    frontmatter: bool | dict[str, str] = True
    token_counter: TokenCounter | None = None


class ConvertOptions(TypedDict, total=False):
    """Keyword arguments accepted by convert()."""

    extract: bool | ExtractOptions
    rules: list[Rule] | None
    base_url: str
    heading_style: Literal["atx", "setext"]
    bullet_char: Literal["-", "*", "+"]
    code_block_style: Literal["fenced", "indented"]
    fence_char: Literal["`", "~"]
    strong_delimiter: Literal["**", "__"]
    em_delimiter: Literal["*", "_"]
    link_style: Literal["inlined", "referenced"]
    deduplicate: bool | DeduplicateOptions
    frontmatter: bool | dict[str, str]
    token_counter: TokenCounter | None
    server_timing: bool


@dataclass(frozen=True, slots=True)
class MiddlewareOptions:
    """Options accepted by all framework middleware adapters."""

    extract: bool | ExtractOptions = False
    rules: tuple[Rule, ...] = ()
    base_url: str = ""
    heading_style: Literal["atx", "setext"] = "atx"
    bullet_char: Literal["-", "*", "+"] = "-"
    code_block_style: Literal["fenced", "indented"] = "fenced"
    fence_char: Literal["`", "~"] = "`"
    strong_delimiter: Literal["**", "__"] = "**"
    em_delimiter: Literal["*", "_"] = "*"
    link_style: Literal["inlined", "referenced"] = "inlined"
    deduplicate: bool | DeduplicateOptions = False
    frontmatter: bool | dict[str, str] = True
    token_counter: TokenCounter | None = None
    server_timing: bool = False
    token_header: str = "x-markdown-tokens"
    timing_header: str = "x-markdown-timing"
    content_signal: ContentSignalOptions | None = None
