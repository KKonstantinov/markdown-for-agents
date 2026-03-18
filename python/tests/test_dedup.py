from markdown_for_agents import convert
from markdown_for_agents.core.dedup import deduplicate_blocks


class TestDeduplicateBlocks:
    def test_removes_exact_duplicate_blocks(self):
        input_md = "## Article Title\n\nSome content here.\n\n## Article Title\n\nSome content here.\n"
        assert deduplicate_blocks(input_md) == "## Article Title\n\nSome content here.\n"

    def test_preserves_unique_blocks(self):
        input_md = "## First\n\nContent one.\n\n## Second\n\nContent two.\n"
        assert deduplicate_blocks(input_md) == "## First\n\nContent one.\n\n## Second\n\nContent two.\n"

    def test_case_insensitive_content_blocks(self):
        input_md = "Some content block here.\n\nSOME CONTENT BLOCK HERE.\n"
        assert deduplicate_blocks(input_md) == "Some content block here.\n"

    def test_case_insensitive_sections(self):
        input_md = "## Article Title\n\nSome content here.\n\n## ARTICLE TITLE\n\nSOME CONTENT HERE.\n"
        assert deduplicate_blocks(input_md) == "## Article Title\n\nSome content here.\n"

    def test_normalizes_whitespace(self):
        input_md = "Some  spaced   content here.\n\nSome spaced content here.\n"
        assert deduplicate_blocks(input_md) == "Some  spaced   content here.\n"

    def test_preserves_short_blocks(self):
        input_md = "---\n\nContent\n\n---\n"
        assert deduplicate_blocks(input_md) == "---\n\nContent\n\n---\n"

    def test_preserves_first_occurrence(self):
        input_md = (
            "## Featured\n\n## Article Title\n\nDescription text.\n\n"
            "## All Articles\n\n## Article Title\n\nDescription text.\n"
        )
        result = deduplicate_blocks(input_md)
        assert "## Featured" in result
        assert "## All Articles" in result
        assert result.count("## Article Title") == 1
        assert result.count("Description text.") == 1

    def test_preserves_repeated_headings_with_different_content(self):
        input_md = (
            "## Service A\n\n### The situation\n\nCompany needed help with marketing.\n\n"
            "## Service B\n\n### The situation\n\nCompany needed help with technology.\n"
        )
        result = deduplicate_blocks(input_md)
        assert result.count("### The situation") == 2
        assert "marketing" in result
        assert "technology" in result

    def test_removes_repeated_headings_with_identical_content(self):
        input_md = (
            "## Service A\n\n### The situation\n\nSame description for both services.\n\n"
            "## Service B\n\n### The situation\n\nSame description for both services.\n"
        )
        result = deduplicate_blocks(input_md)
        assert result.count("### The situation") == 1
        assert "## Service A" in result
        assert "## Service B" in result

    def test_always_preserves_standalone_headings(self):
        input_md = "## Heading One\n\n## Heading One\n\nSome content here.\n"
        result = deduplicate_blocks(input_md)
        assert result == "## Heading One\n\n## Heading One\n\nSome content here.\n"

    def test_handles_empty_input(self):
        assert deduplicate_blocks("") == "\n"
        assert deduplicate_blocks("\n\n") == "\n"


class TestDeduplicateCustomMinLength:
    def test_deduplicates_short_blocks_with_lower_min_length(self):
        input_md = "Content\n\nContent\n"
        assert deduplicate_blocks(input_md) == "Content\n\nContent\n"
        assert deduplicate_blocks(input_md, 5) == "Content\n"

    def test_preserves_longer_blocks_with_higher_min_length(self):
        input_md = "Some content here.\n\nSome content here.\n"
        assert deduplicate_blocks(input_md) == "Some content here.\n"
        assert deduplicate_blocks(input_md, 50) == "Some content here.\n\nSome content here.\n"

    def test_applies_min_length_to_section_fingerprints(self):
        input_md = "## Hi\n\nShort.\n\n## Hi\n\nShort.\n"
        assert deduplicate_blocks(input_md) == "## Hi\n\nShort.\n"
        assert deduplicate_blocks(input_md, 50) == "## Hi\n\nShort.\n\n## Hi\n\nShort.\n"


class TestConvertWithDeduplicate:
    def test_does_not_deduplicate_by_default(self):
        html = "<p>Duplicate paragraph content here.</p><p>Unique</p><p>Duplicate paragraph content here.</p>"
        result = convert(html)
        assert result.markdown.count("Duplicate paragraph content here.") == 2

    def test_removes_duplicate_blocks(self):
        html = "<p>Duplicate paragraph content here.</p><p>Unique</p><p>Duplicate paragraph content here.</p>"
        result = convert(html, deduplicate=True)
        assert result.markdown.count("Duplicate paragraph content here.") == 1
        assert "Unique" in result.markdown

    def test_deduplicates_heading_content_combos(self):
        html = """
            <section>
                <h2>Featured Article</h2>
                <p>This is the article description that is long enough to be deduplicated.</p>
            </section>
            <section>
                <h2>All Articles</h2>
                <h2>Featured Article</h2>
                <p>This is the article description that is long enough to be deduplicated.</p>
            </section>
        """
        result = convert(html, deduplicate=True)
        assert result.markdown.count("## Featured Article") == 1
        assert "## All Articles" in result.markdown

    def test_preserves_short_duplicates(self):
        html = "<hr><p>Content</p><hr>"
        result = convert(html, deduplicate=True)
        assert result.markdown.count("---") == 2

    def test_preserves_repeated_structural_headings_different_content(self):
        html = """
            <section>
                <h2>Service A</h2>
                <h3>The situation</h3>
                <p>Company needed help with their marketing strategy and brand.</p>
            </section>
            <section>
                <h2>Service B</h2>
                <h3>The situation</h3>
                <p>Company needed help with their technology infrastructure setup.</p>
            </section>
        """
        result = convert(html, deduplicate=True)
        assert result.markdown.count("### The situation") == 2
        assert "marketing" in result.markdown
        assert "technology" in result.markdown

    def test_token_estimate_reflects_deduplication(self):
        html = "<p>Some repeated content block.</p><p>Some repeated content block.</p>"
        original = convert(html)
        deduped = convert(html, deduplicate=True)
        assert deduped.token_estimate.tokens < original.token_estimate.tokens

    def test_custom_min_length(self):
        html = "<p>Read more</p><p>Main content that is long enough.</p><p>Read more</p>"
        default_dedup = convert(html, deduplicate=True)
        from markdown_for_agents import DeduplicateOptions

        custom_dedup = convert(html, deduplicate=DeduplicateOptions(min_length=5))

        assert default_dedup.markdown.count("Read more") == 2
        assert custom_dedup.markdown.count("Read more") == 1

    def test_uses_default_min_length_when_empty(self):
        html = "<p>Duplicate paragraph content here.</p><p>Unique</p><p>Duplicate paragraph content here.</p>"
        from markdown_for_agents import DeduplicateOptions

        with_true = convert(html, deduplicate=True)
        with_empty = convert(html, deduplicate=DeduplicateOptions())
        assert with_true.markdown == with_empty.markdown
