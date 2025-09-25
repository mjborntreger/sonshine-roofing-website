# SonShine Roofing – GraphQL Schema & Querying Reference

This document outlines the structure and querying behavior of the SonShine Roofing headless WordPress backend, focusing on GraphQL exposure via WPGraphQL and ACF.

---

## ✅ Custom Post Types

| Post Type | GraphQL Single | GraphQL Plural |
|-----------|----------------|----------------|
| Project   | `project`      | `projects`     |
| Video     | `videoEntry`   | `videoEntries` |
| FAQ       | `faq`          | `faqs`         |

---

## ✅ ACF Field Access

All ACF fields with `show_in_graphql: true` are exposed under camelCase naming.

### 🔹 Project ACF Fields

| Field Group | Field | GraphQL Field | Notes |
|-------------|-------|----------------|-------|
| projectDetails | Project Description | `projectDescription` | Textarea |
| projectDetails | Product Links (Repeater) | `productLinks` | Repeater with `productName`, `productLink` |
| projectVideoInfo | YouTube URL | `youtubeUrl` | URL |
| videoLibraryMetadata | Description | `description` | Text |
| videoLibraryMetadata | Roof Color | `roofColor` | Taxonomy object |
| videoLibraryMetadata | Service Area | `serviceArea` | Taxonomy object |
| projectFilters | Service Area | `serviceArea` | ACF taxonomy field |

> ❗ Note: All taxonomy returns (e.g., `roofColor`, `serviceArea`) are `AcfTermNodeConnection`. You must unwrap them via `.nodes { name slug }` to access term data.

---

## ✅ Taxonomies

| Taxonomy | GraphQL Enum | Used In |
|----------|--------------|---------|
| `material_type` | `MATERIALTYPE` | Projects, Videos |
| `roof_color`    | `ROOFCOLOR`    | Projects, Videos |
| `service_area`  | `SERVICEAREA`  | Projects, Videos |
| `video_category`| `VIDEOCATEGORY`| Videos only |
| `faq_topic`     | `FAQTOPIC`     | FAQs only |

Use these enums with `taxQuery`:

```graphql
taxQuery: {
  relation: AND
  taxArray: [
    { taxonomy: MATERIALTYPE, terms: ["tile"], field: SLUG, operator: IN },
    { taxonomy: SERVICEAREA, terms: ["sarasota"], field: SLUG, operator: IN }
  ]
}
```

---

## ✅ Pagination & Count

### 🔹 Offset Pagination

Enabled via WPGraphQL Offset Pagination Plugin.

Use like this:

```graphql
projects(where: {
  offsetPagination: { offset: 0, size: 10 }
}) {
  nodes { title }
  pageInfo {
    offsetPagination {
      hasMore
      hasPrevious
      total
    }
  }
}
```

---

## ✅ Total Count

The recommended way to get a total count of items (instead of using `totalCount` directly) is:

```graphql
projects(where: {
  offsetPagination: { offset: 0, size: 5 }
}) {
  nodes { title }
  pageInfo {
    offsetPagination {
      total
    }
  }
}
```

Use `pageInfo.offsetPagination.total` as your authoritative count for paginated queries.

---

## ✅ Custom Field: `facetCounts`

Use this to get real-time facet filters and counts.

```graphql
query {
  facetCounts(
    postType: "project",
    taxonomies: [
      { taxonomy: "material_type", slugs: ["tile"] },
      { taxonomy: "roof_color", slugs: ["charcoal"] },
      { taxonomy: "service_area", slugs: ["sarasota"] }
    ]
  ) {
    total
    facets {
      taxonomy
      buckets {
        slug
        name
        count
      }
    }
  }
}
```

---

## ✅ Term Lists (for filters)

```graphql
{
  materialTypes { nodes { name slug } }
  roofColors    { nodes { name slug } }
  serviceAreas  { nodes { name slug } }
}
```

---

## ✅ Notes & Gotchas

- All ACF fields are camelCased (e.g. `youtube_url` → `youtubeUrl`)
- Taxonomy returns are nested under `.nodes[]`, not inline
- GraphQL enums must be used in `taxQuery`
- Use `offsetPagination.total` instead of `totalCount`
- For filtering by custom field (e.g. description), a `metaQuery` system would be needed

---

Generated for SonShine Roofing by GPT-4, Sept 2025.
