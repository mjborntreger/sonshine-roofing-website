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

Financing calculator webhook (WordPress)
- Create a dedicated REST route (e.g. `/wp-json/sonshine/v1/financing`) that skips the feedback-specific `rating` constraint.
- It should accept the POST body we send (`name`, `firstName`, `lastName`, `email`, `phone`, address fields, `amount`, `page`).
- Forward the payload to Fluent SMTP/Brevo using whatever automation you prefer.
- Add the shared secret header guard: expect `x-ss-secret` to equal the value stored in `FINANCING_LEAD_FORWARD_SECRET`.
- Set the environment variable `FINANCING_LEAD_ENDPOINT_URL` (staging and production) to the new route once it is live.

Status Checklist (handoff)
- [ ] Robots staging: Disallow all
- [ ] Sitemaps preview: ON/OFF as expected
- [ ] Search Console: property verified, sitemap submitted (prod)
- [ ] GTM: container ID set, page_view verified
