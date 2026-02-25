/** HTML tag names stripped by default during content extraction. */
export const DEFAULT_STRIP_TAGS = ['nav', 'footer', 'header', 'aside', 'script', 'style', 'noscript', 'template', 'iframe', 'svg', 'form'];

/** ARIA role values stripped by default during content extraction. */
export const DEFAULT_STRIP_ROLES = ['navigation', 'banner', 'contentinfo', 'complementary', 'search', 'menu', 'menubar'];

/** CSS class patterns stripped by default during content extraction. */
export const DEFAULT_STRIP_CLASSES = [
    /\bad[s-]?\b/i,
    /\bsidebar\b/i,
    /\bwidget\b/i,
    /\bcookie/i,
    /\bpopup\b/i,
    /\bmodal\b/i,
    /\bbreadcrumb/i,
    /\bfootnote/i,
    /\bshare/i,
    /\bsocial/i,
    /\bnewsletter/i,
    /\bcomment/i,
    /\brelated/i,
    /\bcta\b/i,
    /\bcall-to-action/i,
    /\bauthor[-_]?(bio|card|info|box)\b/i,
    /\bavatar\b/i,
    /\bpagination\b/i,
    /\bprev[-_]?next\b/i,
    /\bpager\b/i,
    /\bpost[-_]?nav/i,
    /\barticle[-_]?nav/i,
    /\bback[-_]?link/i
];

/** Element ID patterns stripped by default during content extraction. */
export const DEFAULT_STRIP_IDS = [/\bad[s-]?\b/i, /\bsidebar\b/i, /\bcookie/i, /\bpopup\b/i, /\bmodal\b/i];
