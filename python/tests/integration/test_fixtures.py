from markdown_for_agents import convert, create_rule, estimate_tokens


class TestBasicConversion:
    def test_converts_basic_html(self):
        result = convert("<h1>Hello</h1><p>World</p>")
        assert "# Hello" in result.markdown
        assert "World" in result.markdown

    def test_returns_token_estimates(self):
        result = convert("<p>Test content here</p>")
        assert result.token_estimate.tokens > 0
        assert result.token_estimate.characters > 0
        assert result.token_estimate.words > 0

    def test_supports_content_extraction(self):
        html = """
        <nav><a href="/">Home</a></nav>
        <main><p>Content</p></main>
        <footer>Footer</footer>
        """
        result = convert(html, extract=True)
        assert "Content" in result.markdown
        assert "Home" not in result.markdown
        assert "Footer" not in result.markdown


class TestCustomRules:
    def test_custom_rule_via_create_rule(self):
        rule = create_rule(
            filter=lambda node: node.name == "div" and "alert" in (node.attribs.get("class", "")),
            replacement=lambda ctx: f"\n\n> {ctx.convert_children(ctx.node).strip()}\n\n",
            priority=100,
        )
        result = convert('<div class="alert">Warning!</div>', rules=[rule])
        assert "> Warning!" in result.markdown


class TestStandaloneEstimateTokens:
    def test_estimate_tokens_standalone(self):
        result = estimate_tokens("Hello world")
        assert result.characters == 11
        assert result.tokens > 0


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
