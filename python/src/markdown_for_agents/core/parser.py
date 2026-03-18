from __future__ import annotations

from html.parser import HTMLParser

from ..dom.nodes import Document, Element, Text

VOID_ELEMENTS = frozenset(
    {
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    }
)

# Tags that implicitly close when a new instance opens
_AUTO_CLOSE_TAGS = frozenset({"p", "li", "dt", "dd", "option", "thead", "tbody", "tfoot", "tr", "th", "td"})


class _TreeBuilder(HTMLParser):
    """Builds a DOM tree from HTML using the stdlib html.parser."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.document = Document()
        self._stack: list[Element | Document] = [self.document]

    @property
    def _current(self) -> Element | Document:
        return self._stack[-1]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()

        # Implicitly close matching open tags
        if tag in _AUTO_CLOSE_TAGS:
            self._auto_close(tag)

        attribs = {k.lower(): (v if v is not None else "") for k, v in attrs}
        element = Element(name=tag, attribs=attribs, parent=self._current)
        self._current.children.append(element)

        if tag not in VOID_ELEMENTS:
            self._stack.append(element)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        # Walk up the stack to find the matching open tag
        for i in range(len(self._stack) - 1, 0, -1):
            node = self._stack[i]
            if isinstance(node, Element) and node.name == tag:
                self._stack[i:] = []
                return

    def handle_data(self, data: str) -> None:
        text = Text(data=data, parent=self._current)
        self._current.children.append(text)

    def handle_entityref(self, name: str) -> None:
        from html import unescape

        text = unescape(f"&{name};")
        self.handle_data(text)

    def handle_charref(self, name: str) -> None:
        from html import unescape

        text = unescape(f"&#{name};")
        self.handle_data(text)

    def _auto_close(self, tag: str) -> None:
        """Implicitly close the same tag if it's already open at the current level."""
        current = self._current
        if isinstance(current, Element) and current.name == tag:
            self._stack.pop()


def parse(html: str) -> Document:
    """Parse an HTML string into a DOM tree."""
    builder = _TreeBuilder()
    builder.feed(html)
    return builder.document
