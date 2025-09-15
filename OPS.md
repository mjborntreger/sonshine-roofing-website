Operations
==========

Quick Checks
- Robots
  - Staging: robots.txt = Disallow: /
  - Prod: robots.txt = Allow: /
- Sitemaps
  - `/sitemap_index` lists child sitemaps.
  - `/sitemap_index/static` shows static routes (with human-friendly XSL view).
- GTM
  - `NEXT_PUBLIC_GTM_ID` set, and container publishes page_view from Custom Event.

Revalidation
- GraphQL-backed pages cache by tag. Use your `/api/revalidate` endpoint (if present) to bust tags.
- Static sitemap manifest regenerates on build.

Enable preview sitemaps on staging
- Set `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true`.
- Sitemaps respond with `X-Robots-Tag: noindex, nofollow`.

Security headers
- CSP is enforced on staging, report-only on production.
- If staging breaks, check console for CSP violations; then update `next.config.mjs`.

Status Checklist (handoff)
- [ ] Robots staging: Disallow all
- [ ] Sitemaps preview: ON/OFF as expected
- [ ] Search Console: property verified, sitemap submitted (prod)
- [ ] GTM: container ID set, page_view verified

