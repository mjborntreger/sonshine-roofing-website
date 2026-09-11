# SonShine Roofing WPGraphQL Reference

`lib/content/wp.ts` is the adapter for the content that still comes from the
headless WordPress instance. This reference is intentionally limited to active
WordPress ownership. See [CONTENT.md](CONTENT.md) for Directus collections and
publication rules.

## Source boundary

WordPress/WPGraphQL remains authoritative for location landing pages.

Videos and categories, projects and their filter lists/media, blog posts, FAQs, people, sponsor features, roofing glossary terms, special
offers, shared site content, and fixed-page/service SEO are Directus-backed.
Although `wp.ts` still contains some legacy blog helpers and shared blog-shaped
types, public blog routes and archives read `lib/content/blog.ts`; do not add a
WordPress fallback.

## Runtime configuration

- `NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT` selects the endpoint and defaults to
  `https://wp.sonshineroofing.com/graphql`.
- `WP_BASIC_AUTH_USER` and `WP_BASIC_AUTH_PASS` optionally add Basic Auth on the
  server. Do not expose or set them unless WPGraphQL is protected.
- Development surfaces detailed GraphQL errors; production collapses them to a
  generic adapter error.

## Core fetch helper

`wpFetch(query, variables?, options?)` accepts either a numeric revalidation
interval or `{ revalidateSeconds, cache }`. The default interval is 600 seconds.
Basic Auth is attached only when both optional credentials exist. `cache:
"no-store"` suppresses the Next.js revalidation option.

```ts
const data = await wpFetch<MyQuery>(query, variables, {
  revalidateSeconds: 3600,
  cache: 'force-cache',
});
```

## Active route map

| Domain    | Primary adapter functions                                                                   | Public consumers                                                             |
| --------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Locations | `listLocationSlugs`, `getLocationBySlug`                                                    | `app/(site)/locations/[slug]`, location and image sitemaps                   |

## Locations

`listLocationSlugs(limit = 500)` pages through published location slugs.
`getLocationBySlug(slug)` reads the location content, dates, Rank Math SEO, and
the `locationAttributes` fields for the location name, landmarks, map, featured
reviews, and neighborhoods. The adapter normalizes nullable GraphQL connections
before they reach route components.

The location route combines this WordPress record with Directus-backed sponsor
features from `lib/content/sponsor-features.ts`. Their publishing and targeting
rules live in [CONTENT.md](CONTENT.md).

## Retained video migration source

WordPress video records remain available for migration recovery, but the current
frontend performs no standalone-video WordPress reads. Directus video records
and their project relations are packaged in the same deployment snapshot.
Existing WordPress GraphQL IDs remain compatibility aliases for library links.
See [the migration guide](docs/video-migration.md); retained source records do
not authorize restoring a WordPress fallback to the current frontend.

## Adapter rules

- Request taxonomy connections as `nodes { name slug }`; the shared mappers
  expect that shape.
- Preserve current cache intervals unless a verified invalidation requirement
  justifies changing them.
- Normalize nullable GraphQL records and connections in the adapter instead of
  leaking inconsistent payload shapes into React components.
- Keep WordPress diagnostics staging-gated and do not expose raw upstream
  errors in production.

## Staging diagnostic

`GET /api/wp-debug` returns data only when both gates pass:

- `VERCEL_GIT_COMMIT_REF` equals `WP_DEBUG_ALLOWED_BRANCH`, which defaults to
  `staging`; and
- the request `x-forwarded-host` or `host` equals `WP_DEBUG_ALLOWED_HOST`, which
  defaults to `staging.sonshineroofing.com`.

A missing or mismatched value returns 404. Keep this diagnostic disabled on the
production branch and host.

## Repository-held WordPress artifacts

- `wordpress/graphql-relevanssi-bridge.php` contains the WordPress-side search
  bridge expected by the adapter's search and facet behavior. The repository
  does not establish whether it is deployed.
- `wordpress/sonshine-headless-cleanup.php` identifies itself as a draft
  prototype and is not an installation runbook.

Applying either file changes the production WordPress control plane and requires
explicit authorization and a separate review.
