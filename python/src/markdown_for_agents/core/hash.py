from __future__ import annotations


def content_hash(s: str) -> str:
    """Fast, non-cryptographic FNV-1a hash for content fingerprinting."""
    h = 0x811C9DC5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f"{_to_base36(len(s))}-{_to_base36(h)}"


def _to_base36(n: int) -> str:
    """Convert a non-negative integer to base-36 string."""
    if n == 0:
        return "0"
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    result: list[str] = []
    while n > 0:
        n, remainder = divmod(n, 36)
        result.append(digits[remainder])
    return "".join(reversed(result))
