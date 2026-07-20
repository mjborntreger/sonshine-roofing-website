Content Workflow
================

Where content lives
- WordPress (via WPGraphQL): remaining legacy projects, glossary, videos, and
  location landing pages.
- Directus, filtered by related `client.slug = DIRECTUS_CLIENT_SLUG`:
  - `blog_posts` and flat, client-scoped `blog_topics`: the exclusive blog
    source for archives, filters, post pages, recommendations, metadata, and
    blog/image sitemaps.
  - `site_settings`: shared brand, contact, address, social, image, footer badges, company facts, robots, CSP, analytics switch, schema values, and optional raw `llms.txt` content.
  - `website_pages`: metadata, canonical, Open Graph, focus-keyword, noindex, and sitemap-policy records for static routes.
  - `services`: primary service records used by navigation and service quick links.
  - `faqs`: published WYSIWYG-authored semantic HTML answers. A null `website_page` is global; otherwise the relation defines the FAQ's single primary page scope and supplies the archive group title from `website_pages.nav_label`.
  - `navigation_items`: header navigation and matching footer link groups.
  - `redirects`: published legacy redirect rules loaded at build time.
  - `special_offers`: special-offer pages and popup content.
  - `legal_copy`: WYSIWYG privacy/SMS terms content.
  - `persons`: the exclusive source for the ten approved SonShine profiles. The
    adapter covers team cards, profile routes, person navigation, metadata, and
    page/image sitemaps.
- Next.js app pages: route layouts, components, and page body copy not yet moved to Directus.

Publishing shared site content in Directus
- Keep exactly one `site_settings` record for the SonShine client.
- Use unique normalized paths in `website_pages`; the 404 record is `/404` even though it has no public canonical.
- Keep the four primary `services` records published and linked from their matching `website_pages` records.
- Publish navigation only after its target `website_pages` records exist.
- Store the complete keyword set in `focus_keywords` and select one of those exact values in `primary_focus_keyword`. A mismatch fails the build with `DIRECTUS_PRIMARY_FOCUS_KEYWORD_MISMATCH`.
- Every Directus image must have a `directus_files.description`.
- Footer badges are image-only records in `site_settings.badges`; each image needs a description. Embedded badge HTML is not rendered.
- Populated social fields must contain absolute HTTP(S) URLs. Invalid values fail production builds.
- `site_settings.content_security_policy` is required and production builds fail when it is empty or unavailable.
- `site_settings.enable_site_analytics` is the CMS switch for GTM and Meta Pixel; the required public IDs still come from environment variables.
- `site_settings.llms_txt` is optional and is published verbatim as `/llms.txt`. Empty or whitespace-only content produces no file.
- Header, body, and footer script fields remain intentionally disabled.
- Operational hours and timezone intervals in `lib/contact-hours.ts` are a documented code-controlled exception because UI state and JSON-LD require normalized schedules.

Publishing FAQs in Directus
- Keep each FAQ assigned to one client and no more than one `website_page`.
- Leave `website_page` empty only for genuinely global FAQs.
- Use only paragraphs, links, bold/italic emphasis, ordered or unordered lists, list items, and line breaks in `answer` (`p`, `a`, `strong`, `em`, `ul`, `ol`, `li`, and `br`).
- Link attributes are limited to `href`, `rel`, `target`, and `title`. Destinations must begin with exactly one `/`, begin with `#`, or use `http`, `https`, `mailto`, or `tel`. Do not use protocol-relative or unsafe-protocol URLs.
- Do not add images, headings, tables, classes, IDs, inline styles, scripts, event handlers, or arbitrary editor/source markup.
- The editor toolbar guides authors, but the restricted frontend sanitizer is the authoritative security boundary. `_blank` links receive `rel="noopener noreferrer"`.
- FAQ JSON-LD uses parser-derived, entity-decoded plain text from `faqHtmlToPlainText()`; never remove tags with a regex.
- Publication uses only `status`; page scope uses only `website_page`.
- Page sections render global FAQs plus FAQs whose related page path matches the current route.
- The `/faq` archive renders General first, then page groups alphabetically by `website_pages.nav_label`.

Publishing redirects in Directus
- Redirect changes become active only after a new site build.
- Keep `source_path` unique, set `preserve_query=true`, and use a supported status code (`301`, `302`, `303`, `307`, or `308`).
- Use `/prefix/*` for prefix wildcards. Invalid, duplicate, or self-redirect records fail the build.
- Canonical-host, global de-pagination, global `.html`, and WordPress sitemap-pattern rules remain in `next.config.mjs`.
- Deleted deprecated landing-page routes intentionally return 404; do not add redirects for them.

Publishing in WP
- Ensure remaining WordPress projects and other legacy content are Published,
  not Draft.
- Fill excerpts where available (used as SEO fallbacks).
- Provide featured images for richer OG cards.
- Location landing pages remain a deliberate WordPress/code exception until they move to a dedicated Directus `location_landing_pages` collection.

Publishing blog posts in Directus
- Directus is the only frontend blog source. There is no environment-controlled
  WordPress fallback.
- Set `status=published` to expose a post and provide one to three published,
  SonShine-scoped `blog_topics` relations.
- Preserve `published_at`, `source_updated_at`, `meta_title`,
  `meta_description`, and a described Directus featured image.
- Leave `author` empty for the SonShine Roofing Organization fallback; use only
  the approved SonShine-scoped Michael Borntreger person relation for his posts.
- `external_id` and `source_updated_at` are automation-owned and read-only in
  the Directus editor. `published_at`, `featured`, and ordinary editorial fields
  remain editable.

Publishing SonShine people in Directus
- The ten approved profiles are published and Directus is the only frontend
  source. WordPress person queries and fallback images are intentionally not
  supported.
- The approved order is Nathan Borntreger, Bob, Josh, JB, Jeremy K., Tara, Mina,
  Michael, Erick, and José. Antonio, Tony, Angela, Dean, Steve, and Matthew are
  explicitly excluded and must not be recreated by the migration script.
- `show_on_team` and `seo_indexable` default to `true`; both are explicitly true
  on all ten published profiles. Records still require the correct
  SonShine client, slug, display name, role, biography, sort value, and described
  profile image.
- `bio` allows only paragraphs, H2–H4 headings, links, bold/italic emphasis,
  ordered/unordered lists, list items, and line breaks. The frontend sanitizer
  is authoritative; images, media, tables, code, classes, IDs, colors, inline
  styles, scripts, and arbitrary source HTML are unsupported.
- Person SEO is derived in the SonShine adapter rather than stored redundantly:
  `meta_title` and `og_title` use display name + role + brand;
  `meta_description` and `og_description` use cleaned biography text (with a
  role-based fallback for placeholder biographies); `og_image` reuses the
  described profile image.

Publishing special offers in Directus
- Set `status=published` to make an offer routable.
- Set `featured=true` to make an unexpired offer eligible for the sitewide popup.
- Use `featured_image.description` for image alt text and `legal_disclaimer` for disclaimer copy.

Publishing legal copy in Directus
- Edit `legal_copy.privacy_policy` and `legal_copy.terms_of_use` with the WYSIWYG editor.
- Use semantic HTML without classes, IDs, inline styles, scripts, or event-handler attributes.
- Begin body headings at `h2`; the Next.js page shell owns the primary `h1`.
- `/privacy-policy` consumes `privacy_policy`; `/sms-terms-and-conditions` consumes `terms_of_use`.

Glossary linking
- Term pages auto-link other terms in the content body (first occurrence per term).
- Avoid keyword stuffing; links are budgeted to prevent overlinking.

Images
- For brand images, prefer Next.js `Image` component where possible.
- Default OG image: `/og-default.png` (1200×630).

Noindex Policy
- Utility pages (`/reviews`, `/tell-us-why`, `/thank-you`, `/truck-for-sale`, and the 404 page) are marked noindex and excluded from the static sitemap where applicable.
- Published SonShine person pages follow `seo_indexable`; the approved ten are
  indexable and the person page/image sitemaps remain aligned. Glossary terms
  remain noindex by business choice.
