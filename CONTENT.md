Content Workflow
================

Where content lives
- WordPress (via WPGraphQL): blog posts, projects, glossary, faqs, persons, videos.
- Directus: special offers in `special_offers` and WYSIWYG privacy/SMS terms content in `legal_copy`, filtered by related `client.slug = DIRECTUS_CLIENT_SLUG`.
- Next.js app pages: service pages, about, contact, and legal page shells.

Publishing in WP
- Ensure posts/projects are Published, not Draft.
- Fill excerpts where available (used as SEO fallbacks).
- Provide featured images for richer OG cards.

Publishing special offers in Directus
- Set `is_published=true` to make an offer routable.
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
- Utility pages (`/reviews`, `/tell-us-why`) are marked noindex.
- Person and glossary terms are noindex by business choice.
