from markdown_for_agents.tokens import estimate_tokens


class TestEstimateTokens:
    def test_returns_counts(self):
        result = estimate_tokens("Hello world, this is a test.")
        assert result.characters == 28
        assert result.words == 6
        assert result.tokens > 0

    def test_handles_empty_string(self):
        result = estimate_tokens("")
        assert result.characters == 0
        assert result.words == 0
        assert result.tokens == 0

    def test_handles_whitespace_only(self):
        result = estimate_tokens("   \t\n  ")
        assert result.characters == 7
        assert result.words == 0
        assert result.tokens > 0

    def test_counts_characters_by_length(self):
        result = estimate_tokens("Hello")
        assert result.characters == 5
        assert result.tokens == 2
