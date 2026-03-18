from markdown_for_agents.core.frontmatter import extract_metadata, serialize_frontmatter
from markdown_for_agents.core.parser import parse


class TestExtractMetadata:
    def test_extracts_title(self):
        doc = parse("<html><head><title>My Page</title></head><body></body></html>")
        assert extract_metadata(doc) == {"title": "My Page"}

    def test_extracts_description(self):
        doc = parse('<html><head><meta name="description" content="A great page"></head><body></body></html>')
        assert extract_metadata(doc) == {"description": "A great page"}

    def test_extracts_og_image(self):
        doc = parse(
            '<html><head><meta property="og:image" content="https://example.com/img.png"></head><body></body></html>'
        )
        assert extract_metadata(doc) == {"image": "https://example.com/img.png"}

    def test_extracts_all_three_fields(self):
        doc = parse("""
            <html><head>
                <title>Title</title>
                <meta name="description" content="Desc">
                <meta property="og:image" content="https://img.example.com/photo.jpg">
            </head><body></body></html>
        """)
        assert extract_metadata(doc) == {
            "title": "Title",
            "description": "Desc",
            "image": "https://img.example.com/photo.jpg",
        }

    def test_handles_bare_head(self):
        doc = parse("<head><title>Bare</title></head><body><p>Text</p></body>")
        assert extract_metadata(doc) == {"title": "Bare"}

    def test_returns_empty_without_head(self):
        doc = parse("<p>No head here</p>")
        assert extract_metadata(doc) == {}

    def test_skips_empty_content(self):
        doc = parse('<html><head><title></title><meta name="description" content=""></head><body></body></html>')
        assert extract_metadata(doc) == {}

    def test_trims_whitespace_from_title(self):
        doc = parse("<html><head><title>  Spaced Title  </title></head><body></body></html>")
        assert extract_metadata(doc) == {"title": "Spaced Title"}

    def test_case_insensitive_meta_name(self):
        doc = parse('<html><head><meta name="Description" content="Caps"></head><body></body></html>')
        assert extract_metadata(doc) == {"description": "Caps"}


class TestSerializeFrontmatter:
    def test_returns_empty_for_empty_record(self):
        assert serialize_frontmatter({}) == ""

    def test_serializes_single_field(self):
        assert serialize_frontmatter({"title": "Hello"}) == "---\ntitle: Hello\n---\n"

    def test_orders_priority_fields_first(self):
        result = serialize_frontmatter(
            {
                "image": "https://example.com/img.png",
                "title": "Title",
                "description": "Desc",
            }
        )
        lines = result.split("\n")
        assert lines[1] == "title: Title"
        assert lines[2] == "description: Desc"
        assert lines[3] == "image: https://example.com/img.png"

    def test_sorts_remaining_keys_alphabetically(self):
        result = serialize_frontmatter({"title": "T", "zebra": "z", "alpha": "a"})
        lines = result.split("\n")
        assert lines[1] == "title: T"
        assert lines[2] == "alpha: a"
        assert lines[3] == "zebra: z"

    def test_quotes_values_with_colons(self):
        result = serialize_frontmatter({"title": "Key: Value"})
        assert 'title: "Key: Value"' in result

    def test_quotes_values_with_hash(self):
        result = serialize_frontmatter({"title": "Color #fff"})
        assert 'title: "Color #fff"' in result

    def test_quotes_values_with_double_quotes(self):
        result = serialize_frontmatter({"title": 'Say "hello"'})
        assert r'title: "Say \"hello\""' in result

    def test_quotes_values_with_leading_whitespace(self):
        result = serialize_frontmatter({"title": " leading"})
        assert 'title: " leading"' in result

    def test_quotes_values_with_trailing_whitespace(self):
        result = serialize_frontmatter({"title": "trailing "})
        assert 'title: "trailing "' in result

    def test_does_not_quote_simple_values(self):
        result = serialize_frontmatter({"title": "Simple Title"})
        assert "title: Simple Title" in result
        assert '"' not in result

    def test_escapes_backslashes_in_quoted_values(self):
        result = serialize_frontmatter({"title": "path\\to"})
        assert 'title: "path\\\\to"' in result
