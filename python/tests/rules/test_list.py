from markdown_for_agents import convert


class TestListRules:
    def test_converts_unordered_lists(self):
        result = convert("<ul><li>A</li><li>B</li><li>C</li></ul>")
        assert "- A" in result.markdown
        assert "- B" in result.markdown
        assert "- C" in result.markdown

    def test_converts_ordered_lists(self):
        result = convert("<ol><li>First</li><li>Second</li></ol>")
        assert "1. First" in result.markdown
        assert "2. Second" in result.markdown

    def test_respects_ol_start_attribute(self):
        result = convert('<ol start="5"><li>Five</li><li>Six</li></ol>')
        assert "5. Five" in result.markdown
        assert "6. Six" in result.markdown

    def test_handles_nested_lists(self):
        html = """
        <ul>
            <li>Parent
                <ul>
                    <li>Child A</li>
                    <li>Child B</li>
                </ul>
            </li>
            <li>Sibling</li>
        </ul>
        """
        result = convert(html)
        assert "- Parent" in result.markdown
        assert "  - Child A" in result.markdown
        assert "  - Child B" in result.markdown
        assert "- Sibling" in result.markdown

    def test_supports_custom_bullet_char(self):
        result = convert("<ul><li>Item</li></ul>", bullet_char="*")
        assert "* Item" in result.markdown

    def test_handles_empty_list(self):
        assert convert("<ul></ul>").markdown == "\n"

    def test_handles_deeply_nested_lists(self):
        html = """
        <ul>
            <li>Level 1
                <ul>
                    <li>Level 2
                        <ul>
                            <li>Level 3</li>
                        </ul>
                    </li>
                </ul>
            </li>
        </ul>
        """
        result = convert(html)
        assert "- Level 1" in result.markdown
        assert "  - Level 2" in result.markdown
        assert "    - Level 3" in result.markdown

    def test_handles_mixed_ul_ol_nesting(self):
        html = """
        <ul>
            <li>Bullet
                <ol>
                    <li>Numbered A</li>
                    <li>Numbered B</li>
                </ol>
            </li>
        </ul>
        """
        result = convert(html)
        assert "- Bullet" in result.markdown
        assert "  1. Numbered A" in result.markdown
        assert "  2. Numbered B" in result.markdown
