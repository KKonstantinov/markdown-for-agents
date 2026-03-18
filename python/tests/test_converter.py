from markdown_for_agents import TokenEstimate, convert


class TestConvert:
    def test_converts_simple_html_to_markdown(self, fixture):
        html = fixture("simple.html")
        expected = fixture("simple.md")
        result = convert(html)
        assert result.markdown == expected

    def test_returns_token_estimate(self):
        result = convert("<p>Hello world</p>")
        assert result.token_estimate.tokens > 0
        assert result.token_estimate.characters > 0
        assert result.token_estimate.words > 0

    def test_handles_empty_input(self):
        result = convert("")
        assert result.markdown == "\n"

    def test_strips_script_and_style_tags(self):
        result = convert('<p>Hello</p><script>alert("xss")</script><style>.x{}</style><p>World</p>')
        assert "alert" not in result.markdown
        assert ".x{}" not in result.markdown
        assert "Hello" in result.markdown
        assert "World" in result.markdown

    def test_respects_custom_rules(self):
        from markdown_for_agents import Rule

        def custom_filter(node):
            return node.name == "div" and "note" in node.attribs.get("class", "")

        def custom_replacement(ctx):
            return f"\n\n> **Note:** {ctx.convert_children(ctx.node).strip()}\n\n"

        result = convert(
            '<div class="note">Important!</div>',
            rules=[Rule(filter=custom_filter, replacement=custom_replacement, priority=10)],
        )
        assert "> **Note:** Important!" in result.markdown


class TestContentHash:
    def test_returns_content_hash_string(self):
        result = convert("<p>Hello world</p>")
        assert isinstance(result.content_hash, str)
        assert len(result.content_hash) > 0

    def test_is_deterministic(self):
        a = convert("<p>Hello</p>")
        b = convert("<p>Hello</p>")
        assert a.content_hash == b.content_hash

    def test_differs_for_different_content(self):
        a = convert("<p>Hello</p>")
        b = convert("<p>World</p>")
        assert a.content_hash != b.content_hash


class TestFrontmatter:
    def test_prepends_frontmatter_with_title_and_description(self):
        html = (
            "<html><head><title>Hi</title>"
            '<meta name="description" content="Desc">'
            "</head><body><p>Text</p></body></html>"
        )
        result = convert(html)
        assert result.markdown.startswith("---\ntitle: Hi\ndescription: Desc\n---\n")
        assert "Text" in result.markdown

    def test_extracts_og_image(self):
        html = '<html><head><meta property="og:image" content="https://example.com/img.png"></head><body><p>Text</p></body></html>'
        result = convert(html)
        assert "image: https://example.com/img.png" in result.markdown

    def test_no_frontmatter_without_head(self):
        result = convert("<p>Hello</p>")
        assert "---" not in result.markdown

    def test_no_frontmatter_when_disabled(self):
        html = "<html><head><title>Hi</title></head><body><p>Text</p></body></html>"
        result = convert(html, frontmatter=False)
        assert "---" not in result.markdown
        assert "Text" in result.markdown

    def test_merges_custom_fields(self):
        html = "<html><head><title>Original</title></head><body><p>Text</p></body></html>"
        result = convert(html, frontmatter={"custom": "val"})
        assert "title: Original" in result.markdown
        assert "custom: val" in result.markdown

    def test_custom_fields_override_extracted(self):
        html = "<html><head><title>Original</title></head><body><p>Text</p></body></html>"
        result = convert(html, frontmatter={"title": "Override"})
        assert "title: Override" in result.markdown
        assert "title: Original" not in result.markdown

    def test_frontmatter_included_in_estimates(self):
        html = "<html><head><title>Hi</title></head><body><p>Text</p></body></html>"
        with_fm = convert(html)
        without_fm = convert(html, frontmatter=False)
        assert with_fm.token_estimate.characters > without_fm.token_estimate.characters
        assert with_fm.content_hash != without_fm.content_hash


class TestTokenCounter:
    def test_uses_custom_counter(self):
        call_count = 0

        def custom_counter(text):
            nonlocal call_count
            call_count += 1
            return TokenEstimate(tokens=42, characters=len(text), words=len(text.split()))

        result = convert("<p>Hello world</p>", token_counter=custom_counter)
        assert call_count == 1
        assert result.token_estimate.tokens == 42

    def test_passes_final_markdown_to_counter(self):
        received_text = ""

        def custom_counter(text):
            nonlocal received_text
            received_text = text
            return TokenEstimate(tokens=1, characters=len(text), words=0)

        result = convert("<h1>Title</h1>", token_counter=custom_counter)
        assert received_text == result.markdown

    def test_uses_builtin_heuristic_by_default(self):
        import math

        result = convert("<p>Hello world</p>")
        assert result.token_estimate.tokens == math.ceil(result.token_estimate.characters / 4)

    def test_returns_exact_values_from_custom_counter(self):
        def custom_counter(text):
            return TokenEstimate(tokens=100, characters=200, words=50)

        result = convert("<p>Some text</p>", token_counter=custom_counter)
        assert result.token_estimate.tokens == 100
        assert result.token_estimate.characters == 200
        assert result.token_estimate.words == 50
