from markdown_for_agents import convert


class TestTextProcessing:
    def test_collapses_whitespace_in_normal_text(self):
        result = convert("<p>hello    world</p>")
        assert result.markdown == "hello world\n"

    def test_preserves_whitespace_inside_pre(self):
        result = convert("<pre><code>  spaced  out  </code></pre>")
        assert "  spaced  out  " in result.markdown

    def test_skips_whitespace_only_text_nodes_in_tables(self):
        html = """<table>
        <thead>
          <tr>
            <th>A</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>B</td>
          </tr>
        </tbody>
      </table>"""
        result = convert(html)
        assert "| A |" in result.markdown
        assert "| B |" in result.markdown
        import re

        assert not re.search(r"\|\s{2,}A", result.markdown)


class TestRuleMatching:
    def test_higher_priority_rules_take_precedence(self):
        from markdown_for_agents import Rule

        result = convert(
            "<p>Hello</p>",
            rules=[
                Rule(
                    filter="p",
                    replacement=lambda ctx: f"CUSTOM: {ctx.convert_children(ctx.node).strip()}",
                    priority=10,
                ),
            ],
        )
        assert "CUSTOM: Hello" in result.markdown

    def test_rule_returning_none_removes_element(self):
        from markdown_for_agents import Rule

        result = convert(
            "<p>Keep</p><div>Remove</div>",
            rules=[Rule(filter="div", replacement=lambda ctx: None, priority=10)],
        )
        assert "Keep" in result.markdown
        assert "Remove" not in result.markdown

    def test_rule_returning_skip_falls_through(self):
        from markdown_for_agents import SKIP, Rule

        result = convert(
            "<p>Hello</p>",
            rules=[
                Rule(filter="p", replacement=lambda ctx: SKIP, priority=20),
                Rule(
                    filter="p",
                    replacement=lambda ctx: f"FALLBACK: {ctx.convert_children(ctx.node).strip()}",
                    priority=10,
                ),
            ],
        )
        assert "FALLBACK: Hello" in result.markdown


class TestUnmatchedElements:
    def test_renders_children_of_unmatched_elements(self):
        result = convert("<section><p>Inside section</p></section>")
        assert "Inside section" in result.markdown

    def test_handles_deeply_nested_unmatched_elements(self):
        result = convert("<div><span><section><p>Deep</p></section></span></div>")
        assert "Deep" in result.markdown


class TestAdjacentElementSpacing:
    def test_inserts_space_between_adjacent_links(self):
        result = convert('<div><a href="/a">Link1</a><a href="/b">Link2</a></div>')
        assert "[Link1](/a) [Link2](/b)" in result.markdown

    def test_inserts_space_between_adjacent_inline_elements(self):
        result = convert("<p><strong>Bold</strong><em>Italic</em></p>")
        assert "**Bold** *Italic*" in result.markdown

    def test_no_double_space_when_text_node_separates(self):
        result = convert('<p><a href="/a">Link1</a> <a href="/b">Link2</a></p>')
        assert "[Link1](/a) [Link2](/b)" in result.markdown
        assert "[Link1](/a)  [Link2](/b)" not in result.markdown

    def test_no_space_inside_tables(self):
        result = convert("<table><thead><tr><th>A</th><th>B</th></tr></thead></table>")
        assert "| A | B |" in result.markdown

    def test_no_space_inside_pre(self):
        result = convert("<pre><code><span>a</span><span>b</span></code></pre>")
        assert "ab" in result.markdown

    def test_handles_multiple_adjacent_elements(self):
        result = convert('<div><a href="/a">A</a><a href="/b">B</a><a href="/c">C</a></div>')
        assert "[A](/a) [B](/b) [C](/c)" in result.markdown
