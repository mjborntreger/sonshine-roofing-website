Content Workflow
================

Where content lives
- WordPress (via WPGraphQL): blog posts, projects, glossary, persons, videos.
- Directus, filtered by related `client.slug = DIRECTUS_CLIENT_SLUG`:
  - `site_settings`: shared brand, contact, address, social, image, footer, and schema values.
  - `website_pages`: metadata, canonical, Open Graph, noindex, and sitemap-policy records for static routes.
  - `services`: primary service records used by navigation and service quick links.
  - `faqs`: published FAQ answers. A null `website_page` is global; otherwise the relation defines the FAQ's single primary page scope and supplies the archive group title from `website_pages.nav_label`.
  - `navigation_items`: header navigation and matching footer link groups.
  - `redirects`: published legacy redirect rules loaded at build time.
  - `special_offers`: special-offer pages and popup content.
  - `legal_copy`: WYSIWYG privacy/SMS terms content.
- Next.js app pages: route layouts, components, and page body copy not yet moved to Directus.

Publishing shared site content in Directus
- Keep exactly one `site_settings` record for the SonShine client.
- Use unique normalized paths in `website_pages`; the 404 record is `/404` even though it has no public canonical.
- Keep the four primary `services` records published and linked from their matching `website_pages` records.
- Publish navigation only after its target `website_pages` records exist.
- Every Directus image must have a `directus_files.description`.
- Analytics remains on its existing configuration; do not use `site_settings.enable_site_analytics` yet.

Publishing FAQs in Directus
- Keep each FAQ assigned to one client and no more than one `website_page`.
- Leave `website_page` empty only for genuinely global FAQs.
- Page sections render global FAQs plus FAQs whose related page path matches the current route.
- The `/faq` archive renders General first, then page groups alphabetically by `website_pages.nav_label`.

Publishing redirects in Directus
- Redirect changes become active only after a new site build.
- Keep `source_path` unique, set `preserve_query=true`, and use a supported status code (`301`, `302`, `303`, `307`, or `308`).
- Use `/prefix/*` for prefix wildcards. Invalid, duplicate, or self-redirect records fail the build.
- Canonical-host, global de-pagination, global `.html`, and WordPress sitemap-pattern rules remain in `next.config.mjs`.
- Deleted deprecated landing-page routes intentionally return 404; do not add redirects for them.

Publishing in WP
- Ensure posts/projects are Published, not Draft.
- Fill excerpts where available (used as SEO fallbacks).
- Provide featured images for richer OG cards.

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
- Person and glossary terms are noindex by business choice.
