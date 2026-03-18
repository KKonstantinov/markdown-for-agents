import math

from .._types import TokenEstimate


def estimate_tokens(text: str) -> TokenEstimate:
    """Estimate the token, character, and word counts for a string.

    Uses a fast heuristic of ~4 characters per token.
    """
    characters = len(text)
    words = len([w for w in text.split() if w])
    tokens = math.ceil(characters / 4) if characters > 0 else 0
    return TokenEstimate(tokens=tokens, characters=characters, words=words)
