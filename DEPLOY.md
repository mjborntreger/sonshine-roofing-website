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

- `NEXT_PUBLIC_ENV=production` enables production behavior.
- Any other value, including the conventional `staging`, is non-production.

## Coolify environment variables

Verified against Coolify key names and flags on September 22, 2026: production
has the 15 keys below. Preview has the same keys plus the GTM preview flag.
Coolify currently marks every configured key for both build time and runtime;
the table describes where the application consumes each value.

| Key | Application use |
| --- | --- |
| `NEXT_PUBLIC_ENV` | Build-time environment gate; use `production` for production. |
| `NEXT_PUBLIC_BASE_URL` | Public site origin used during the build. |
| `NEXT_PUBLIC_SITE_URL` | Retained origin fallback; prefer `NEXT_PUBLIC_BASE_URL`. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public form widget configuration, baked into the build. |
| `NEXT_PUBLIC_GTM_ID` | Public GTM ID, baked into the build. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Public Meta Pixel ID, baked into the build. |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Public map embed configuration, baked into the build. |
| `DIRECTUS_URL` | Build-time CMS endpoint. |
| `DIRECTUS_CLIENT_SLUG` | Build-time tenant scope. |
| `DIRECTUS_TOKEN` | Server-only build credential. |
| `YOUTUBE_API_KEY` | Optional server-only metadata enrichment during the build; currently configured. |
| `N8N_WEBHOOK_URL` | Runtime lead-delivery endpoint. |
| `N8N_WEBHOOK_SECRET` | Runtime lead-delivery credential. |
| `TURNSTILE_SECRET_KEY` | Runtime form-token verification credential. |
| `ALLOWED_ORIGIN` | Runtime comma-separated browser-origin allowlist. |

`NEXT_PUBLIC_ENABLE_GTM_PREVIEW` remains configured only for preview builds.
It permits analytics on an allowed non-production host when Directus also
enables site analytics. Keep its Docker build argument for those builds.

The standalone application reads its sealed content bundle and needs no
Directus credential or YouTube metadata request to serve it. Public build
values require a new build when changed. Runtime lead-delivery configuration
must remain available to the deployed container.

WordPress connection/authentication, sitemap-preview and revalidation keys are
retired from the Coolify setup. The Dockerfile no longer passes WordPress or
sitemap-preview arguments. Sitemaps remain disabled outside production in this
configuration. The retained `/api/revalidate` compatibility endpoint returns
401 for GET and POST without a configured secret and never invalidates content.
Publish CMS changes with a successful build and deployment.

## Lead delivery (n8n)

- Set `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, and `TURNSTILE_SECRET_KEY` in
  staging and production. Use `ALLOWED_ORIGIN` for the comma-separated browser
  origin allowlist.
- [OPS.md](OPS.md) is the canonical public ingress and normalized v2 payload
  contract. Keep deployment values here and payload semantics there.

## Static sitemap (pages not in CMS)

- [SEO.md](SEO.md) is the canonical robots and sitemap behavior reference.
- Generated at build by `scripts/make-static-sitemap.mjs` → `public/__sitemaps/static-routes.json`.
- `/sitemap_index/static` is prerendered from that local, sealed manifest.
- If empty:
  - Confirm prebuild ran (visible in build logs "Wrote N static routes").
  - Confirm `proxy.ts` passes `^/__sitemaps/` and `^/sitemap_index` through
    unchanged; only the listed legacy paths should redirect or return 410.
  - Check `NEXT_PUBLIC_ENV`: sitemap endpoints intentionally return 404 in
    the current non-production configuration.

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

- Every Directus-owned surface uses the deployment bundle described in
  [CONTENT.md](CONTENT.md#deployment-only-publishing-contract). Build-only loaders
  use uncached, fully paginated reads; runtime adapters do not fetch CMS records.
- Content pages and sitemap handlers use `revalidate = false`; CMS detail routes
  use `dynamicParams = false`. The blog resource API searches the packaged posts.
  The static sitemap reads its packaged manifest locally during prerendering.
- Both `/api/revalidate` methods reject authenticated calls with 410 and an
  instruction to build/deploy. Missing or incorrect credentials receive 401.
  There are no runtime path, tag, or layout invalidations.
- `npm run build` captures, validates and seals the content bundle, builds Next,
  and checks the generated prerender manifest. Docker copies all private
  `.generated` artifacts and public build artifacts into the standalone image.
  Node startup validates the bundle hashes before serving requests.
- Run `npm run verify:deployment-builds` for two synthetic production builds with
  shared build caches. The tests verify changed/new/removed content across releases,
  cold restarts, no runtime network reads, complete page inventories and fail-closed
  bundle validation. CI runs this without CMS credentials.
- For release acceptance, use Node 22, run all applicable `verify:*` checks, then
  `NEXT_PUBLIC_ENV=production npm run build` and
  `npm run verify:deployment-runtime`. The latter requires production sitemaps to
  be enabled in the build and runs an isolated copy of the standalone artifact.
- After an authorized main push, verify the successful Coolify deployment and
  running image commit. Check its bundle and prerender manifests, public routes,
  metadata, blog resource results, sitemaps and unknown-slug 404s. Compare content
  hashes with the reviewed candidate, accounting explicitly for commit-based
  static-sitemap timestamps and any intervening CMS edits.
- Failed builds leave the current deployment intact. Roll back by restoring the
  prior complete application image with its matching bundle; rebuilding an old
  Git commit against today's CMS is not a content rollback.
- Existing remote-media delivery and clock-based behavior remain documented
  exceptions. Keep old media files and upload new replacements under new IDs.
- Retired webhook callers may receive 410. Do not change production n8n workflows
  as part of this frontend contract; separately authorized integration changes
  can adopt deployment-based publishing.

## Project releases and rollback

- Before a production release, use Node 22 to run `npm ci`, lint, the project and
  applicable verification scripts, and a credentialed `npm run build`. Preview
  that production build locally and check detail pages, full galleries, filters,
  pagination, videos, testimonials, SEO, and project/image/video sitemaps. Rebuild
  if content or code changes after verification.
- `scripts/generate-project-snapshot.mjs` runs before route validation and Next's
  build. It pages through every published, client-scoped project and managed
  list and explicitly expands all ordered gallery entries. Missing configuration,
  empty projects, invalid relations, missing image descriptions, or failed CMS
  reads stop the build and remove any stale project snapshot.
- Deploy the verified revision through Coolify. Project edits and new slugs stay
  invisible until that release; `/api/revalidate` cannot publish them.
- Keep the prior deployment and its referenced media until acceptance. A frontend
  rollback must match the database schema; old images that request retired columns
  cannot be rebuilt against the reduced schema. Restore a compatible revision or
  recover the matching database through the existing VPS backup system.
- Future uploads use the active Unified Image pipeline. File-description metadata
  remains independent of binary optimization; preserve rights and attribution.
- Canonical scope triggers remain in `scripts/sql/roofing-project-scope.sql`.
  Editorial date rules are in `docs/editorial-date-invariants.sql`. Apply privileged
  SQL only under explicit schema-change authorization, with the owning schema and
  tests verified first. One-time import/date-normalization commands are retired.

## llms.txt

- `scripts/generate-llms-txt.mjs` writes `public/llms.txt` verbatim from `site_settings.llms_txt` during prebuild.
- Empty or whitespace-only CMS content removes/skips the generated file.
- `public/llms.txt` is generated and gitignored; edit the Directus field rather than the build artifact.

## Analytics

- GTM and Meta Pixel render together only when Directus
  `site_settings.enable_site_analytics` is enabled, both public IDs are set, the
  browser host matches the configured site origin, and the environment is
  production or `NEXT_PUBLIC_ENABLE_GTM_PREVIEW` is enabled.
- This repository loads GTM but does not configure GA4. Validate GA4 and SPA
  route-change tracking in the external GTM/GA4 control plane.
- [docs/gtm-datalayer.md](docs/gtm-datalayer.md) is the canonical browser event,
  conversion-value, and deduplication reference.

## Coolify smoke checks

- Before promoting a build:
  - App boots and `/robots.txt` returns 200.
  - `/`, `/contact-us`, `/sitemap_index`, `/sitemap_index/static`, one Directus
    blog post, and one Directus-backed location hub render.
  - `www.sonshineroofing.com` redirects to `sonshineroofing.com` once both domains point at Coolify.
  - Legacy redirects and configured 410 routes still behave correctly.
  - A deprecated static landing-page URL returns 404 without redirecting.
  - `/api/revalidate` returns 401 for GET and POST with the current secret-free
    configuration, without invalidating content.
  - An explicitly authorized synthetic lead submission verifies Turnstile and
    reaches n8n.
- After promotion:
  - TLS is valid on apex and `www`.
  - Production `robots.txt` allows crawling.
  - Static assets have long-lived cache headers.
  - `/api/*` responses are not cached.
  - GTM, Meta Pixel, maps, reviews, and external scripts load without CSP errors.
