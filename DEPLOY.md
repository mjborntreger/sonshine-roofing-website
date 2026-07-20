Deployment Runbook
===================

Coolify Production Deployment
- Deployment target:
  - One production Coolify application.
  - GitHub App source, branch `main`.
  - Build pack: Dockerfile.
  - Exposed port: `3000`.
  - Health check path: `/robots.txt`.
  - Domains:
    - `https://sonshineroofing.com`
    - `https://www.sonshineroofing.com`
- Runtime:
  - The Docker image uses Next standalone output and runs `node server.js`.
  - Container defaults:
    - `NODE_ENV=production`
    - `HOSTNAME=0.0.0.0`
    - `PORT=3000`
- Cloudflare DNS:
  - Keep records DNS-only, not proxied.
  - Point apex `A` record to the Coolify server IPv4.
  - Point `www` to the apex with a `CNAME`, or use a matching `A` record.
  - Lower TTL before production cutover.
  - Ensure ports `80` and `443` reach Coolify/Traefik for Let's Encrypt.
- Cutover:
  - Keep Vercel live until Coolify production passes smoke checks.
  - Rollback is DNS-only: point records back to Vercel.

Environments
- NEXT_PUBLIC_ENV=production → Production
- NEXT_PUBLIC_ENV=staging    → Staging (or anything not "production")

Coolify Environment Variables
- Mark these as build-time and runtime variables because Next bakes `NEXT_PUBLIC_*` values into the client bundle during `next build`:
  - `NEXT_PUBLIC_ENV=production`
  - `NEXT_PUBLIC_BASE_URL=https://sonshineroofing.com`
  - `NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT`
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - `NEXT_PUBLIC_GTM_ID`
  - `NEXT_PUBLIC_META_PIXEL_ID`
  - `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`
- Mark these server variables as build-time and runtime variables because Directus blog posts/topics, redirects, shared site content, reviews, review-carousel settings, and special offers are fetched during the build or runtime ISR:
  - `DIRECTUS_URL`
  - `DIRECTUS_CLIENT_SLUG`
  - `DIRECTUS_TOKEN`
- Do not set a blog content-source variable. The frontend has no WordPress blog
  fallback; all blog consumers read Directus.
- Set these as runtime secrets:
  - `N8N_WEBHOOK_URL`
  - `N8N_WEBHOOK_SECRET`
  - `TURNSTILE_SECRET_KEY`
  - `REVALIDATE_SECRET`
  - `ALLOWED_ORIGIN=https://sonshineroofing.com,https://www.sonshineroofing.com`
- Optional build-time variables:
  - `YOUTUBE_API_KEY` for YouTube metadata during static generation.
  - `WP_PROJECT_BASE` only if the WordPress project CPT base changes.
- Do not set `WP_BASIC_AUTH_USER` or `WP_BASIC_AUTH_PASS` unless WPGraphQL becomes protected.

Directus Reviews Cache
- `ReviewsCarousel` reads published five-star Google records from Directus for `DIRECTUS_CLIENT_SLUG`.
- The default carousel limit and Google Business Profile link come from the matching `reviews_carousels` record.
- Review and carousel reads use a 15-minute ISR safety cache tagged `directus:reviews:<client-slug>`.
- The reviews synchronization workflow should revalidate that tag only after its Directus write/readback cycle succeeds.

Lead Webhook Routing (n8n)
- Application ingress is `POST /api/lead`.
- The API route forwards validated lead payloads to n8n.
- Set these server environment variables in staging and production:
  - `N8N_WEBHOOK_URL`
  - `N8N_WEBHOOK_SECRET`
  - `TURNSTILE_SECRET_KEY`
- Optional:
  - `ALLOWED_ORIGIN` for cross-origin posting (comma-separated origins)

Lead Payload Contract (v2)
- Required shape:
  - `version: "v2"`
  - `formType: "contact-lead" | "financing-calculator" | "special-offer" | "feedback" | "referral"`
  - `submittedAt` (ISO timestamp)
  - `source.page`
  - `contact.firstName`, `contact.lastName`
  - `contact.email` for non-`contact-lead` forms
  - `contact.email` or `contact.phone` for `contact-lead`
  - `smsConsent.projectSms`, `smsConsent.marketingSms` (`yes` or `no`)
  - `antiSpam.cfToken`
- Optional sections:
  - `source.{utm_source,utm_medium,utm_campaign,ua,tz}`
  - `contact.phone`
  - `address.{address1,address2,city,state,zip}`
  - `details` (form-specific fields)
  - `antiSpam.hp_field`
- Referral submissions:
  - Root `contact` is the referrer.
  - `details.referredHomeowner` is the referred homeowner.
  - Referral forms do not show SMS consent UI and submit `smsConsent.projectSms: "no"` and `smsConsent.marketingSms: "no"`.

Sitemaps & Robots
- Production
  - robots.txt: Allow all, sitemap at `${NEXT_PUBLIC_BASE_URL}/sitemap_index`.
  - app/robots.ts uses `site_settings.site_url` and applies optional `site_settings.robots_disallow` rules.
- Staging
  - robots.txt: Disallow all. Sitemap endpoints exist but are not to be crawled.
  - You can enable sitemap preview endpoints by setting:
    - NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true
  - Preview adds `X-Robots-Tag: noindex, nofollow` on sitemap responses.
  - The `/faq` archive is part of the static sitemap; individual FAQ anchors are not sitemap URLs.

Static sitemap (pages not in CMS)
- Generated at build by `scripts/make-static-sitemap.mjs` → `public/__sitemaps/static-routes.json`.
- Endpoint reads the manifest at request time: `/sitemap_index/static`.
- If empty:
  - Confirm prebuild ran (visible in build logs "Wrote N static routes").
  - Confirm middleware is skipping `^/__sitemaps/` and `^/sitemap_index`.
  - Confirm `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true` on staging if needed.

Security headers & CSP
- next.config.mjs adds security headers for all requests.
- CSP is read from `site_settings.content_security_policy` and enforced with `Content-Security-Policy`.
- Production builds fail when Directus is unavailable, the client record is not unique, or CSP is empty.
- If something breaks after the Coolify cutover, check browser console CSP violations first.
- `/instant-quote` embeds QuickQuote with contractor id `d9d4c0ba-e0cc-4f1c-a12e-5c30d9b2ce8d`.
- QuickQuote CSP dependencies:
  - Loader/runtime scripts: `qq.leadsbyquickquote.com`, `storage.googleapis.com`
  - API hosts: `quickquote-api-628343900656.us-central1.run.app`, `quickquote-api-223492134056.us-central1.run.app`, `quickquote-api-78479757910.us-central1.run.app`
  - Runtime dependencies: Google reCAPTCHA, Google Fonts, jsDelivr CSS, and possible HTTPS media assets.
- QuickQuote submissions are bridged into `lead_form_submitted` and `ads_lead_submit` dataLayer events as roof replacement conversions.

Cache/Invalidation
- Remaining WordPress GraphQL data uses Next fetch revalidation where configured.
  Directus blog content and special offers revalidate every 15 minutes; shared
  site content revalidates hourly.
- Static sitemap: regenerated on build; read dynamically per request.
- Published Directus redirects are fetched and validated by `next.config.mjs` at build time. Redirect changes require a new build.
- Static generation is limited to two workers with one page per worker at a time to avoid bursting WordPress or Directus.
- `site_settings.enable_site_analytics` controls whether the configured GTM and Meta Pixel scripts render.

llms.txt
- `scripts/generate-llms-txt.mjs` writes `public/llms.txt` verbatim from `site_settings.llms_txt` during prebuild.
- Empty or whitespace-only CMS content removes/skips the generated file.
- `public/llms.txt` is generated and gitignored; edit the Directus field rather than the build artifact.

GTMetrix/Analytics
- GTM loads only when `NEXT_PUBLIC_GTM_ID` is set and env permits.
- GA4 Enhanced Measurement should be enabled to track SPA route changes.

Coolify Smoke Checks
- Before DNS cutover:
  - App boots and `/robots.txt` returns 200.
  - `/`, `/contact-us`, `/sitemap_index`, `/sitemap_index/static`, one Directus
    blog post, and one remaining WP-backed dynamic page render.
  - `www.sonshineroofing.com` redirects to `sonshineroofing.com` once both domains point at Coolify.
  - Legacy redirects and configured 410 routes still behave correctly.
  - A deprecated static landing-page URL returns 404 without redirecting.
  - `/api/revalidate` rejects missing secrets and accepts a valid `REVALIDATE_SECRET`.
  - A lead form submission verifies Turnstile and reaches n8n.
- After DNS cutover:
  - TLS is valid on apex and `www`.
  - Production `robots.txt` allows crawling.
  - Static assets have long-lived cache headers.
  - `/api/*` responses are not cached.
  - GTM, Meta Pixel, maps, reviews, and external scripts load without CSP errors.
