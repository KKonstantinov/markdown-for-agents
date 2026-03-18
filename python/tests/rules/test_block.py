import pytest

from markdown_for_agents import convert


class TestHeadings:
    def test_converts_h1_to_h6_atx_style(self):
        assert convert("<h1>Title</h1>").markdown == "# Title\n"
        assert convert("<h2>Sub</h2>").markdown == "## Sub\n"
        assert convert("<h3>H3</h3>").markdown == "### H3\n"
        assert convert("<h4>H4</h4>").markdown == "#### H4\n"
        assert convert("<h5>H5</h5>").markdown == "##### H5\n"
        assert convert("<h6>H6</h6>").markdown == "###### H6\n"

    def test_supports_setext_style(self):
        h1 = convert("<h1>Title</h1>", heading_style="setext")
        assert h1.markdown == "Title\n=====\n"

        h2 = convert("<h2>Sub</h2>", heading_style="setext")
        assert h2.markdown == "Sub\n---\n"

        # h3+ still uses atx
        h3 = convert("<h3>H3</h3>", heading_style="setext")
        assert h3.markdown == "### H3\n"

    def test_skips_empty_headings(self):
        assert convert("<h1></h1>").markdown == "\n"


class TestParagraphs:
    def test_converts_paragraphs(self):
        assert convert("<p>Hello</p>").markdown == "Hello\n"

    def test_separates_multiple_paragraphs(self):
        assert convert("<p>One</p><p>Two</p>").markdown == "One\n\nTwo\n"


class TestBlockquotes:
    def test_converts_blockquotes(self):
        result = convert("<blockquote><p>Quote</p></blockquote>")
        assert "> Quote" in result.markdown


class TestCodeBlocks:
    @pytest.mark.parametrize(
        "html, expected",
        [
            ('<pre><code class="language-js">const x = 1;</code></pre>', "```js\nconst x = 1;\n```"),
            ("<pre><code>plain code</code></pre>", "```\nplain code\n```"),
            ('<pre class="language-js"><code>const x = 1;</code></pre>', "```js\nconst x = 1;\n```"),
            ('<pre class="mermaid">graph TD\n  A-->B</pre>', "```mermaid\ngraph TD\n  A-->B\n```"),
            ('<pre class="language-mermaid">graph TD\n  A-->B</pre>', "```mermaid\ngraph TD\n  A-->B\n```"),
            (
                '<pre class="language-text"><code class="language-js">const x = 1;</code></pre>',
                "```js\nconst x = 1;\n```",
            ),
            ('<pre class="highlight">plain code</pre>', "```\nplain code\n```"),
        ],
    )
    def test_code_block_variations(self, html, expected):
        assert expected in convert(html).markdown


class TestHorizontalRules:
    def test_converts_hr_to_dashes(self):
        assert "---" in convert("<hr>").markdown


class TestLineBreaks:
    def test_converts_br_to_markdown_line_break(self):
        assert "line1  \nline2" in convert("<p>line1<br>line2</p>").markdown


class TestTildeFence:
    def test_uses_tilde_fence(self):
        result = convert('<pre><code class="language-py">x = 1</code></pre>', fence_char="~")
        assert "~~~py\nx = 1\n~~~" in result.markdown


class TestEmptyElements:
    def test_empty_p_produces_no_output(self):
        assert convert("<p></p>").markdown == "\n"

    def test_whitespace_only_p_produces_no_output(self):
        assert convert("<p>   </p>").markdown == "\n"


class TestMultiLineBlockquotes:
    def test_prefixes_each_line(self):
        result = convert("<blockquote><p>Line one</p><p>Line two</p></blockquote>")
        assert "> Line one" in result.markdown
        assert "> Line two" in result.markdown


class TestStrippedTags:
    def test_strips_noscript(self):
        result = convert("<p>Keep</p><noscript>No JS</noscript>")
        assert "Keep" in result.markdown
        assert "No JS" not in result.markdown

    def test_strips_template(self):
        result = convert("<p>Keep</p><template>Template</template>")
        assert "Keep" in result.markdown
        assert "Template" not in result.markdown


class TestMetadataStripping:
    def test_strips_head_and_contents(self):
        html = (
            "<html><head><title>Page Title</title>"
            "<meta name='desc' content='test'></head>"
            "<body><p>Content</p></body></html>"
        )
        result = convert(html, frontmatter=False)
        assert "Page Title" not in result.markdown
        assert "Content" in result.markdown

    def test_strips_standalone_title(self):
        result = convert("<title>My Title</title><p>Body</p>")
        assert "My Title" not in result.markdown
        assert "Body" in result.markdown

    def test_strips_meta_and_link_tags(self):
        result = convert('<meta charset="utf-8"><link rel="stylesheet" href="style.css"><p>Content</p>')
        assert "Content" in result.markdown
        assert "stylesheet" not in result.markdown
