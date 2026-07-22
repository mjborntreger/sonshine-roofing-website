# SonShine Roofing WPGraphQL Reference

`lib/content/wp.ts` is the adapter for the content that still comes from the
headless WordPress instance. This reference is intentionally limited to active
WordPress ownership. See [CONTENT.md](CONTENT.md) for Directus collections and
publication rules.

## Source boundary

WordPress/WPGraphQL remains authoritative for:

- projects and their filter taxonomies;
- video-library entries and project-sourced videos; and
- location landing pages.

Blog posts, FAQs, people, roofing glossary terms, special offers, shared site
content, and fixed-page/service SEO are Directus-backed. Although `wp.ts` still
contains some legacy blog helpers and shared blog-shaped types, public blog
routes and archives read `lib/content/blog.ts`; do not add a WordPress fallback.

## Runtime configuration

- `NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT` selects the endpoint and defaults to
  `https://wp.sonshineroofing.com/graphql`.
- `WP_BASIC_AUTH_USER` and `WP_BASIC_AUTH_PASS` optionally add Basic Auth on the
  server. Do not expose or set them unless WPGraphQL is protected.
- `WP_PROJECT_BASE` controls the project URI prefix and defaults to `project`.
  Keep it aligned with the WordPress custom-post-type rewrite.
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
| Locations | `listLocationSlugs`, `getLocationBySlug`, `listSponsorFeaturesByServiceArea`                | `app/(site)/locations/[slug]`, location and image sitemaps                   |
| Projects  | `listProjectSlugs`, `getProjectBySlug`, archive/filter helpers                              | `app/(site)/project/[slug]`, project archive/API, project and image sitemaps |
| Videos    | `listRecentVideoEntries`, `getVideoEntryBySlug`, `listProjectVideos`, `listVideoItemsPaged` | `app/(site)/video-library`, resources API, video sitemap                     |

## Locations

`listLocationSlugs(limit = 500)` pages through published location slugs.
`getLocationBySlug(slug)` reads the location content, dates, Rank Math SEO, and
the `locationAttributes` fields for the location name, landmarks, map, featured
reviews, and neighborhoods. The adapter normalizes nullable GraphQL connections
before they reach route components.

`listSponsorFeaturesByServiceArea` first reads service-area-specific sponsor
records and then fills any shortfall from the configured fallback area. Keep
the returned list deduplicated.

## Projects

`buildProjectUri(slug)` creates `/${WP_PROJECT_BASE}/${slug}/` because
`getProjectBySlug` queries the project by `idType: URI`. The full mapper reads:

- content, dates, featured image, and Rank Math SEO;
- `projectDetails`, including description, product links, gallery images, and
  customer testimonial;
- `projectVideoInfo.youtubeUrl`; and
- `projectFilters` for material type, roof color, and service area.

`listProjectsPaged` powers the archive/resources API with search, taxonomy
filters, offset cursors, and facet counts. `filterProjects` and the recent-pool
helpers support route recommendations and landing-page project grids.
`listProjectMaterialTypes`, `listProjectRoofColors`, and
`listProjectServiceAreas` provide the filter vocabulary.

## Video library

`listRecentVideoEntries(limit = 50)` reads published `videoEntry` records and
keeps only entries with a parseable YouTube URL. `getVideoEntryBySlug` adds
taxonomy and Rank Math metadata with a 900-second cache.

`listProjectVideos(limit = 100)` converts project ACF video URLs into the same
`VideoItem` shape. `listVideoItemsPaged` merges both sources, applies bucket,
category, material, service-area, and text filters, and returns offset-based
pagination plus facets. There is no dedicated video-detail route; selections
open through `/video-library` query state.

## Adapter rules

- Request taxonomy connections as `nodes { name slug }`; the shared mappers
  expect that shape.
- Preserve current cache intervals unless a verified invalidation requirement
  justifies changing them.
- Normalize nullable GraphQL records and connections in the adapter instead of
  leaking inconsistent payload shapes into React components.
- Keep project permalinks and `WP_PROJECT_BASE` aligned.
- Keep WordPress diagnostics staging-gated and do not expose raw upstream
  errors in production.
