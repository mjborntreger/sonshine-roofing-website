Deployment Runbook
===================

Environments
- NEXT_PUBLIC_ENV=production → Production
- NEXT_PUBLIC_ENV=staging    → Staging (or anything not "production")

Sitemaps & Robots
- Production
  - robots.txt: Allow all, sitemap at `${NEXT_PUBLIC_SITE_URL}/sitemap_index`.
  - app/robots.ts builds from `NEXT_PUBLIC_SITE_URL`.
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

Cache/Invalidation
- GraphQL data: leverages `unstable_cache` with tags; use `/api/revalidate` where applicable.
- Static sitemap: regenerated on build; read dynamically per request.

GTMetrix/Analytics
- GTM loads only when `NEXT_PUBLIC_GTM_ID` is set and env permits.
- Route changes pushed via `lib/gtm-route-change.tsx`.

