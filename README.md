# SonShine Roofing — Next.js Frontend

Runbook (Staging vs Prod)
- Env flag: `NEXT_PUBLIC_ENV` → `production` for prod, anything else for staging.
- Robots
  - Staging: `Disallow: /`
  - Prod: `Allow: /`, sitemap at `/sitemap_index`
- Sitemaps
  - Preview on staging: set `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true`
  - Static manifest generated prebuild to `public/__sitemaps/static-routes.json`
  - FAQ sitemap is off by default; set `NEXT_PUBLIC_ENABLE_FAQ_SITEMAP=true` to expose `/sitemap_index/faq`.
- Security
  - CSP enforced on staging, report-only on production
- GTM
  - Loads when `NEXT_PUBLIC_GTM_ID` set and env permits; GA4 Enhanced Measurement handles page views.
 


Deployment Runbook
===================

Environments
- NEXT_PUBLIC_ENV=production → Production
- NEXT_PUBLIC_ENV=staging    → Staging (or anything not "production")

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
- WordPress GraphQL data uses Next fetch revalidation where configured; Directus special offers revalidate every 15 minutes.
- Static sitemap: regenerated on build; read dynamically per request.

GTMetrix/Analytics
- GTM loads only when `NEXT_PUBLIC_GTM_ID` is set and env permits.
- GA4 Enhanced Measurement should remain enabled for single-page route tracking.



Operations
==========

Quick Checks
- Robots
  - Staging: robots.txt = Disallow: /
  - Prod: robots.txt = Allow: /
- Sitemaps
  - `/sitemap_index` lists child sitemaps.
  - `/sitemap_index/static` shows static routes (with human-friendly XSL view).
  - `/sitemap_index/video` surfaces video metadata (with enhanced XSL preview).
  - `/sitemap_index/faq` only appears when `NEXT_PUBLIC_ENABLE_FAQ_SITEMAP=true`.
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



Content Workflow
================

Where content lives
- WordPress (via WPGraphQL): blog posts, projects, glossary, faqs, persons, videos.
- Directus: special offers in `special_offers`, filtered by related `client.slug = DIRECTUS_CLIENT_SLUG`.
- Next.js app pages: service pages, about, contact, policy pages.

Publishing in WP
- Ensure posts/projects are Published, not Draft.
- Fill excerpts where available (used as SEO fallbacks).
- Provide featured images for richer OG cards.

Glossary linking
- Term pages auto-link other terms in the content body (first occurrence per term).
- Avoid keyword stuffing; links are budgeted to prevent overlinking.

Images
- For brand images, prefer Next.js `Image` component where possible.
- Default OG image: `/og-default.png` (1200×630).

Noindex Policy
- Utility pages (`/reviews`, `/tell-us-why`) are marked noindex.
- Person and glossary terms are noindex by business choice.



SEO Guide
=========

Canonicals & Metadata
- Base metadata in `app/layout.tsx`.
- Per-page metadata in each route’s `generateMetadata`.
- Use `NEXT_PUBLIC_BASE_URL` for absolute canonical urls if needed.

Robots
- Staging: `Disallow: /` (non-prod).
- Production: `Allow: /` with sitemap at `/sitemap_index`.
- Page-level `noindex, follow` used for:
  - `/person/[slug]`
  - `/roofing-glossary/[slug]`
  - `/reviews`, `/tell-us-why` (utility pages)

Sitemaps
- Index: `/sitemap_index`
- Children:
  - `/sitemap_index/static` (build-time manifest)
  - `/sitemap_index/blog`, `/project`, `/roofing-glossary`, `/person`, `/video`
- Preview mode on staging: set `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true`.

Structured Data
- RoofingContractor + Services JSON-LD injected in `app/layout.tsx`.
- Person, DefinedTerm, and FAQ JSON-LD where relevant.
- Ensure visible content matches JSON-LD.

Open Graph/Twitter
- Default image: `/og-default.png` (all references standardized).
