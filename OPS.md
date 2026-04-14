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
  - `/sitemap_index/image` surfaces primary blog/project/location images.
  - `/sitemap_index/faq` only renders when `NEXT_PUBLIC_ENABLE_FAQ_SITEMAP=true` (default: off).
- GTM
  - `NEXT_PUBLIC_GTM_ID` set and GA4 Enhanced Measurement enabled for page views.

Revalidation
- GraphQL-backed pages cache by tag. Use your `/api/revalidate` endpoint (if present) to bust tags.
- Static sitemap manifest regenerates on build.

Enable preview sitemaps on staging
- Set `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true`.
- Sitemaps respond with `X-Robots-Tag: noindex, nofollow`.

Security headers
- CSP is enforced on staging, report-only on production.
- If staging breaks, check console for CSP violations; then update `next.config.mjs`.

Lead Pipeline (n8n)
- Browser forms submit to `POST /api/lead`.
- Server route validates payload and anti-spam, then forwards to n8n with header `x-ss-secret`.
- Required server env vars:
  - `N8N_WEBHOOK_URL` (target n8n webhook URL)
  - `N8N_WEBHOOK_SECRET` (shared secret sent as `x-ss-secret`)
  - `TURNSTILE_SECRET_KEY` (Cloudflare Turnstile verification)
- Optional CORS allowlist:
  - `ALLOWED_ORIGIN` (comma-separated origins)

Lead Payload Contract (v2)
- Root fields:
  - `version: "v2"`
  - `formType: "contact-lead" | "financing-calculator" | "special-offer" | "feedback"`
  - `submittedAt` (ISO timestamp)
  - `source.page` (required)
  - `contact.firstName`, `contact.lastName` (required)
  - `contact.email` (required for non-`contact-lead` forms)
  - `contact.email` or `contact.phone` (required for `contact-lead`)
  - `smsConsent.projectSms`, `smsConsent.marketingSms` (`yes`/`no`)
  - `antiSpam.cfToken` (Turnstile token, required)
- Optional fields:
  - `source.utm_source`, `source.utm_medium`, `source.utm_campaign`, `source.ua`, `source.tz`
  - `contact.phone`
  - `address.{address1,address2,city,state,zip}`
  - `details` (form-specific object)
  - `antiSpam.hp_field` (honeypot)

Status Checklist (handoff)
- [ ] Robots staging: Disallow all
- [ ] Sitemaps preview: ON/OFF as expected
- [ ] Image sitemap (`/sitemap_index/image`) returns expected entries
- [ ] Search Console: property verified, sitemap submitted (prod)
- [ ] GTM: container ID set, GA4 Enhanced Measurement capturing page views
