from __future__ import annotations


class Text:
    """A text node in the DOM tree."""

    __slots__ = ("data", "parent")

    def __init__(self, data: str, parent: Element | Document | None = None) -> None:
        self.data = data
        self.parent = parent

    def __repr__(self) -> str:
        return f"Text({self.data!r})"


class Element:
    """An element node in the DOM tree."""

    __slots__ = ("name", "attribs", "children", "parent")

    def __init__(
        self,
        name: str,
        attribs: dict[str, str] | None = None,
        children: list[Element | Text] | None = None,
        parent: Element | Document | None = None,
    ) -> None:
        self.name = name
        self.attribs = attribs if attribs is not None else {}
        self.children: list[Element | Text] = children if children is not None else []
        self.parent = parent

    def __repr__(self) -> str:
        return f"Element({self.name!r})"


class Document:
    """The root document node."""

    __slots__ = ("children",)

    def __init__(self, children: list[Element | Text] | None = None) -> None:
        self.children: list[Element | Text] = children if children is not None else []

    def __repr__(self) -> str:
        return f"Document({len(self.children)} children)"


Node = Element | Text


def is_tag(node: Element | Text | Document) -> bool:
    """Check if a node is an Element."""
    return isinstance(node, Element)


def is_text(node: Element | Text | Document) -> bool:
    """Check if a node is a Text node."""
    return isinstance(node, Text)
