# Repository purpose

This repository builds the production-facing SonShine Roofing frontend with Next.js, React, TypeScript, Tailwind, and a hybrid Directus/WordPress content layer. It also owns public lead capture, attribution and consent behavior, SEO and structured data, robots and sitemaps, and the frontend boundaries for n8n, Turnstile, analytics, QuickQuote, and Maps integrations.

## Source-of-truth boundaries

- Directus owns client-scoped blog posts/topics, site settings, fixed-route metadata in `website_pages`, the four root service-route metadata and navigation records in `services`, FAQs, special offers, legal copy, reviews, people, and build-time CSP, redirects, and `llms.txt` data. Next.js routes and components still own page body copy.
- WordPress/WPGraphQL remains authoritative for projects, glossary entries, videos, and location landing pages.
- Directus is the exclusive frontend source for blog and person records; do not add WordPress fallbacks for them. Legacy WordPress blog helpers and stale reference documentation are not evidence of a live frontend consumer.
- Shared Directus site content and special offers are build-only. Their changes require a new site build; the revalidation API deliberately rejects special-offer routes and the special-offer sitemap.
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
- `scripts/`: generated sitemap/`llms.txt`, content-contract verification, and retained migration tooling.
- `wordpress/`: a Relevanssi bridge reference and a draft headless-cleanup prototype. This directory is excluded from the Next.js image and is never authority to modify live WordPress.
- `next.config.mjs` and `Dockerfile`: redirects, security headers, images, bounded static generation, standalone output, and the Node 22 runtime.

## Local development

Use Node 22 and npm:

```sh
npm ci
npm run dev
```

There is no committed `.env.example`. Obtain required configuration through the approved secret channel; never invent credentials or copy live values into documentation. Meaningful CMS-backed testing needs the applicable Directus and WordPress variables. All `NEXT_PUBLIC_*` values are browser-visible and must never contain tokens or shared secrets.

`npm run dev`, `npm run build`, and `npm run build:codex` all invoke `scripts/prebuild.mjs` through their lifecycle scripts. That prebuild validates Directus route ownership and generates the static-route and `llms.txt` artifacts, so even local development needs the applicable CMS/network configuration.

## Validation

Run proportional checks:

```sh
npm run lint
npm run verify:directus-html
npm run verify:faq-html
npm run verify:person-html
npm run verify:person-seo
npm run verify:special-offer-indexing
npm run verify:build-only-revalidation
npm run build
```

`npm test` is only an alias for lint. `npm run build:codex` is available for the sandboxed Next.js build path, but its pre-lifecycle still performs the CMS-backed prebuild. `public/__sitemaps/static-routes.json` and `public/llms.txt` are generated and gitignored; never add them as source files. The retained person and blog migration/verification scripts reference removed manifests and are not runnable operational commands. Do not repair or run migration apply behavior without explicit authorization because it can write Directus records and files.

GitHub quality CI runs lint plus the Directus, FAQ, person HTML, person SEO, special-offer indexing, and build-only revalidation contract checks. It deliberately avoids CMS-backed route validation and builds that require production credentials.

## Content and data rules

- Keep every Directus query scoped by `DIRECTUS_CLIENT_SLUG`.
- Preserve the purpose-built sanitizer for Directus article/legal, FAQ, person, and WordPress glossary HTML. Do not replace parser-based text conversion with regex or render unsanitized CMS HTML.
- Require `directus_files.description` for every Directus image relation. Most adapters enforce this, but the special-offer adapter currently falls back to the offer title; treat that as a validation gap rather than weakening the policy.
- Legal-copy bodies begin at `h2`; the Next.js route owns the page `h1`.
- Keep content-specific redirects in Directus and code-controlled host/regex redirects in `next.config.mjs`.
- Scope each published FAQ to exactly one fixed page (`website_page`), one service (`service`), or globally by leaving both relations null. Never assign both. Route sections render global plus matching-owner FAQs; the archive groups General first and then owner labels.
- Directus `noindex` controls person robots metadata and person-sitemap inclusion. Indexable person records require the primary keyword in `focus_keywords`; do not infer current live CMS state from repository code.
- Special offers are force-static and build-only. Their stored `noindex` value alone controls robots metadata and special-offer sitemap inclusion; expiration disables claims and featured-popup eligibility but does not override indexing.
- The sitemap index includes `/sitemap_index/special-offer`. Person and special-offer children include only records with `noindex=false`, and the static sitemap excludes noindex fixed-page and service owners.
- Treat `public/llms.txt` and `public/__sitemaps/static-routes.json` as ignored generated build artifacts.
- Do not assume `/og-default.png` exists; it is referenced but not tracked at the current baseline.

## Security and privacy

- Lead handling includes identity, contact and address data, referral details, attribution IDs, IP address, SMS consent, and Turnstile tokens. Treat lead payloads and downstream n8n responses as sensitive business and personal data.
- Never log or place real leads, referrals, tokens, credentials, or webhook responses in fixtures, pull requests, issues, or notifications.
- Preserve Turnstile verification, honeypot behavior, origin checks, SMS consent, lead IDs, attribution, and n8n header authentication when changing lead flow.
- Prefer the `x-revalidate-secret` header over query-string secrets during authorized revalidation testing.
- Keep WordPress, Directus, n8n, Turnstile, and revalidation secrets server-only.
- Preserve CSP/security headers and the staging WordPress diagnostic endpoint's branch and host gates.
- Never copy or activate files from `wordpress/` in production without explicit WordPress write authorization and a separate review.
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
