from markdown_for_agents import ExtractOptions, convert


class TestContentExtraction:
    def test_strips_nav_header_footer_aside_scripts_styles(self, fixture):
        html = fixture("full-page.html")
        result = convert(html, extract=True)

        assert "Home" not in result.markdown
        assert "About" not in result.markdown
        assert "Site Header" not in result.markdown
        assert "Copyright" not in result.markdown
        assert "Related Posts" not in result.markdown
        assert "console.log" not in result.markdown
        assert "cookie" not in result.markdown

        assert "Article Title" in result.markdown
        assert "main content" in result.markdown

    def test_keeps_header_when_configured(self, fixture):
        html = fixture("full-page.html")
        result = convert(html, extract=ExtractOptions(keep_header=True))

        assert "Site Header" in result.markdown
        assert "Home" not in result.markdown  # nav still stripped

    def test_strips_by_class_pattern(self):
        result = convert('<p>Keep</p><div class="sidebar-widget">Sidebar</div>', extract=True)
        assert "Keep" in result.markdown
        assert "Sidebar" not in result.markdown

    def test_strips_by_role(self):
        result = convert('<p>Keep</p><div role="navigation">Nav</div>', extract=True)
        assert "Keep" in result.markdown
        assert "Nav" not in result.markdown

    def test_keeps_footer_when_configured(self, fixture):
        html = fixture("full-page.html")
        result = convert(html, extract=ExtractOptions(keep_footer=True))
        assert "Copyright" in result.markdown
        assert "Site Header" not in result.markdown  # header still stripped

    def test_keeps_nav_when_configured(self, fixture):
        html = fixture("full-page.html")
        result = convert(html, extract=ExtractOptions(keep_nav=True))
        assert "Home" in result.markdown
        assert "Site Header" not in result.markdown  # header still stripped

    def test_strips_by_custom_strip_tags(self):
        result = convert(
            "<p>Keep</p><section>Remove</section>",
            extract=ExtractOptions(strip_tags=("section",)),
        )
        assert "Keep" in result.markdown
        assert "Remove" not in result.markdown

    def test_strips_by_custom_strip_classes(self):
        result = convert(
            '<p>Keep</p><div class="my-custom-ad">Ad</div>',
            extract=ExtractOptions(strip_classes=("my-custom",)),
        )
        assert "Keep" in result.markdown
        assert "Ad" not in result.markdown

    def test_strips_by_custom_strip_ids(self):
        result = convert(
            '<p>Keep</p><div id="remove-me">Gone</div>',
            extract=ExtractOptions(strip_ids=("remove-me",)),
        )
        assert "Keep" in result.markdown
        assert "Gone" not in result.markdown

    def test_strips_by_default_id_patterns(self):
        result = convert('<p>Keep</p><div id="sidebar-left">Side</div>', extract=True)
        assert "Keep" in result.markdown
        assert "Side" not in result.markdown

    def test_strips_cta_sections(self):
        result = convert('<p>Article content</p><div class="cta-section"><p>Sign up now!</p></div>', extract=True)
        assert "Article content" in result.markdown
        assert "Sign up" not in result.markdown

    def test_strips_author_bio_cards(self):
        result = convert('<p>Article content</p><div class="author-card"><p>John Doe</p></div>', extract=True)
        assert "Article content" in result.markdown
        assert "John Doe" not in result.markdown

    def test_strips_avatar_elements(self):
        result = convert('<p>Content</p><div class="avatar"><img src="photo.jpg"></div>', extract=True)
        assert "Content" in result.markdown
        assert "photo.jpg" not in result.markdown

    def test_strips_pagination_elements(self):
        result = convert(
            '<p>Content</p><nav class="pagination"><a href="/prev">Previous</a><a href="/next">Next</a></nav>',
            extract=True,
        )
        assert "Content" in result.markdown
        assert "Previous" not in result.markdown
        assert "Next" not in result.markdown

    def test_strips_prev_next_navigation(self):
        result = convert('<p>Content</p><div class="prev-next"><a href="/prev">Prev</a></div>', extract=True)
        assert "Content" in result.markdown
        assert "Prev" not in result.markdown
