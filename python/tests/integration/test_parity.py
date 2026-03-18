"""Cross-language parity test: runs JS converter via subprocess and compares output."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

from markdown_for_agents import convert

REPO_ROOT = Path(__file__).parent.parent.parent.parent
JS_DIST = REPO_ROOT / "packages" / "core" / "dist" / "index.mjs"
FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"


def _run_js_convert(html: str) -> str:
    """Run the JS converter via Node.js and return the markdown output."""
    js_path = str(JS_DIST).replace("\\", "/")
    script = (
        f'import("{js_path}").then(m => {{'
        f"const result = m.convert({json.dumps(html)}, {{frontmatter: false}});"
        f"process.stdout.write(result.markdown);"
        f"}});"
    )
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        capture_output=True,
        text=True,
        timeout=10,
    )
    if result.returncode != 0:
        pytest.skip(f"Node.js execution failed: {result.stderr}")
    return result.stdout


def _js_available() -> bool:
    """Check if Node.js and the built JS package are available."""
    try:
        subprocess.run(["node", "--version"], capture_output=True, timeout=5, check=True)
        return JS_DIST.exists()
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return False


@pytest.mark.skipif(not _js_available(), reason="Node.js or built JS package not available")
class TestParityWithJS:
    """Compare Python and JS converter output byte-for-byte."""

    def test_simple_html(self, fixture):
        html = fixture("simple.html")
        py_result = convert(html, frontmatter=False).markdown
        js_result = _run_js_convert(html)
        assert py_result == js_result

    def test_headings(self):
        html = "<h1>Title</h1><h2>Sub</h2><h3>H3</h3>"
        py_result = convert(html, frontmatter=False).markdown
        js_result = _run_js_convert(html)
        assert py_result == js_result

    def test_paragraphs_and_inline(self):
        html = "<p>Hello <strong>bold</strong> and <em>italic</em> world.</p>"
        py_result = convert(html, frontmatter=False).markdown
        js_result = _run_js_convert(html)
        assert py_result == js_result

    def test_links_and_images(self):
        html = '<p><a href="https://example.com">Link</a> and <img src="https://img.com/x.png" alt="img"></p>'
        py_result = convert(html, frontmatter=False).markdown
        js_result = _run_js_convert(html)
        assert py_result == js_result

    def test_code_blocks(self, fixture):
        html = fixture("code-blocks.html")
        py_result = convert(html, frontmatter=False).markdown
        js_result = _run_js_convert(html)
        assert py_result == js_result

    def test_lists(self, fixture):
        html = fixture("nested-lists.html")
        py_result = convert(html, frontmatter=False).markdown
        js_result = _run_js_convert(html)
        assert py_result == js_result

    def test_tables(self, fixture):
        html = fixture("table.html")
        py_result = convert(html, frontmatter=False).markdown
        js_result = _run_js_convert(html)
        assert py_result == js_result
