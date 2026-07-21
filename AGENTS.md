# Repository purpose

This repository is the production-facing SonShine Roofing Next.js application.
It owns public routes, lead capture, attribution and consent behavior, SEO,
structured data, sitemaps, analytics integration, and a hybrid Directus and
WordPress content layer. Coolify builds the standalone Docker image on Node 22
and serves it on port 3000.

## Sources of Truth

- Read `CONTENT.md` before changing content ownership.
- Directus, scoped by `DIRECTUS_CLIENT_SLUG`, owns blog posts/topics, site
  settings, fixed-page SEO, services, navigation, FAQs, redirects, special
  offers, legal copy, people, and their media.
- WordPress/WPGraphQL remains authoritative for projects, glossary entries,
  videos, and location landing pages.
- Local Next.js code owns route composition, components, body copy not yet
  migrated, and the normalized operational schedule in
  `lib/contact-hours.ts`.
- Directus is the exclusive frontend source for blog and person records. Do not
  add a WordPress fallback for those areas.
- Directus content described as build-only does not become public until a new
  site build is deployed.

## Important Paths

- `app/(site)`: ordinary public routes and shared site layout.
- `app/(standalone)`: isolated standalone experience.
- `app/api`: lead, revalidation, resource, and staging diagnostic boundaries.
- `app/sitemap_index`: sitemap index and content-specific children.
- `components/lead-capture` and `lib/lead-capture`: forms, attribution,
  consent, validation, identifiers, and payload types.
- `lib/content`: Directus/WordPress adapters and HTML sanitizers.
- `lib/seo` and `lib/telemetry`: metadata/schema and analytics behavior.
- `scripts`: generated artifacts, content verification, and migrations.
- `next.config.mjs` and `Dockerfile`: redirects, headers, standalone output,
  build behavior, and Coolify runtime.

## Validation

Use Node 22 and install with `npm ci`.

- Baseline: `npm run lint`; `npm test` is currently an alias for lint.
- Sanitizer/SEO work: run the applicable
  `verify:directus-html`, `verify:faq-html`, `verify:person-html`,
  `verify:person-seo`, `verify:special-offer-indexing`, or
  `verify:build-only-revalidation` script.
- Full confidence: run a credentialed `npm run build`.
- Sandboxed Codex build: use `npm run build:codex` when its proxy contract is
  required.

Build presteps generate or remove sitemap and `llms.txt` artifacts and can
dirty a worktree. Inspect generated changes and never include them
accidentally. Do not run `migrate:persons:apply`; it writes to Directus.

## Content, Security, and Privacy

- Preserve tenant scoping, publication checks, described-image requirements,
  and the purpose-built sanitizer for every CMS HTML surface.
- Never render unsanitized CMS HTML or replace parser-based text extraction
  with regular-expression tag stripping.
- Lead routes process contact and referral details, addresses, attribution,
  IP-derived data, SMS consent, and Turnstile tokens. Use synthetic submissions
  only and never log or copy real payloads into fixtures, PRs, or notifications.
- Preserve Turnstile, honeypot, allowed-origin, SMS-consent, lead-ID, and n8n
  authentication behavior when touching lead flow.
- Keep Directus, WordPress, n8n, Turnstile, revalidation, Maps, and other
  secrets server-only. Prefer header-based revalidation authorization.
- Preserve CSP/security headers, staging-only diagnostic gates, analytics
  consent, and safe external URL validation.

## Git and pull-request workflow

- Start from the intended committed `main` revision in an isolated worktree.
  The primary checkout may contain unrelated active work; never import it.
- Keep one focused maintenance branch and draft PR. Exclude user changes,
  generated prebuild output, local environment files, CMS exports, and
  migration artifacts.
- State source-of-truth impact, evidence, checks, limitations, PII/security
  considerations, and deployment impact.
- Review the diff for secrets before pushing. Automated maintenance may push
  and open a draft PR only when its prompt authorizes it; never merge it.

## Deployment Boundary

Directus, WordPress, n8n, Coolify, analytics, revalidation, and production lead
flows are external control planes. Do not mutate, deploy, redeploy, publish,
revalidate production, submit real leads, or run migration apply commands
without explicit authorization for that exact action.
