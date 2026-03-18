from __future__ import annotations

import re

DEFAULT_STRIP_TAGS = [
    "nav",
    "footer",
    "header",
    "aside",
    "script",
    "style",
    "noscript",
    "template",
    "iframe",
    "svg",
    "form",
]

DEFAULT_STRIP_ROLES = [
    "navigation",
    "banner",
    "contentinfo",
    "complementary",
    "search",
    "menu",
    "menubar",
]

DEFAULT_STRIP_CLASSES: list[str | re.Pattern[str]] = [
    re.compile(r"\bad[s-]?\b", re.IGNORECASE),
    re.compile(r"\bsidebar\b", re.IGNORECASE),
    re.compile(r"\bwidget\b", re.IGNORECASE),
    re.compile(r"\bcookie", re.IGNORECASE),
    re.compile(r"\bpopup\b", re.IGNORECASE),
    re.compile(r"\bmodal\b", re.IGNORECASE),
    re.compile(r"\bbreadcrumb", re.IGNORECASE),
    re.compile(r"\bfootnote", re.IGNORECASE),
    re.compile(r"\bshare", re.IGNORECASE),
    re.compile(r"\bsocial", re.IGNORECASE),
    re.compile(r"\bnewsletter", re.IGNORECASE),
    re.compile(r"\bcomment", re.IGNORECASE),
    re.compile(r"\brelated", re.IGNORECASE),
    re.compile(r"\bcta\b", re.IGNORECASE),
    re.compile(r"\bcall-to-action", re.IGNORECASE),
    re.compile(r"\bauthor[-_]?(bio|card|info|box)\b", re.IGNORECASE),
    re.compile(r"\bavatar\b", re.IGNORECASE),
    re.compile(r"\bpagination\b", re.IGNORECASE),
    re.compile(r"\bprev[-_]?next\b", re.IGNORECASE),
    re.compile(r"\bpager\b", re.IGNORECASE),
    re.compile(r"\bpost[-_]?nav", re.IGNORECASE),
    re.compile(r"\barticle[-_]?nav", re.IGNORECASE),
    re.compile(r"\bback[-_]?link", re.IGNORECASE),
]

DEFAULT_STRIP_IDS: list[str | re.Pattern[str]] = [
    re.compile(r"\bad[s-]?\b", re.IGNORECASE),
    re.compile(r"\bsidebar\b", re.IGNORECASE),
    re.compile(r"\bcookie", re.IGNORECASE),
    re.compile(r"\bpopup\b", re.IGNORECASE),
    re.compile(r"\bmodal\b", re.IGNORECASE),
]
