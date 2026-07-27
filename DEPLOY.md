# Deployment Runbook

## Coolify production deployment

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
- Legacy Cloudflare cutover notes:
  - These describe the original hosting migration. Confirm the current DNS and
    rollback targets outside this repository before using them as instructions.
  - Keep records DNS-only, not proxied.
  - Point apex `A` record to the Coolify server IPv4.
  - Point `www` to the apex with a `CNAME`, or use a matching `A` record.
  - Lower TTL before production cutover.
  - Ensure ports `80` and `443` reach Coolify/Traefik for Let's Encrypt.
- Legacy rollback:
  - The original migration plan kept Vercel live until Coolify passed smoke
    checks and used DNS for rollback.
  - Do not assume Vercel remains a valid DNS rollback target without external
    verification.

## Environments

- NEXT_PUBLIC_ENV=production → Production
- NEXT_PUBLIC_ENV=staging → Staging (or anything not "production")

## Coolify environment variables

- Mark these as build-time and runtime variables because Next bakes `NEXT_PUBLIC_*` values into the client bundle during `next build`:
  - `NEXT_PUBLIC_ENV=production`
  - `NEXT_PUBLIC_BASE_URL=https://sonshineroofing.com`
  - `NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT`
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - `NEXT_PUBLIC_GTM_ID`
  - `NEXT_PUBLIC_META_PIXEL_ID`
  - `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`
- Mark these server variables as build-time and runtime variables. Directus
  content and redirects are read during builds, and the same values remain
  available if a route renders at runtime:
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
- Optional public build-time and runtime preview variables:
  - `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true` exposes sitemap endpoints in a
    non-production environment with noindex response headers.
  - `NEXT_PUBLIC_ENABLE_GTM_PREVIEW=true` permits analytics on an allowed
    non-production host when Directus also enables site analytics.
- `NEXT_PUBLIC_SITE_URL` is a legacy origin fallback. Prefer
  `NEXT_PUBLIC_BASE_URL` for new configuration.
- Do not set `WP_BASIC_AUTH_USER` or `WP_BASIC_AUTH_PASS` unless WPGraphQL becomes
  protected. The current Dockerfile does not pass these values into the build
  stage, so protected build-time queries would also require a Dockerfile change.

## Directus reviews

- `ReviewsCarousel` reads published five-star Google records from Directus for `DIRECTUS_CLIENT_SLUG`.
- The default carousel limit and Google Business Profile link come from the matching `reviews_carousels` record.
- Review and carousel reads use `force-cache` without ISR options or cache tags.
  The existing review workflow and revalidation endpoint do not supply a
  Directus fetch tag.

## Lead delivery (n8n)

- Set `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, and `TURNSTILE_SECRET_KEY` in
  staging and production. Use `ALLOWED_ORIGIN` for the comma-separated browser
  origin allowlist.
- [OPS.md](OPS.md) is the canonical public ingress and normalized v2 payload
  contract. Keep deployment values here and payload semantics there.

## Sitemaps and robots

- Production
  - robots.txt: Allow all, sitemap at `${NEXT_PUBLIC_BASE_URL}/sitemap_index`.
  - app/robots.ts uses `site_settings.site_url` and applies optional `site_settings.robots_disallow` rules.
- Staging
  - robots.txt: Disallow all. Sitemap endpoints exist but are not to be crawled.
  - You can enable sitemap preview endpoints by setting:
    - NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true
  - Preview adds `X-Robots-Tag: noindex, nofollow` on sitemap responses.
  - The `/faq` archive is part of the static sitemap; individual FAQ anchors are not sitemap URLs.

## Static sitemap (pages not in CMS)

- Generated at build by `scripts/make-static-sitemap.mjs` → `public/__sitemaps/static-routes.json`.
- Endpoint reads the manifest at request time: `/sitemap_index/static`.
- If empty:
  - Confirm prebuild ran (visible in build logs "Wrote N static routes").
  - Confirm `proxy.ts` remains scoped to its explicit 410 routes and does not
    match `^/__sitemaps/` or `^/sitemap_index`.
  - Confirm `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true` on staging if needed.

## Security headers and CSP

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

## Cache and invalidation

- Remaining WordPress GraphQL data uses Next fetch revalidation where configured.
- Directus fetchers use ordinary `force-cache` reads without ISR options or
  cache tags, so a new build is the supported publication path for current
  Directus changes. The authenticated endpoint accepts paths and tags for other
  consumers, but explicitly rejects special-offer routes and their sitemap as
  build-only.
- Static sitemap: regenerated on build; read dynamically per request.
- Published Directus redirects are fetched and validated by `next.config.mjs` at build time. Redirect changes require a new build.
- Static generation is limited to two workers with one page per worker at a time to avoid bursting WordPress or Directus.
- `site_settings.enable_site_analytics` controls whether the configured GTM and Meta Pixel scripts render.

## llms.txt

- `scripts/generate-llms-txt.mjs` writes `public/llms.txt` verbatim from `site_settings.llms_txt` during prebuild.
- Empty or whitespace-only CMS content removes/skips the generated file.
- `public/llms.txt` is generated and gitignored; edit the Directus field rather than the build artifact.

## Analytics

- GTM loads only when `NEXT_PUBLIC_GTM_ID` is set and env permits.
- GA4 Enhanced Measurement should be enabled to track SPA route changes.

## Coolify smoke checks

- Before promoting a build:
  - App boots and `/robots.txt` returns 200.
  - `/`, `/contact-us`, `/sitemap_index`, `/sitemap_index/static`, one Directus
    blog post, and one remaining WP-backed dynamic page render.
  - `www.sonshineroofing.com` redirects to `sonshineroofing.com` once both domains point at Coolify.
  - Legacy redirects and configured 410 routes still behave correctly.
  - A deprecated static landing-page URL returns 404 without redirecting.
  - `/api/revalidate` rejects missing secrets and accepts a valid `REVALIDATE_SECRET`.
  - An explicitly authorized synthetic lead submission verifies Turnstile and
    reaches n8n.
- After promotion:
  - TLS is valid on apex and `www`.
  - Production `robots.txt` allows crawling.
  - Static assets have long-lived cache headers.
  - `/api/*` responses are not cached.
  - GTM, Meta Pixel, maps, reviews, and external scripts load without CSP errors.
