# SonShine Roofing – WPGraphQL Reference

`lib/content/wp.ts` centralises the remaining GraphQL interactions with the headless WordPress instance. This document inventories those calls, with an emphasis on how dynamic slugs and custom post types flow into Next.js routes. Directus-backed domains, including the roofing glossary, are documented separately below.

---

## Runtime configuration 

- `NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT` → defaults to `https://wp.sonshineroofing.com/graphql`.
- `WP_BASIC_AUTH_USER` / `WP_BASIC_AUTH_PASS` → optional Basic Auth applied on every request.
- `WP_PROJECT_BASE` → base segment for project permalinks (default `project`); used when building URIs for GraphQL lookups.
- `NODE_ENV` toggles `WP_VERBOSE_ERRORS`, causing raw GraphQL errors to be surfaced during development.
- Directus special offers use server-side `DIRECTUS_URL`, `DIRECTUS_CLIENT_SLUG`, and `DIRECTUS_TOKEN`.

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
- **Next usage** – `app/[slug]/page.tsx` relies on `listPostSlugs` for static generation and `getPostBySlug` for runtime data. Related posts still use `listRecentPostsPool`; FAQs are loaded separately from Directus.

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

## FAQs (migrated to Directus)

FAQ content no longer uses WPGraphQL. `lib/content/directus-faqs.ts` loads published `faqs`
records for `DIRECTUS_CLIENT_SLUG`. A null `website_page` relation marks a global FAQ;
otherwise, page sections match `website_page.path`. The `/faq` archive uses
`website_page.nav_label` for group headings, with General first and the remaining groups
alphabetical. Individual `/faq/[slug]` routes and the FAQ child sitemap were removed.

`faqs.answer` is WYSIWYG-authored semantic HTML. `lib/content/directus-faq-html.ts`
allows only `p`, `a`, `strong`, `em`, `ul`, `ol`, `li`, and `br`; anchors may use only
`href`, `rel`, `target`, and `title`. Destinations must begin with exactly one `/`, begin
with `#`, or use `http`, `https`, `mailto`, or `tel`. Protocol-relative and unsafe URLs,
images, headings, tables, classes, IDs, inline styles, scripts, event handlers, and other
editor/source markup are removed. The frontend sanitizer remains authoritative even
though the Directus toolbar constrains authors. `_blank` links receive
`rel="noopener noreferrer"`.

Rendered FAQ content stays HTML, while FAQ JSON-LD uses parser-derived,
entity-decoded plain text from `faqHtmlToPlainText()` rather than regex tag removal.
Publication uses only `status`, and page scope uses only `website_page`.

---

## Roofing glossary (`roofing_glossary_terms` in Directus)

- **Fetcher module** – `lib/content/glossary.ts` uses the Directus Items REST
  API with the server-only Directus token and a 900-second tagged cache.
- **Collection filter** – every read requires related
  `client.slug = DIRECTUS_CLIENT_SLUG` and `status = published`; there is no
  WordPress fallback.
- **Index and single fetches** – `listGlossaryIndex(limit = 500)` returns
  title-sorted slugs, titles, and parser-derived definition text;
  `getGlossaryTerm(slug)` reads one scoped record.
- **HTML boundary** – `lib/content/directus-glossary-html.ts` sanitizes the
  restricted `definition` field and derives entity-decoded plain text for
  metadata and DefinedTerm schema.
- **SEO and sitemap** – each term consumes its own `noindex` and optional SEO
  fields. The sitemap adapter excludes noindex terms; all migrated terms are
  intentionally noindex while the glossary archive remains indexable. Directus
  `date_updated` supplies freshness for any future sitemap entry.

REST smoke-test shape:

```http
GET /items/roofing_glossary_terms?fields=client.slug,status,slug,title,definition,noindex,meta_title,meta_description,primary_focus_keyword,focus_keywords,og_title,og_description,og_image_override.id,og_image_override.description,og_image_override.width,og_image_override.height,date_updated&filter={"client":{"slug":{"_eq":"<DIRECTUS_CLIENT_SLUG>"}},"status":{"_eq":"published"},"slug":{"_eq":"<slug>"}}&limit=1
```

---

## Special offers (`special_offers` in Directus)

- **Fetcher module** – `lib/content/directus-special-offers.ts` uses the Directus Items REST API with `Authorization: Bearer ${DIRECTUS_TOKEN}` and build-only `force-cache` fetches. Directus changes require a new site build.
- **Collection filter** – all reads filter `special_offers` by related `client.slug = DIRECTUS_CLIENT_SLUG` and `status = published`; there is no WordPress fallback.
- **Fields** – the site reads the offer content fields plus `noindex`, `meta_title`, `meta_description`, `primary_focus_keyword`, `focus_keywords`, `og_title`, `og_description`, `og_image_override` file metadata, and `date_updated`.
- **Next usage** – `app/(site)/special-offers/[slug]/page.tsx` seeds static params via `listSpecialOfferSlugs`, renders offer pages with `getSpecialOfferBySlug`, and preserves the existing special-offer lead form payload. The route and `/sitemap_index/special-offer` are fully static and protected from the runtime revalidation endpoint.
- **Indexing and expiration** – the stored `noindex` toggle alone controls page robots metadata and special-offer sitemap inclusion. Expiration controls the unavailable state and popup eligibility without overriding indexing.
- **Featured popup** – `app/(site)/layout.tsx` fetches `getFeaturedSpecialOffer`; if multiple published, unexpired offers are featured, the soonest-expiring offer wins. The popup excludes `offer_code`, links to the offer page, and suppresses itself in browser storage for 7 days after dismissal or CTA click.
- **Directus docs** – see Directus Items API, Query Parameters, Authentication, and Assets API:
  - `https://directus.com/docs/api/items`
  - `https://directus.com/docs/guides/connect/query-parameters`
  - `https://directus.com/docs/api/authentication`
  - `https://directus.com/docs/api/assets`

REST smoke-test shape:

```http
GET /items/special_offers?fields=client.slug,title,slug,featured_image.id,featured_image.description,featured_image.width,featured_image.height,offer_code,discount,description,expiration_date,legal_disclaimer,featured,noindex,meta_title,meta_description,primary_focus_keyword,focus_keywords,og_title,og_description,og_image_override.id,og_image_override.description,og_image_override.width,og_image_override.height,date_updated&filter={"client":{"slug":{"_eq":"<DIRECTUS_CLIENT_SLUG>"}},"status":{"_eq":"published"},"slug":{"_eq":"<slug>"}}&limit=1
Authorization: Bearer <DIRECTUS_TOKEN>
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
- Project taxonomies → `listProjectMaterialTypes`, `listProjectRoofColors`, `listProjectServiceAreas`, bundled via `listProjectFilterTerms`.
- `listPostsPaged` and `listProjectsPaged` both request `facetCounts`, and helper utilities (`mapFacetBucketsFromWp`, `mapFacetGroupsFromWp`) normalise taxonomy buckets `{ slug, name, count }`.
- `listRecentProjectsPoolForFilters` and `listRecentPostsPoolForFilters` guarantee coverage for key categories/materials by merging curated batches.

---

## Utility helpers in `wp.ts`

- Normalisers: `toStringSafe`, `stringOrNull`, `asRecord`, `extractNodes`, `extractSlugList`, `mapTermNodes`.
- Media helpers: `pickImage`, `pickImageFrom`.
- Text helpers: `stripHtml`, `calcReadingTimeMinutes`, `toTrimmedExcerpt`, HTML entity decoders.
- Video helpers: `extractYouTubeId`, `youtubeThumb`, `videoJsonLd`.
- Health checks: `getSiteMeta` (60 s cache) and `pingWP` for the `/api/wp-debug` route.

These helpers ensure inconsistent WPGraphQL payloads (e.g. nullable connections, union objects) are coerced into predictable shapes before entering the React layer.

---

## Usage tips

- Always request term data via `.nodes { name slug }`; helper mappers already expect that shape.
- Respect the existing cache windows when introducing new fetches—reuse the same `revalidateSeconds` to avoid unnecessary churn.
- For new dynamic routes, mirror the existing pattern: create a `listXYZSlugs` (or reuse an index) in `wp.ts`, guard it with sensible limits, then wire it into `generateStaticParams`.
- When extending project permalinks, keep `WP_PROJECT_BASE` in sync with WordPress rewrites; `buildProjectUri` depends on it.

Updated for SonShine Roofing based on the current `lib/content/wp.ts`.
