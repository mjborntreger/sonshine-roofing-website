# Repository purpose

This repository builds the production-facing SonShine Roofing frontend with Next.js, React, TypeScript, Tailwind, and a hybrid Directus/WordPress content layer. It also owns public lead capture, attribution and consent behavior, SEO and structured data, robots and sitemaps, and the frontend boundaries for n8n, Turnstile, analytics, QuickQuote, and Maps integrations.

## Source-of-truth boundaries

- Directus owns client-scoped blog posts/topics, site settings, fixed-page metadata, services, navigation, FAQs, special offers, legal copy, reviews, people, and build-time CSP, redirects, and `llms.txt` data.
- WordPress/WPGraphQL remains authoritative for projects, glossary entries, videos, and location landing pages.
- Directus is the exclusive frontend source for blog and person records; do not add WordPress fallbacks for them.
- Local Next.js routes and components own presentation and body copy not yet migrated. `lib/contact-hours.ts` intentionally owns normalized schedules.
- Directus, WordPress, n8n, Coolify, analytics, and other production control planes require separate, explicit write authorization.

## Architecture and important paths

- `app/(site)/`: public pages and the shared site layout.
- `app/(standalone)/`: isolated standalone routes and layout.
- `app/api/`: lead, pagination, revalidation, and gated diagnostic endpoints.
- `app/sitemap_index/`: sitemap index and content-specific children.
- `components/lead-capture/` and `lib/lead-capture/`: forms, attribution, consent, validation, and lead types.
- `lib/content/`: CMS adapters and purpose-built HTML sanitizers.
- `lib/seo/`: metadata, schema, canonical, host, and environment helpers.
- `lib/telemetry/`: analytics loading and events.
- `scripts/`: generated sitemap/`llms.txt`, content verification, and migration tooling.
- `next.config.mjs` and `Dockerfile`: redirects, security headers, images, bounded static generation, standalone output, and the Node 22 runtime.

## Local development

Use Node 22 and npm:

```sh
npm ci
npm run dev
```

There is no committed `.env.example`. Obtain required configuration through the approved secret channel; never invent credentials or copy live values into documentation. Meaningful CMS-backed testing needs the applicable Directus and WordPress variables. All `NEXT_PUBLIC_*` values are browser-visible and must never contain tokens or shared secrets.

## Validation

Run proportional checks:

```sh
npm run lint
npm run verify:directus-html
npm run verify:faq-html
npm run verify:person-html
npm run verify:person-seo
npm run build
```

`npm test` is only an alias for lint. `npm run build:codex` is available for the sandboxed build path, but its pre-lifecycle still runs `scripts/prebuild.mjs`. Builds fetch CMS content and can rewrite tracked `public/__sitemaps/static-routes.json` or `public/llms.txt`; inspect and exclude incidental generated diffs. `npm run migrate:persons:dry-run` reads live systems. Never run `npm run migrate:persons:apply` without explicit authorization because it writes Directus records and files.

GitHub quality CI runs lint plus the Directus, FAQ, person HTML, and person SEO contract checks. It deliberately avoids CMS-backed builds that require production credentials.

## Content and data rules

- Keep every Directus query scoped by `DIRECTUS_CLIENT_SLUG`.
- Preserve the purpose-built sanitizer for Directus article/legal, FAQ, person, and WordPress glossary HTML. Do not replace parser-based text conversion with regex or render unsanitized CMS HTML.
- Require `directus_files.description` for every Directus image relation.
- Legal-copy bodies begin at `h2`; the Next.js route owns the page `h1`.
- Keep content-specific redirects in Directus and code-controlled host/regex redirects in `next.config.mjs`.
- Treat `public/llms.txt` and `public/__sitemaps/static-routes.json` as generated build artifacts, even while they remain tracked.
- Do not assume `/og-default.png` exists; it is referenced but not tracked at the current baseline.

## Security and privacy

- Lead handling includes identity, contact and address data, referral details, attribution IDs, IP address, SMS consent, and Turnstile tokens. Treat lead payloads and downstream n8n responses as sensitive business and personal data.
- Never log or place real leads, referrals, tokens, credentials, or webhook responses in fixtures, pull requests, issues, or notifications.
- Preserve Turnstile verification, honeypot behavior, origin checks, SMS consent, lead IDs, attribution, and n8n header authentication when changing lead flow.
- Prefer the `x-revalidate-secret` header over query-string secrets during authorized revalidation testing.
- Keep WordPress, Directus, n8n, Turnstile, and revalidation secrets server-only.
- Preserve CSP/security headers and the staging WordPress diagnostic endpoint's branch and host gates.
- Do not submit real leads, exercise production revalidation, probe external integrations, or run scanner traffic against public forms.

## Git and pull-request workflow

- Always start automated work from a clean isolated worktree at the intended `main` commit; the primary checkout may contain active migration work.
- Keep automated maintenance on one open maintenance branch and pull request per repository when possible.
- Never include unrelated user changes, local environment files, generated prebuild output, CMS exports, migration artifacts, or customer data.
- Flag migration scripts and deployment configuration for human review rather than exercising them.
- Include evidence paths, validation commands, scan range, and residual uncertainty in pull-request summaries.
- Do not merge, deploy, or mutate external control planes from a repository-maintenance worker.

## Deployment boundary

Production is a Coolify deployment from `main` using a Node 22 standalone Docker image on port `3000`. Builds can read live Directus and WordPress content and generate deployment artifacts. A successful build never authorizes deployment, revalidation, DNS/Coolify changes, CMS publishing, or migration apply commands.
