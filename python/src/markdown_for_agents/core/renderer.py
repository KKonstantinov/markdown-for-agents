from __future__ import annotations

import re


def render(raw: str) -> str:
    """Normalize raw markdown output into clean, well-formatted text."""
    # Normalize line endings to \n
    result = re.sub(r"\r\n?", "\n", raw)
    # Collapse whitespace-only lines into empty lines
    result = re.sub(r"\n[ \t]+\n", "\n\n", result)
    # Collapse 3+ consecutive newlines into 2
    result = re.sub(r"\n{3,}", "\n\n", result)
    # Trim trailing whitespace from each line, preserving intentional double-space
    lines = result.split("\n")
    processed: list[str] = []
    for line in lines:
        if re.search(r"\S {2}$", line):
            processed.append(line.rstrip() + "  ")
        else:
            processed.append(line.rstrip())
    result = "\n".join(processed)
    return result.strip() + "\n"
