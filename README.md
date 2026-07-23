# SonShine Roofing

Production-facing Next.js application for SonShine Roofing. It owns the public
site, lead capture, attribution and consent, SEO, structured data, sitemaps, and
the frontend adapters for Directus and WordPress.

## Architecture

- Next.js 16 runs as a Node 22 standalone image on Coolify.
- Directus is the primary content platform. It owns shared site content, fixed
  page and service SEO, blog posts, FAQs, people, roofing glossary terms,
  sponsor features, special offers, legal copy, navigation, and redirects.
- WordPress/WPGraphQL remains authoritative for projects, videos, and location
  landing pages.
- `POST /api/lead` validates public form submissions, verifies Turnstile, and
  forwards the normalized v2 payload to n8n.

See [CONTENT.md](CONTENT.md) before changing content ownership or CMS behavior.

## Local development

Use Node 22 and install the locked dependency tree:

```bash
npm ci
npm run dev
```

The application needs the environment described in [DEPLOY.md](DEPLOY.md) to
read live CMS content. Do not put secrets in public variables or commit local
environment files.

## Validation

```bash
npm run lint
npm test
```

`npm test` currently aliases lint. Run the relevant `verify:*` command from
`package.json` when changing a sanitizer, SEO rule, or cache/revalidation
contract. Use `npm run build` for full confidence when the credentialed CMS
environment is available; `npm run build:codex` supplies the sandbox fetch
proxy when that contract is needed.

Build presteps generate `public/llms.txt` and
`public/__sitemaps/static-routes.json`. Both files are ignored build artifacts,
not authoring sources.

## Repository guides

- [CONTENT.md](CONTENT.md): content ownership, Directus authoring rules, and
  publication behavior.
- [DEPLOY.md](DEPLOY.md): Coolify configuration, environment variables, cache
  behavior, and deployment smoke checks.
- [OPS.md](OPS.md): public lead ingress and the normalized v2 payload contract.
- [SEO.md](SEO.md): robots, sitemap, metadata, and structured-data behavior.
- [sonshine-graphql-reference.md](sonshine-graphql-reference.md): the remaining
  WordPress/WPGraphQL surface.
- [SECURITY.md](SECURITY.md): private reporting and safe-testing expectations.
- [AGENTS.md](AGENTS.md): repository-specific automation and maintenance rules.

Directus, WordPress, n8n, Coolify, revalidation, analytics, and production lead
flows are external control planes. Do not mutate or deploy them without explicit
authorization for that action.
