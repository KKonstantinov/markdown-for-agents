from markdown_for_agents.core.renderer import render


class TestRender:
    def test_normalizes_crlf_to_lf(self):
        assert render("line1\r\nline2\r\n") == "line1\nline2\n"

    def test_normalizes_standalone_cr_to_lf(self):
        assert render("line1\rline2") == "line1\nline2\n"

    def test_collapses_whitespace_only_lines(self):
        assert render("a\n   \nb") == "a\n\nb\n"

    def test_collapses_3_plus_newlines_to_2(self):
        assert render("a\n\n\n\nb") == "a\n\nb\n"

    def test_trims_trailing_whitespace(self):
        assert render("hello   \nworld  ") == "hello\nworld\n"

    def test_preserves_trailing_double_space(self):
        assert render("line1  \nline2") == "line1  \nline2\n"

    def test_trims_output_and_appends_newline(self):
        assert render("\n\n  hello  \n\n") == "hello\n"

    def test_handles_empty_input(self):
        assert render("") == "\n"
