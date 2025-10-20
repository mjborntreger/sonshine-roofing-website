# SonShine Roofing – WPGraphQL Reference

`lib/content/wp.ts` centralises every GraphQL interaction with the headless WordPress instance. This document inventories those calls, with an emphasis on how dynamic slugs and custom post types flow into Next.js routes.

---

## Runtime configuration

- `NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT` → defaults to `https://next.sonshineroofing.com/graphql`.
- `WP_BASIC_AUTH_USER` / `WP_BASIC_AUTH_PASS` → optional Basic Auth applied on every request.
- `WP_PROJECT_BASE` → base segment for project permalinks (default `project`); used when building URIs for GraphQL lookups.
- `NODE_ENV` toggles `WP_VERBOSE_ERRORS`, causing raw GraphQL errors to be surfaced during development.

---

## Core fetch helper (`wpFetch`)

- Signature: `wpFetch(query, variables?, options?)`.
- `options` can be a number (`revalidateSeconds`) or `{ revalidateSeconds, cache }`.
- Default cache revalidation is 600 s when nothing is supplied.
- Automatically adds `Authorization: Basic …` when credentials exist.
- Throws with the serialized GraphQL error array when `WP_VERBOSE_ERRORS` is on; otherwise collapses to a generic error.

```ts
const data = await wpFetch<MyQuery>(query, vars, { revalidateSeconds: 3600, cache: "force-cache" });
```

---

## Post type & route map

| Content domain | GraphQL roots | Static slug loader (revalidate) | Single fetcher | Next.js route(s) consuming it |
|----------------|---------------|---------------------------------|----------------|-------------------------------|
| Blog posts | `post` / `posts` | `listPostSlugs` (600 s) | `getPostBySlug` | `app/[slug]/page.tsx` |
| Projects | `project` / `projects` | `listProjectSlugs` (600 s) | `getProjectBySlug` (URI-based) | `app/project/[slug]/page.tsx` |
| Locations | `location` / `locations` | `listLocationSlugs` (600 s) | `getLocationBySlug` | `app/locations/[slug]/page.tsx` |
| FAQs | `faq` / `faqs` | `listFaqSlugs` (86 400 s) | `getFaq` | `app/faq/[slug]/page.tsx` |
| Glossary terms | `glossaryTerm` / `glossaryTerms` | `listGlossaryIndex` (batched, 600 s) | `getGlossaryTerm` | `app/roofing-glossary/[slug]/page.tsx` |
| Special offers | `specialOffer` / `specialOffers` | `listSpecialOfferSlugs` (900 s) | `getSpecialOfferBySlug` (900 s) | `app/special-offers/[slug]/page.tsx` |
| Team members | `person` / `persons` | `listPersonNav` (86 400 s) | `listPersonsBySlug` (caller sets revalidate) | `app/person/[slug]/page.tsx` |
| Video entries | `videoEntry` / `videoEntries` | n/a (pool only) | `getVideoEntryBySlug` (900 s) | Consumed by `components/dynamic-content/video/*` |

Static params are always transformed into `{ slug }` objects before being returned from the respective page’s `generateStaticParams`.

---

## Blog posts (`post`)

- **Slug loader** – `listPostSlugs(limit = 200)` pulls published post slugs ordered by publish date:
  ```graphql
  query ListPostSlugs($limit: Int!) {
    posts(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
      nodes { slug }
    }
  }
  ```
- **Single fetch** – `getPostBySlug(slug)` uses `post(id: $slug, idType: SLUG)` and returns HTML content, author, Rank Math SEO, categories (names + slugs), featured image, modified date, and excerpt.
- **Archive helpers**:
  - `listRecentPosts` → 12 most recent posts with calculated reading time.
  - `listPostsPaged` → offset pagination plus `facetCounts` for categories (search, include/exclude cat slugs supported).
  - `listRecentPostsPool` / `listRecentPostsPoolForFilters` → prefetch pools for client-side filtering.
  - `listRecentPostNav` → lightweight nav list cached for 30 min.
- **Next usage** – `app/[slug]/page.tsx` relies on `listPostSlugs` for static generation and `getPostBySlug` for runtime data. The same module builds FAQ/related content blocks with `listRecentPostsPool` and `listFaqsWithContent`.

```graphql
query PostSmokeTest($slug: ID!, $first: Int = 10) {
  posts(
    first: $first
    where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
  ) {
    nodes {
      ...PostFields
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }

  post(id: $slug, idType: SLUG) {
    ...PostFields
  }
}

fragment PostFields on Post {
  databaseId
  id
  slug
  uri
  status
  title
  date
  modified
  excerpt(format: RENDERED)
  content(format: RENDERED)
  author {
    node {
      databaseId
      id
      name
    }
  }
  featuredImage {
    node {
      id
      sourceUrl
      altText
      mediaDetails {
        width
        height
      }
    }
  }
  categories(first: 12) {
    nodes {
      databaseId
      id
      name
      slug
    }
  }
  seo {
    title
    description
    canonicalUrl
    openGraph {
      title
      description
      type
      image {
        url
        secureUrl
        width
        height
        type
      }
    }
  }
}
```

---

## Locations (`location`)

- **Slug loader** – `listLocationSlugs(limit = 200)` (planned) will mirror the other CPT helpers with a 10 min revalidation window.
- **Single fetch** – `getLocationBySlug(slug)` (planned) will hydrate ACF-driven doorway content, Rank Math SEO, and the WordPress `content` field. Dates are returned raw (no `format: "c"` argument) because the current GraphiQL instance rejects formatted date arguments; sanitise/normalise on the client.
- **Smoke test query** – useful for validating schema/ACF wiring:

```graphql
query LocationSmokeTest($slug: ID!, $first: Int = 10) {
  locations(
    first: $first
    where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
  ) {
    nodes {
      ...LocationFields
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }

  location(id: $slug, idType: SLUG) {
    ...LocationFields
  }
}

fragment LocationFields on Location {
  databaseId
  id
  slug
  uri
  status
  title
  content(format: RENDERED)
  date
  modified
  featuredImage {
    node {
      databaseId
      id
      sourceUrl
      altText
      mediaDetails {
        width
        height
      }
    }
  }
  locationAttributes {
    locationName
    nearbyLandmarks {
      landmark
    }
    map {
      node {
        id
        sourceUrl
        altText
      }
    }
    localPartnerships {
      partnerName
      partnerWebsiteUrl
      partnerDescription
      partnerSocialMedia {
        facebookUrl
        instagramUrl
      }
      partnerLogo {
        node {
          id
          sourceUrl
          altText
        }
      }
    }
    featuredReviews {
      reviewAuthor
      review
      ownerReply
      reviewUrl
      reviewDate
    }
    neighborhoodsServed {
      neighborhood
      neighborhoodDescription
      zipCodes {
        zipCode
      }
      neighborhoodImage {
        node {
          id
          sourceUrl
          altText
        }
      }
    }
    localFaq {
      question
      answer
    }
  }
  seo {
    title
    description
    canonicalUrl
    openGraph {
      title
      description
      type
      image {
        url
        secureUrl
        width
        height
        type
      }
    }
  }
}
```

---

## Projects (`project`)

- **Permalink handling** – `buildProjectUri(slug)` turns a slug into `/${PROJECT_BASE}/${slug}/` for GraphQL lookups; this guards against rewrites diverging from raw slugs.
- **Slug loader** – `listProjectSlugs(limit = 500)` fetches published project slugs by date.
- **Single fetch** – `getProjectBySlug(slug)` calls `project(id: $uri, idType: URI)` and hydrates:
  - ACF groups: `projectDetails` (description, product links) and `projectVideoInfo`.
  - Taxonomy fields: `materialType`, `roofColor`, `serviceArea` via `projectFilters`.
  - Rank Math SEO (OG image, canonical, etc.).
- **Archive & filters**:
  - `listRecentProjects`, `listRecentProjectsPool`, `listRecentProjectsByMaterial`.
  - `listProjectsPaged` → offset pagination, optional free-text search, AND’ed taxonomy filters, and facet data.
  - `filterProjects` → cursor-based list for gallery filters (accepts MT/RC/SA slug arrays).
  - `listProjectMaterialTypes`, `listProjectRoofColors`, `listProjectServiceAreas`, `listProjectFilterTerms` → daily cached term lists.
  - `listProjectVideos` + `projectToVideoItem` expose YouTube metadata for the video library.
- **Next usage** – `app/project/[slug]/page.tsx` pre-builds static params with `listProjectSlugs` and renders via `getProjectBySlug`, while sharing pools/facets for related projects and FAQs.

```graphql
query ProjectSmokeTest($uri: ID!, $first: Int = 10) {
  projects(
    first: $first
    where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
  ) {
    nodes {
      ...ProjectFields
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }

  project(id: $uri, idType: URI) {
    ...ProjectFields
    content(format: RENDERED)
  }
}

fragment ProjectFields on Project {
  databaseId
  id
  slug
  uri
  status
  title
  date
  modified
  featuredImage {
    node {
      id
      sourceUrl
      altText
      mediaDetails {
        width
        height
      }
    }
  }
  projectDetails {
    projectDescription
    productLinks {
      productName
      productLink
    }
  }
  projectVideoInfo {
    youtubeUrl
  }
  projectFilters {
    materialType {
      nodes {
        name
        slug
      }
    }
    roofColor {
      nodes {
        name
        slug
      }
    }
    serviceArea {
      nodes {
        name
        slug
      }
    }
  }
  seo {
    title
    description
    canonicalUrl
    openGraph {
      title
      description
      type
      image {
        url
        secureUrl
        width
        height
        type
      }
    }
  }
}
```

---

## FAQs (`faq`)

- **Slug loader** – `listFaqSlugs(limit = 500)` caches for 24 h to support static generation:
  ```graphql
  query ListFaqSlugs($limit: Int!) {
    faqs(first: $limit, where: { status: PUBLISH, orderby: { field: TITLE, order: ASC } }) {
      nodes { slug }
    }
  }
  ```
- **Single fetch** – `getFaq(slug)` returns rendered HTML, topic slugs, ISO publish/modified timestamps, and SEO payloads.
- **Indexes**:
  - `listFaqIndex` → alphabetical slug/title/excerpt index (paged loop using `pageInfo.endCursor`).
  - `listFaqsWithContent` → full-content list for JSON-LD or archives (optionally filtered to a topic).
  - `listFaqs` → light summaries with optional topic filter.
  - `listFaqTopics` → taxonomy term list (cached 24 h).
- **JSON-LD helpers** – `faqItemsToJsonLd` and `faqListToJsonLd` convert fetched content into FAQ schema.
- **Next usage** – `app/faq/[slug]/page.tsx` builds static params from `listFaqSlugs`, loads individual entries via `getFaq`, and builds prev/next navigation from `listFaqIndex`.

```graphql
query FaqSmokeTest($slug: ID!, $first: Int = 10) {
  faqs(
    first: $first
    where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
  ) {
    nodes {
      ...FaqFields
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }

  faq(id: $slug, idType: SLUG) {
    ...FaqFields
    content(format: RENDERED)
  }
}

fragment FaqFields on Faq {
  databaseId
  id
  slug
  status
  title
  date(format: "c")
  modified(format: "c")
  excerpt(format: RENDERED)
  faqTopics {
    nodes {
      slug
      name
    }
  }
  seo {
    title
    description
    canonicalUrl
    openGraph {
      title
      description
      type
      image {
        url
        secureUrl
        width
        height
        type
      }
    }
  }
}
```

---

## Glossary terms (`glossaryTerm`)

- **Index as slug source** – `listGlossaryIndex(limit = 500)` paginates through `glossaryTerms` (status = PUBLISH, title ASC), collecting slugs, titles, and stripped excerpts. Each page fetch honours the default 600 s cache.
- **Single fetch** – `getGlossaryTerm(slug)` pulls rendered content via `glossaryTerm(id: $slug, idType: SLUG)`.
- **Next usage** – `app/roofing-glossary/[slug]/page.tsx` calls the index to build static params and contextual linking, then hydrates with `getGlossaryTerm`.
- **Client helpers** – `stripHtml` plus custom auto-linking in the page ensure internal references between terms.

```graphql
query GlossarySmokeTest($slug: ID!, $first: Int = 50) {
  glossaryTerms(
    first: $first
    where: { status: PUBLISH, orderby: { field: TITLE, order: ASC } }
  ) {
    nodes {
      ...GlossaryFields
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }

  glossaryTerm(id: $slug, idType: SLUG) {
    ...GlossaryFields
    content(format: RENDERED)
  }
}

fragment GlossaryFields on GlossaryTerm {
  databaseId
  id
  slug
  title
  content(format: RENDERED)
}
```

---

## Special offers (`specialOffer`)

- **Slug loader** – `listSpecialOfferSlugs(limit = 100)` refreshes every 15 min; query restricts to published entries.
- **Single fetch** – `getSpecialOfferBySlug(slug)` returns content, featured image, Rank Math SEO, and ACF fields from `specialOffersAttributes` (`discount`, `offerCode`, `expirationDate`, `legalDisclaimers`).
- **Next usage** – `app/special-offers/[slug]/page.tsx` seeds static params via the slug list, renders with the single fetcher, and handles per-offer caching/expiry UI client side.

```graphql
query SpecialOfferSmokeTest($slug: ID!, $first: Int = 10) {
  specialOffers(
    first: $first
    where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
  ) {
    nodes {
      ...SpecialOfferFields
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }

  specialOffer(id: $slug, idType: SLUG) {
    ...SpecialOfferFields
    content(format: RENDERED)
  }
}

fragment SpecialOfferFields on SpecialOffer {
  databaseId
  id
  slug
  status
  title
  date(format: "c")
  modified(format: "c")
  featuredImage {
    node {
      id
      sourceUrl
      altText
      mediaDetails {
        width
        height
      }
    }
  }
  specialOffersAttributes {
    discount
    offerCode
    expirationDate
    legalDisclaimers
  }
  seo {
    title
    description
    canonicalUrl
    openGraph {
      title
      description
      type
      image {
        url
        secureUrl
        width
        height
        type
      }
    }
  }
}
```

---

## Team profiles (`person`)

- **Slug loader surrogate** – `listPersonNav(limit = 50)` is used for static params and prev/next navigation; cached for a day and returns `{ slug, title, positionTitle }`.
- **Single fetch** – `listPersonsBySlug(slug, options?)` maps to `person(id: $slug, idType: SLUG)` and exposes rendered HTML, featured image, and position title. Callers (e.g. `app/person/[slug]/page.tsx`) provide revalidate seconds (24 h).
- **Multi-fetch** – `listPersons`, `listPersonsBySlugs` offer richer collections for marketing components (team grids).

```graphql
query PersonSmokeTest($slug: ID!, $first: Int = 12) {
  persons(
    first: $first
    where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
  ) {
    nodes {
      ...PersonFields
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }

  person(id: $slug, idType: SLUG) {
    ...PersonFields
    content(format: RENDERED)
  }
}

fragment PersonFields on Person {
  databaseId
  id
  slug
  status
  title
  date
  modified
  personAttributes {
    positionTitle
  }
  featuredImage {
    node {
      id
      sourceUrl
      altText
      mediaDetails {
        width
        height
      }
    }
  }
}
```

---

## Video library (video entries + project videos)

- **Video CPT** – `listRecentVideoEntries(limit = 50)` fetches published `videoEntry` posts with taxonomy info and ACF metadata (`videoLibraryMetadata`). Only entries with parsable YouTube URLs are kept.
- **Single** – `getVideoEntryBySlug(slug)` fetches one entry, returning categories, material/service area terms, optional SEO, and YouTube IDs (cached 15 min).
- **Project-sourced videos** – `listProjectVideos` surfaces videos stored on projects via the `projectVideoInfo.youtubeUrl` ACF field, enriching with project terms/descriptions.
- **Aggregation** – `listVideoItemsPaged` merges both pools, applies optional filters (`categorySlugs`, `materialTypeSlugs`, `serviceAreaSlugs`, text search), normalises buckets, and returns a `PageResult<VideoItem>` alongside custom facet group data.
- No dedicated `/video/[slug]` page exists; slugs/IDs are used to build query params for the video library client (`VideoLibraryClient.tsx`).

```graphql
query VideoEntrySmokeTest($slug: ID!, $first: Int = 12, $taxLimit: Int = 10) {
  videoEntries(
    first: $first
    where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
  ) {
    nodes {
      ...VideoEntryFields
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }

  videoEntry(id: $slug, idType: SLUG) {
    ...VideoEntryFields
    videoLibraryMetadata {
      youtubeUrl
      description
      materialType {
        nodes {
          name
          slug
        }
      }
      serviceArea {
        nodes {
          name
          slug
        }
      }
    }
  }
}

fragment VideoEntryFields on VideoEntry {
  databaseId
  id
  slug
  status
  title
  date(format: "c")
  videoCategories(first: $taxLimit) {
    nodes {
      name
      slug
    }
  }
  videoLibraryMetadata {
    youtubeUrl
    description
  }
  seo {
    title
    description
    canonicalUrl
    openGraph {
      title
      description
      type
      image {
        url
        secureUrl
        width
        height
        type
      }
    }
  }
}
```

---

## Taxonomies, filters, and counts

- Blog categories → `listBlogCategories` (hide empty, cached 24 h).
- FAQ topics → `listFaqTopics`.
- Project taxonomies → `listProjectMaterialTypes`, `listProjectRoofColors`, `listProjectServiceAreas`, bundled via `listProjectFilterTerms`.
- `listPostsPaged` and `listProjectsPaged` both request `facetCounts`, and helper utilities (`mapFacetBucketsFromWp`, `mapFacetGroupsFromWp`) normalise taxonomy buckets `{ slug, name, count }`.
- `listRecentProjectsPoolForFilters` and `listRecentPostsPoolForFilters` guarantee coverage for key categories/materials by merging curated batches.

---

## Utility helpers in `wp.ts`

- Normalisers: `toStringSafe`, `stringOrNull`, `asRecord`, `extractNodes`, `extractSlugList`, `mapTermNodes`.
- Media helpers: `pickImage`, `pickImageFrom`.
- Text helpers: `stripHtml`, `calcReadingTimeMinutes`, `toTrimmedExcerpt`, HTML entity decoders.
- Video helpers: `extractYouTubeId`, `youtubeThumb`, `videoJsonLd`.
- Schema helpers: `faqItemsToJsonLd`, `faqListToJsonLd`.
- Health checks: `getSiteMeta` (60 s cache) and `pingWP` for the `/api/wp-debug` route.

These helpers ensure inconsistent WPGraphQL payloads (e.g. nullable connections, union objects) are coerced into predictable shapes before entering the React layer.

---

## Usage tips

- Always request term data via `.nodes { name slug }`; helper mappers already expect that shape.
- Respect the existing cache windows when introducing new fetches—reuse the same `revalidateSeconds` to avoid unnecessary churn.
- For new dynamic routes, mirror the existing pattern: create a `listXYZSlugs` (or reuse an index) in `wp.ts`, guard it with sensible limits, then wire it into `generateStaticParams`.
- When extending project permalinks, keep `WP_PROJECT_BASE` in sync with WordPress rewrites; `buildProjectUri` depends on it.

Updated for SonShine Roofing based on the current `lib/content/wp.ts`.
