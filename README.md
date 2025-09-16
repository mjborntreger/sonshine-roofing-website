# SonShine Roofing — Next.js Frontend

Runbook (Staging vs Prod)
- Env flag: `NEXT_PUBLIC_ENV` → `production` for prod, anything else for staging.
- Robots
  - Staging: `Disallow: /`
  - Prod: `Allow: /`, sitemap at `/sitemap_index`
- Sitemaps
  - Preview on staging: set `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true`
  - Static manifest generated prebuild to `public/__sitemaps/static-routes.json`
- Security
  - CSP enforced on staging, report-only on production
- GTM
  - Loads when `NEXT_PUBLIC_GTM_ID` set and env permits; route changes sent via custom `page_view` event

See DEPLOY.md, SEO.md, CONTENT.md, and OPS.md for details.
