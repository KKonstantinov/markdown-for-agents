from markdown_for_agents import convert


class TestTableRules:
    def test_converts_table_with_thead_and_tbody(self, fixture):
        html = fixture("table.html")
        result = convert(html)

        assert "| Name | Age | City |" in result.markdown
        assert "| --- | --- | --- |" in result.markdown
        assert "| Alice | 30 | New York |" in result.markdown
        assert "| Bob | 25 | San Francisco |" in result.markdown

    def test_escapes_pipe_characters(self):
        result = convert("<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>x | y</td></tr></tbody></table>")
        assert "x \\| y" in result.markdown

    def test_handles_table_without_thead(self):
        result = convert("<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>")
        assert "| A | B |" in result.markdown
        assert "| C | D |" in result.markdown
        assert "| --- |" not in result.markdown

    def test_handles_table_with_tfoot(self):
        result = convert("<table><thead><tr><th>X</th></tr></thead><tfoot><tr><td>Total</td></tr></tfoot></table>")
        assert "| X |" in result.markdown
        assert "| Total |" in result.markdown

    def test_handles_empty_table_cells(self):
        result = convert(
            "<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td></td><td>data</td></tr></tbody></table>"
        )
        assert "| A | B |" in result.markdown
        assert "|  | data |" in result.markdown

    def test_handles_single_column_table(self):
        result = convert("<table><thead><tr><th>Only</th></tr></thead><tbody><tr><td>one</td></tr></tbody></table>")
        assert "| Only |" in result.markdown
        assert "| --- |" in result.markdown
        assert "| one |" in result.markdown
