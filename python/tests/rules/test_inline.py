from markdown_for_agents import convert


class TestStrongBold:
    def test_converts_strong(self):
        assert "**bold**" in convert("<strong>bold</strong>").markdown

    def test_converts_b(self):
        assert "**bold**" in convert("<b>bold</b>").markdown

    def test_supports_underscore_delimiter(self):
        result = convert("<strong>bold</strong>", strong_delimiter="__")
        assert "__bold__" in result.markdown


class TestEmphasis:
    def test_converts_em(self):
        assert "*italic*" in convert("<em>italic</em>").markdown

    def test_converts_i(self):
        assert "*italic*" in convert("<i>italic</i>").markdown


class TestStrikethrough:
    def test_converts_del(self):
        assert "~~removed~~" in convert("<del>removed</del>").markdown

    def test_converts_s(self):
        assert "~~struck~~" in convert("<s>struck</s>").markdown


class TestInlineCode:
    def test_converts_code_to_backticks(self):
        assert "`x`" in convert("<code>x</code>").markdown

    def test_uses_double_backticks_for_backtick_content(self):
        assert "``a`b``" in convert("<code>a`b</code>").markdown


class TestLinks:
    def test_converts_a_to_markdown_link(self):
        result = convert('<a href="https://example.com">Example</a>')
        assert "[Example](https://example.com)" in result.markdown

    def test_includes_title(self):
        result = convert('<a href="https://example.com" title="My Title">Example</a>')
        assert '[Example](https://example.com "My Title")' in result.markdown

    def test_resolves_relative_urls(self):
        result = convert('<a href="/about">About</a>', base_url="https://example.com")
        assert "[About](https://example.com/about)" in result.markdown


class TestImages:
    def test_converts_img_to_markdown_image(self):
        result = convert('<img src="https://example.com/img.png" alt="Photo">')
        assert "![Photo](https://example.com/img.png)" in result.markdown

    def test_handles_missing_alt(self):
        result = convert('<img src="https://example.com/img.png">')
        assert "![](https://example.com/img.png)" in result.markdown

    def test_includes_title(self):
        result = convert('<img src="https://example.com/img.png" alt="Photo" title="My Image">')
        assert '![Photo](https://example.com/img.png "My Image")' in result.markdown

    def test_resolves_relative_src(self):
        result = convert('<img src="/logo.png" alt="Logo">', base_url="https://example.com")
        assert "![Logo](https://example.com/logo.png)" in result.markdown

    def test_does_not_resolve_data_urls(self):
        result = convert('<img src="data:image/png;base64,abc" alt="Inline">', base_url="https://example.com")
        assert "![Inline](data:image/png;base64,abc)" in result.markdown


class TestStrikethroughAliases:
    def test_converts_strike(self):
        assert "~~old~~" in convert("<strike>old</strike>").markdown


class TestEmDelimiterOption:
    def test_supports_underscore_delimiter(self):
        result = convert("<em>italic</em>", em_delimiter="_")
        assert "_italic_" in result.markdown


class TestSubscriptSuperscript:
    def test_converts_sub(self):
        assert "H~2~O" in convert("<p>H<sub>2</sub>O</p>").markdown

    def test_converts_sup(self):
        assert "x^2^" in convert("<p>x<sup>2</sup></p>").markdown

    def test_empty_sub_produces_no_output(self):
        assert convert("<p>H<sub></sub>O</p>").markdown == "HO\n"

    def test_empty_sup_produces_no_output(self):
        assert convert("<p>x<sup></sup></p>").markdown == "x\n"


class TestAbbrMarkPassThrough:
    def test_passes_through_abbr(self):
        result = convert("<p>Use <abbr>HTML</abbr></p>")
        assert "HTML" in result.markdown

    def test_passes_through_mark(self):
        result = convert("<p>This is <mark>important</mark></p>")
        assert "important" in result.markdown


class TestEmptyInlineElements:
    def test_empty_strong(self):
        assert convert("<p>a<strong></strong>b</p>").markdown == "ab\n"

    def test_empty_em(self):
        assert convert("<p>a<em></em>b</p>").markdown == "ab\n"

    def test_empty_a(self):
        assert convert('<p>before<a href="https://x.com"></a>after</p>').markdown == "beforeafter\n"


class TestLinksEdgeCases:
    def test_does_not_resolve_hash_only_href(self):
        result = convert('<a href="#section">Jump</a>', base_url="https://example.com")
        assert "[Jump](#section)" in result.markdown

    def test_does_not_resolve_absolute_http_urls(self):
        result = convert('<a href="https://other.com/page">Link</a>', base_url="https://example.com")
        assert "[Link](https://other.com/page)" in result.markdown
