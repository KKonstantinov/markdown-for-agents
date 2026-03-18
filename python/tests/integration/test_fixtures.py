from markdown_for_agents import convert


class TestNestedLists:
    def test_converts_nested_unordered_lists(self, fixture):
        html = fixture("nested-lists.html")
        result = convert(html)

        assert "- Item one" in result.markdown
        assert "- Item two" in result.markdown
        assert "  - Nested A" in result.markdown
        assert "  - Nested B" in result.markdown
        assert "- Item three" in result.markdown


class TestCodeBlocks:
    def test_converts_fenced_code_block_with_language(self, fixture):
        html = fixture("code-blocks.html")
        result = convert(html)

        assert "```typescript" in result.markdown
        assert "function greet(name: string): string {" in result.markdown
        assert "```" in result.markdown

    def test_converts_inline_code_alongside_fenced_block(self, fixture):
        html = fixture("code-blocks.html")
        result = convert(html)

        assert "`inline code`" in result.markdown


class TestFullPage:
    def test_converts_full_page_without_extraction(self, fixture):
        html = fixture("full-page.html")
        result = convert(html)

        assert "Article Title" in result.markdown
        assert "main content" in result.markdown
        assert "Site Header" in result.markdown

    def test_extracts_main_content(self, fixture):
        html = fixture("full-page.html")
        result = convert(html, extract=True)

        assert "Article Title" in result.markdown
        assert "main content" in result.markdown
        assert "Site Header" not in result.markdown
        assert "Copyright" not in result.markdown


class TestTable:
    def test_produces_valid_gfm_table(self, fixture):
        html = fixture("table.html")
        result = convert(html)

        lines = result.markdown.strip().split("\n")
        assert len(lines) >= 4
        for line in lines:
            assert line.startswith("|")
            assert line.endswith("|")
