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
- QuickQuote on `/instant-quote` needs CSP access to:
  - `qq.leadsbyquickquote.com`
  - `storage.googleapis.com`
  - `quickquote-api-628343900656.us-central1.run.app`
  - `quickquote-api-223492134056.us-central1.run.app`
  - `quickquote-api-78479757910.us-central1.run.app`
  - Google reCAPTCHA, Google Fonts, jsDelivr CSS, and HTTPS media assets.

Lead Pipeline (n8n)
- Browser forms submit to `POST /api/lead`.
- Server route validates payload and anti-spam, then forwards to n8n with header `x-ss-secret`.
- Required server env vars:
  - `N8N_WEBHOOK_URL` (target n8n webhook URL)
  - `N8N_WEBHOOK_SECRET` (shared secret sent as `x-ss-secret`)
  - `TURNSTILE_SECRET_KEY` (Cloudflare Turnstile verification)
- Optional CORS allowlist:
  - `ALLOWED_ORIGIN` (comma-separated origins)
- QuickQuote submissions do not use `/api/lead`; the vendor script submits to QuickQuote APIs. The site listens for the vendor success event and pushes `lead_form_submitted` plus a one-time `ads_lead_submit` roof replacement conversion. Stored `utm_*` and `gclid` are hydrated into the URL before the script loads; other webhook fields require vendor support.

Lead Payload Contract (v2)
- Root fields:
  - `version: "v2"`
  - `sri_lead_id` (site-generated dedupe/conversion ID)
  - `lead_source: "google_ads" | "seo"` (`google_ads` when `source.gclid`, `source.gbraid`, or `source.wbraid` exists; otherwise `seo`)
  - `formType: "contact-lead" | "financing-calculator" | "special-offer" | "feedback" | "referral"`
  - `submittedAt` (ISO timestamp)
  - `source.page` (required)
  - `contact.firstName`, `contact.lastName` (required)
  - `contact.email` (required for non-`contact-lead` forms)
  - `contact.email` or `contact.phone` (required for `contact-lead`)
  - `smsConsent.projectSms`, `smsConsent.marketingSms` (`yes`/`no`)
  - `antiSpam.cfToken` (Turnstile token, required)
- Optional fields:
  - `source.gclid`, `source.gbraid`, `source.wbraid`
  - `source.utm_source`, `source.utm_medium`, `source.utm_campaign`, `source.utm_term`, `source.utm_content`
  - `source.landing_page`, `source.referrer`, `source.ua`, `source.tz`
  - `contact.phone`
  - `address.{address1,address2,city,state,zip}`
  - `details` (form-specific object)
  - `antiSpam.hp_field` (honeypot)
- Referral submissions:
  - Root `contact` is the referrer.
  - `details.referredHomeowner` is the referred homeowner.
  - Referral forms do not show SMS consent UI and submit `smsConsent.projectSms: "no"` and `smsConsent.marketingSms: "no"`.

Status Checklist (handoff)
- [ ] Robots staging: Disallow all
- [ ] Sitemaps preview: ON/OFF as expected
- [ ] Image sitemap (`/sitemap_index/image`) returns expected entries
- [ ] Search Console: property verified, sitemap submitted (prod)
- [ ] GTM: container ID set, GA4 Enhanced Measurement capturing page views
