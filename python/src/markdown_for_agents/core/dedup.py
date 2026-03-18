from __future__ import annotations

import re

_DEFAULT_MIN_LENGTH = 10
_HEADING_RE = re.compile(r"^#{1,6}\s")


def deduplicate_blocks(markdown: str, min_length: int = _DEFAULT_MIN_LENGTH) -> str:
    """Remove duplicate content blocks from rendered Markdown."""
    blocks = re.split(r"\n\n+", markdown)
    seen: set[str] = set()
    kept: list[str] = []

    i = 0
    while i < len(blocks):
        trimmed = blocks[i].strip()
        if not trimmed:
            i += 1
            continue

        if _HEADING_RE.match(trimmed):
            i = _process_heading_block(blocks, i, seen, min_length, kept)
            continue

        _process_content_block(blocks[i], trimmed, seen, min_length, kept)
        i += 1

    return "\n\n".join(kept).strip() + "\n"


def _normalize(text: str) -> str:
    """Lowercase text and collapse whitespace to produce a stable fingerprint."""
    return re.sub(r"\s+", " ", text.lower())


def _find_next_non_empty_index(blocks: list[str], start: int) -> int:
    """Scan forward to find the next non-empty block."""
    idx = start
    while idx < len(blocks) and not blocks[idx].strip():
        idx += 1
    return idx


def _is_duplicate(seen: set[str], fingerprint: str, min_length: int) -> bool:
    """Check whether a fingerprint has already been encountered."""
    return len(fingerprint) >= min_length and fingerprint in seen


def _register_fingerprint(seen: set[str], fingerprint: str, min_length: int) -> None:
    """Register a fingerprint for future duplicate detection."""
    if len(fingerprint) >= min_length:
        seen.add(fingerprint)


def _process_heading_block(blocks: list[str], i: int, seen: set[str], min_length: int, kept: list[str]) -> int:
    """Process a heading block together with its following content as a section."""
    trimmed = blocks[i].strip()
    next_idx = _find_next_non_empty_index(blocks, i + 1)
    next_trimmed = blocks[next_idx].strip() if next_idx < len(blocks) else ""
    has_content = next_trimmed != "" and not _HEADING_RE.match(next_trimmed)

    if not has_content:
        # Standalone heading -- always keep
        kept.append(blocks[i])
        return i + 1

    # Section: heading + content -> compound fingerprint
    section_fp = _normalize(trimmed + " " + next_trimmed)

    if _is_duplicate(seen, section_fp, min_length):
        return next_idx + 1

    _register_fingerprint(seen, section_fp, min_length)
    _register_fingerprint(seen, _normalize(next_trimmed), min_length)
    kept.append(blocks[i])
    kept.append(blocks[next_idx])
    return next_idx + 1


def _process_content_block(block: str, trimmed: str, seen: set[str], min_length: int, kept: list[str]) -> None:
    """Deduplicate a non-heading content block."""
    fingerprint = _normalize(trimmed)

    if _is_duplicate(seen, fingerprint, min_length):
        return

    _register_fingerprint(seen, fingerprint, min_length)
    kept.append(block)
