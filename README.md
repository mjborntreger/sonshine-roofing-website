# SonShine Roofing — Next.js Frontend

Runbook (Staging vs Prod)

- Env flag: `NEXT_PUBLIC_ENV` → `production` for prod, anything else for staging.
- Robots
  - Staging: `Disallow: /`
  - Prod: `Allow: /`, sitemap at `/sitemap_index`
- Sitemaps
  - Preview on staging: set `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true`
  - Static manifest generated prebuild to `public/__sitemaps/static-routes.json`
  - The `/faq` archive is included in the static sitemap; individual FAQ anchors do not have a child sitemap.
- Security
  - CSP enforced on staging, report-only on production
- GTM
  - Loads when `NEXT_PUBLIC_GTM_ID` set and env permits; GA4 Enhanced Measurement handles page views.

# Deployment Runbook

Environments

- NEXT_PUBLIC_ENV=production → Production
- NEXT_PUBLIC_ENV=staging → Staging (or anything not "production")

Sitemaps & Robots

- Production
  - robots.txt: Allow all, sitemap at `${NEXT_PUBLIC_BASE_URL}/sitemap_index`.
  - app/robots.ts builds from `NEXT_PUBLIC_BASE_URL`.
- Staging
  - robots.txt: Disallow all. Sitemap endpoints exist but are not to be crawled.
  - You can enable sitemap preview endpoints by setting:
    - NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true
  - Preview adds `X-Robots-Tag: noindex, nofollow` on sitemap responses.

Static sitemap (pages not in CMS)

- Generated at build by `scripts/make-static-sitemap.mjs` → `public/__sitemaps/static-routes.json`.
- Endpoint reads the manifest at request time: `/sitemap_index/static`.
- If empty:
  - Confirm prebuild ran (visible in build logs "Wrote N static routes").
  - Confirm middleware is skipping `^/__sitemaps/` and `^/sitemap_index`.
  - Confirm `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true` on staging if needed.

Security headers & CSP

- next.config.mjs adds security headers for all requests.
- CSP behavior:
  - Production: Report-Only (Content-Security-Policy-Report-Only)
  - Staging: Enforced (Content-Security-Policy)
  - If something breaks on staging, adjust CSP, test, then roll to prod.
- QuickQuote instant quote embed:
  - Internal page: `/instant-quote`
  - Loader: `https://qq.leadsbyquickquote.com/roofs/integration?target=quickquote-web-form&contractorId=d9d4c0ba-e0cc-4f1c-a12e-5c30d9b2ce8d`
  - Runtime bundle: `https://storage.googleapis.com/qq-framework/quickquote.iife.js`
  - CSP must allow the QuickQuote API hosts in `connect-src`, Google reCAPTCHA, Google Fonts, and jsDelivr Toastify CSS.
  - The site hydrates stored `utm_*` and `gclid` into the URL before loading QuickQuote; unsupported webhook fields such as `gbraid`, `wbraid`, landing page, and referrer require QuickQuote vendor support.

Cache/Invalidation

- WordPress GraphQL and Directus content use timed revalidation where configured. Directus FAQs revalidate hourly and Directus blog content revalidates every 15 minutes. Shared Directus site content and special offers are build-only; their changes require a new build.
- Static sitemap: regenerated on build; read dynamically per request.
- Redirects are loaded from Directus during each build, so redirect changes require a new build to take effect.

GTMetrix/Analytics

- GTM loads only when `NEXT_PUBLIC_GTM_ID` is set and env permits.
- GA4 Enhanced Measurement should remain enabled for single-page route tracking.

# Operations

Quick Checks

- Robots
  - Staging: robots.txt = Disallow: /
  - Prod: robots.txt = Allow: /
- Sitemaps
  - `/sitemap_index` lists child sitemaps.
  - `/sitemap_index/static` shows static routes (with human-friendly XSL view).
  - `/sitemap_index/video` surfaces video metadata (with enhanced XSL preview).
- GTM
  - `NEXT_PUBLIC_GTM_ID` set; GA4 Enhanced Measurement is enabled for page views.

Revalidation

- GraphQL-backed pages cache by tag. Use your `/api/revalidate` endpoint (if present) to bust tags.
- Static sitemap manifest regenerates on build.

Enable preview sitemaps on staging

- Set `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true`.
- Sitemaps respond with `X-Robots-Tag: noindex, nofollow`.

Security headers

- CSP is enforced on staging, report-only on production.
- If staging breaks, check console for CSP violations; then update `next.config.mjs`.

# Content Workflow

Where content lives

- WordPress (via WPGraphQL): remaining legacy projects, videos, and location
  landing pages.
- Directus, filtered by related `client.slug = DIRECTUS_CLIENT_SLUG`:
  - `blog_posts` + flat, client-scoped `blog_topics`: the exclusive blog source;
    the adapter covers archive pagination, search/topic facets, detail pages,
    recommendations, metadata, and blog/image sitemaps.
  - `site_settings`: shared brand, contact, address, social, image, footer, and schema values.
  - `website_pages`: normalized SEO records for fixed routes only; canonicals are route-derived.
  - `services`: the four primary service route owners, including their SEO metadata.
  - `navigation_items`: header navigation and matching footer link groups.
  - `redirects`: published legacy redirects loaded and validated at build time.
  - `special_offers`: offer pages, route-owned SEO, and the featured offer popup.
  - `legal_copy`: WYSIWYG privacy/SMS terms content.
  - `persons`: the exclusive SonShine team/profile source.
  - `roofing_glossary_terms`: the exclusive glossary archive, term-route, SEO,
    contextual-linking, and glossary-sitemap source.
- Next.js app pages: route layouts, components, and page body copy that has not yet moved to Directus.

Directus-backed static page metadata falls back to the route's local metadata when Directus is unavailable outside production. Every referenced Directus image must have a `directus_files.description`; missing descriptions fail the content read instead of producing empty alt text.

The route-owning `website_pages`, `services`, `blog_posts`, `special_offers`,
`persons`, and `roofing_glossary_terms` collections use one `seo` field group:
`noindex`, `meta_title`,
`meta_description`, `primary_focus_keyword`, `focus_keywords`, `og_title`,
`og_description`, and `og_image_override`. `noindex` stays visible; the remaining
fields hide when it is true, and meta/keyword fields are editor-required when it
is false. Directus values are authoritative. Frontend calculations are fallback
only. Social images fall back from the override to the route's featured, hero,
or profile image, then the site default.

`focus_keywords` contains the complete keyword set with
`primary_focus_keyword` first. Invalid JSON fails with
`DIRECTUS_FOCUS_KEYWORDS_INVALID`; a primary/tag mismatch fails with
`DIRECTUS_PRIMARY_FOCUS_KEYWORD_MISMATCH`. WordPress-backed location landing
pages remain a deliberate code-owned exception until they move to a dedicated
Directus `location_landing_pages` collection.

Redirect ownership

- Content-specific legacy redirects live in Directus and are fetched by `next.config.mjs` during a build.
- Canonical-host, global de-pagination, global `.html`, and WordPress sitemap-pattern rules remain in code because they depend on host or regex matching.
- Published redirect records must have unique source paths, a supported status (`301`, `302`, `303`, `307`, or `308`), and `preserve_query=true`; invalid records fail the build.
- Static generation is limited to two workers with one page per worker at a time to avoid bursting WordPress or Directus.
- Analytics remains controlled by the existing environment/config path. `site_settings.enable_site_analytics` is intentionally not wired yet.

Legal copy in `legal_copy.privacy_policy` and `legal_copy.terms_of_use` is sanitized server-side before rendering. Use semantic HTML without classes, IDs, inline styles, scripts, or event-handler attributes. Body headings begin at `h2`; Next.js owns each page's primary `h1`, metadata, canonical URL, and layout.

Publishing in WP

- Ensure remaining WordPress projects and other legacy content are Published,
  not Draft.
- Fill excerpts where available (used as SEO fallbacks).
- Provide featured images for richer OG cards.

Directus blog

- Every blog consumer reads Directus. There is no content-source environment
  switch and no WordPress blog fallback.
- Blog reads require `DIRECTUS_URL`, `DIRECTUS_CLIENT_SLUG`, and
  `DIRECTUS_TOKEN` or `DIRECTUS_STATIC_TOKEN`.
- Directus posts use `published_at` and `source_updated_at`, relational topics,
  `meta_title`, `meta_description`, and the Directus featured image. A null
  author renders as the `SonShine Roofing` Organization fallback; the approved
  Michael Borntreger relation renders as a Person.
- Directus marks automation-owned `external_id` and `source_updated_at`
  read-only; editorial fields such as `published_at` and `featured` remain
  editable.

Directus people

- Team cards, profile routes, profile navigation, SEO metadata, and page/image
  sitemaps read published `persons` records from Directus unconditionally.
- WordPress person queries, a person-source environment flag, and WordPress
  profile-image fallbacks are intentionally unsupported.
- The active allowlist contains exactly ten profiles. Antonio, Tony, Angela,
  Dean, Steve, and Matthew are denied by both the adapter and migration manifest.
- Person SEO is declared on each Directus record. Name/role, biography, and the
  profile image are fallback sources only.
- `show_on_team` defaults to true. `noindex` defaults to true globally, while
  the approved ten SonShine profiles are explicitly set to false.

Directus roofing glossary

- Archive, search data, term pages, previous/next navigation, contextual
  linking, metadata, structured data, static params, and the glossary sitemap
  read published `roofing_glossary_terms` records from Directus unconditionally.
- Every term owns its SEO fields and remains `noindex=true`; the separate
  `/roofing-glossary` `website_pages` record remains indexable.
- The restricted HTML sanitizer permits paragraphs, links, emphasis, inline
  code, superscript/subscript, lists, and line breaks only.
- WordPress glossary queries and a glossary-source fallback are intentionally
  unsupported.

Glossary linking

- Term pages auto-link other terms in the content body (first occurrence per term).
- Avoid keyword stuffing; links are budgeted to prevent overlinking.

Images

- For brand images, prefer Next.js `Image` component where possible.
- Default OG image: `/og-default.png` (1200×630).

Noindex Policy

- Utility pages (`/reviews`, `/tell-us-why`, `/thank-you`, `/truck-for-sale`, and the 404 page) are marked noindex and excluded from the static sitemap where applicable.
- Person pages follow `noindex`; the approved ten are explicitly indexable.
- Special offers default to `noindex=true`, but editors can enable indexing.
  The stored toggle alone controls robots metadata and sitemap inclusion. Expiration
  only controls offer availability and featured-popup eligibility.
- Glossary terms remain noindex by business choice.

# SEO Guide

Canonicals & Metadata

- Base metadata in `app/layout.tsx`.
- Per-page metadata in each route’s `generateMetadata`.
- Use `NEXT_PUBLIC_BASE_URL` for absolute canonical urls if needed.

Robots

- Staging: `Disallow: /` (non-prod).
- Production: `Allow: /` with sitemap at `/sitemap_index`.
- Page-level `noindex, follow` is used for `/roofing-glossary/[slug]` and for any
  Directus route owner whose `noindex` flag is true. Special-offer expiration
  never overrides the stored toggle.
  - `/reviews`, `/tell-us-why` (utility pages)

Sitemaps

- Index: `/sitemap_index`
- Children:
  - `/sitemap_index/static` (build-time manifest)
  - `/sitemap_index/blog`, `/project`, `/roofing-glossary`, `/person`,
    `/special-offer`, `/video`
- Preview mode on staging: set `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true`.

Special-offer pages and `/sitemap_index/special-offer` are generated only during
the build. The authenticated revalidation endpoint rejects those paths so a
Directus edit cannot trigger request-time regeneration.

Structured Data

- RoofingContractor + Services JSON-LD injected in `app/layout.tsx`.
- Person, DefinedTerm, and FAQ JSON-LD where relevant.
- Ensure visible content matches JSON-LD.

Open Graph/Twitter

- Default image: `/og-default.png` (all references standardized).
