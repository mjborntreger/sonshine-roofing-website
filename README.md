# SonShine Roofing

Production-facing Next.js application for SonShine Roofing. It owns the public
site, lead capture, attribution and consent, SEO, structured data, sitemaps, and
the frontend adapters for Directus and WordPress.

## Architecture

- Next.js 16 runs as a Node 22 standalone image on Coolify.
- Directus is the primary content platform. It owns shared site content, fixed
  page and service SEO, blog posts, FAQs, people, roofing glossary terms,
  sponsor features, projects, reviews and review-carousel settings, special
  offers, legal copy, navigation, and published CMS redirects.
- WordPress/WPGraphQL remains authoritative for standalone video entries and
  location landing pages.
- Next.js configuration and `proxy.ts` retain code-owned platform redirects and
  normalized legacy redirect/410 behavior.
- `POST /api/lead` validates public form submissions, verifies Turnstile, and
  forwards the normalized v2 payload to n8n.

See [CONTENT.md](CONTENT.md) before changing content ownership or CMS behavior.

## Local development

Use Node 22 and install the locked dependency tree:

```bash
npm ci
npm run dev
```

`npm run dev` first runs the CMS-backed prebuild. Provide the Directus variables
described in [DEPLOY.md](DEPLOY.md) before startup; the prebuild validates route
ownership and regenerates the ignored static-sitemap and `llms.txt` artifacts.
Do not put secrets in public variables or commit local environment files.

## Validation

```bash
npm run lint
npm run typecheck
npm run verify:tailwind-utilities
npm run verify:archive-controls
```

`npm test` currently aliases lint. Run the relevant additional `verify:*`
command from `package.json` when changing a sanitizer, SEO rule, or
cache/revalidation contract. Use `npm run build` for full confidence when the
credentialed CMS environment is available; `npm run build:codex` supplies the
sandbox fetch proxy when that contract is needed.

Build presteps generate `public/llms.txt`,
`public/__sitemaps/static-routes.json`, and the private `.generated/projects.json`
project snapshot. These are ignored build artifacts, not authoring sources.
The snapshot travels with each deployment and powers every project consumer,
including runtime resource requests. Project CMS changes require a new build
and deployment. A failed or incomplete Directus project read stops prebuild.

## Archive controls

Projects, blog posts, and videos share a native single-selection search form.
Editing fields changes only draft values; Search applies every field together,
updates the URL, and restarts pagination. Clear all immediately resets the form
and results. Browser Back/Forward restores applied searches. Legacy URLs with
multiple values keep the first valid option per filter and display a notice.
Unrelated query parameters, including shared-video links, are preserved.

Option lists stay fixed and omit facet counts. Video material/location fields
are available for all video types or roofing projects; choosing another type
clears and disables them. The content adapters and project snapshot remain the
source for matching and pagination.

`verify:archive-controls` runs the actual shared React controller in JSDOM with
synthetic results and a substituted Next navigation hook. It covers submission,
reset, request races, retry, history, legacy links, video dependencies, and the
shared accordion's readable fallback when animations cannot run. It needs no CMS
credentials. Also check native controls, layout, focus, Enter submission, and
reduced motion in a browser when changing this UI.

## Repository guides

- [CONTENT.md](CONTENT.md): content ownership, Directus authoring rules, and
  publication behavior.
- [DEPLOY.md](DEPLOY.md): Coolify configuration, environment variables, cache
  behavior, and deployment smoke checks.
- [OPS.md](OPS.md): public lead ingress and the normalized v2 payload contract.
- [SEO.md](SEO.md): robots, sitemap, metadata, and structured-data behavior.
- [docs/gtm-datalayer.md](docs/gtm-datalayer.md): Google Ads conversion events,
  value mapping, and browser-side deduplication.
- [sonshine-graphql-reference.md](sonshine-graphql-reference.md): the remaining
  WordPress/WPGraphQL surface.
- [SECURITY.md](SECURITY.md): private reporting and safe-testing expectations.
- [AGENTS.md](AGENTS.md): repository-specific automation and maintenance rules.

Directus, WordPress, n8n, Coolify, revalidation, analytics, and production lead
flows are external control planes. Do not mutate or deploy them without explicit
authorization for that action.
