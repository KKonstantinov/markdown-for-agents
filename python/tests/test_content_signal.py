from markdown_for_agents import ContentSignalOptions
from markdown_for_agents.core.content_signal import build_content_signal_header


class TestBuildContentSignalHeader:
    def test_all_true(self):
        opts = ContentSignalOptions(ai_train=True, search=True, ai_input=True)
        assert build_content_signal_header(opts) == "ai-train=yes, search=yes, ai-input=yes"

    def test_all_false(self):
        opts = ContentSignalOptions(ai_train=False, search=False, ai_input=False)
        assert build_content_signal_header(opts) == "ai-train=no, search=no, ai-input=no"

    def test_only_set_directives(self):
        assert build_content_signal_header(ContentSignalOptions(ai_train=True)) == "ai-train=yes"
        assert build_content_signal_header(ContentSignalOptions(search=False)) == "search=no"
        assert build_content_signal_header(ContentSignalOptions(ai_input=True)) == "ai-input=yes"

    def test_returns_none_when_empty(self):
        assert build_content_signal_header(ContentSignalOptions()) is None

    def test_mixed_values(self):
        opts = ContentSignalOptions(ai_train=True, search=False, ai_input=True)
        assert build_content_signal_header(opts) == "ai-train=yes, search=no, ai-input=yes"

    def test_ignores_none_values(self):
        opts = ContentSignalOptions(ai_train=True, search=None, ai_input=True)
        assert build_content_signal_header(opts) == "ai-train=yes, ai-input=yes"
