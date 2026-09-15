# Location migration contract v3

Status: implementation contract; production changes and release are pending.
Starting application revision: `0271ec70f46a2b31c4eb012da28459f6a9144184`.
Evidence refreshed: 2026-09-15. The user handoff is authoritative for scope.

## Model and ownership

- `roofing_service_areas` owns `/locations/{slug}`. Preserve taxonomy identity,
  required project association, `status`, `scope_key`, and taxonomy `external_id`.
  Add independent `page_status` (`taxonomy_only`, `draft`, `published`, default
  `taxonomy_only`), `page_title`, plain-text `introduction`, optional restricted
  HTML `overview`, optional `overview_map`, `published_at`,
  `wordpress_location_id`, `source_updated_at`, and the standard shared SEO group.
  Page publication also requires published taxonomy and the correct client.
  Published `noindex` pages remain routable but leave location/image sitemaps.
- `roofing_neighborhoods`: client, status, name, slug, required `service_area`,
  optional plain-text description/landmarks, optional `image` for a verified
  neighborhood photo and a separate optional `coverage_map` for an actual map,
  `wordpress_id`, `source_updated_at`, sort. Names are required. Use client/slug
  uniqueness and a primary area; resolve conflicting assignments before writes.
- Preserve existing Parrish coverage with one canonical taxonomy-only area if
  absent. This creates no additional landing page or WordPress taxonomy identity.
- Projects gain nullable private `job_id`, nullable `zip`, nullable `neighborhood`.
  Existing primary `service_area` remains required. Normalize blank job IDs to
  null, enforce client/job uniqueness, and prevent cross-client or mismatched
  neighborhood/area assignments. After verified complete enrichment, a separate
  constraint makes job ID and ZIP required for SonShine only.
- Reviews gain optional `service_area`, separate `wordpress_provenance` JSON,
  `latest_feed_member` boolean default false, and nullable `latest_feed_order`.
  Google synchronization owns verified identity/source facts and membership/order.
  Editors own `status` and geography. Updates omit editorial fields, `url`,
  `owner_reply`, and WordPress provenance. New eligible Google records retain
  published creation behavior. Departure clears membership/order only.
- `sponsor_service_areas(sponsor, service_area)` supplies multiple geography
  relations through `sponsor_features.service_areas`; keep `service_area_slugs`.
- `roofing_service_area_neighbors(service_area, nearby_area, approved, sort)` is
  directed. Default approval false; exclude self-links, duplicate pairs, and
  cross-client pairs. Select only directly approved neighbors. Taxonomy-only
  neighbors may supply published content.
- `service_area_section_areas(section, service_area, sort)` replaces copied
  coverage names/links through `service_area_sections.areas`; retain legacy JSON.
- `navigation_items.service_area` and `link_type=service_area` resolve canonical
  links only for deployed published pages, preserving explicit ordering.
- `faqs.service_area` is exclusive with `website_page` and `service`. Global means
  all three are empty. Retain the existing restricted FAQ HTML sanitizer.
- Restrict deletion/reassignment of associated canonical records; preserve
  client consistency through database constraints and actual role permissions.
  Leave `location_landing_pages` untouched; no location owners in `website_pages`.

## Deployment and public data

Keep the existing `.generated/projects.json` v2 project/video snapshot. A
coordinated prebuild generates `.generated/locations.json` v1 (`location-v3` contract) containing explicit
public projections of areas, neighborhoods, approved adjacency, local reviews,
sponsors, coverage, FAQ scopes, and navigation. Record artifact versions and a
project-snapshot digest, and reject incompatible artifacts. Include a required
`siteShell` with normalized public site settings and services so shared layout
reuse during client navigation cannot introduce newer CMS hero/header/footer copy.
Freeze the shared featured-offer popup in the same artifact; an intentionally
absent offer is null, while a required fetch/validation failure aborts the build.
Runtime location
routes, navigation, FAQs, and sitemap consumers read deployed content only.

Project projections may include canonical CMS ID, primary area ID, and a nullable
public neighborhood (ID/name/slug). Job IDs and ZIP are never requested by website
readers or copied into public props/snapshots. No customer-address inputs or
private migration maps enter Git or generated website content. Website-reader and
public permissions must deny job references even through nested relationships.

Required fetch, pagination, schema, tenant, and publication failures abort builds.
Optional empty content is distinct from invalid/missing relation expansion.
Location routes use `dynamicParams=false`, static generation, and no ISR.
Revalidation cannot publish locations. Published videos linked to unpublished
projects remain independent and expose no project geography.

## Selection and presentation

Use canonical IDs and one shared, pure selector. Return local and nearby groups.
Projects: local then directly approved nearby, maximum six combined. Reviews:
editorially published, actual rating five, assigned area, maximum six combined;
neither Google ID nor feed membership is required. Dates descend, missing dates
last, stable ID breaks ties. Sponsors: every local match, then nearby toward
three combined; CMS sort then ID, canonical-ID deduplication. Unassigned reviews
and sponsors never provide regional backfill. Retain actual area labels.

Common order: shared hero/local introduction; projects and existing video
functionality; local/nearby reviews; existing service links; neighborhoods/map;
partnerships; global/local FAQs. Omit empty sections and absent optional fields.
Null project neighborhood means no label, wrapper, or placeholder. Neighborhood
cards can link to matching published projects but have no routes or archive filter.
Coverage maps have no customer pins. Use concise verified coverage language.
Longboat Key is organized under Sarasota by owner decision. Other conflicts need
verification. The owner approved these direct nearby lists on 2026-09-15:
Sarasota → Bradenton, Lakewood Ranch, Siesta Key, Osprey;
Bradenton → Palmetto, Lakewood Ranch, Sarasota;
Lakewood Ranch → Bradenton, Sarasota, Myakka City;
Venice → Nokomis, Osprey, North Port, Englewood;
North Port → Venice, Englewood, Port Charlotte.

Google's review-snippet rules exclude self-serving local-business review rich
results. Location pages emit no Review/AggregateRating markup or selected-feed
rating totals. The existing company identity/address remains global. Source:
[Google review-snippet documentation](https://developers.google.com/search/docs/appearance/structured-data/review-snippet), checked 2026-09-15.

## Migration, release, and limits

Source inventory is paginated and repeatable. Every source page, neighborhood,
review occurrence, media asset, and relationship gets a disposition (create,
update, match, conflict, held, excluded). Stable source keys survive row reordering.
Write designated migration-owned fields only; compare target modification state
before updates and preserve later editor changes. Match confirmed records, retain
source dates/URLs/replies, never infer five stars from frontend display or invent
Google identifiers/dates. No overwriting deployed media. Keep originals and
compatibility fields through verification.

For a confirmed existing review, explicitly verified missing source URL, reply or
date may be filled when null; conflicting populated values remain editorial
conflicts. Explicitly approved initial review geography can fill an empty relation;
subsequent migration runs preserve editor-owned assignments and publication.

Private source exports, narrow before-images, workflow graphs, and recovery maps
belong under mode-0700 `/private/tmp/sonshine-location-migration-20260915`, files
mode 0600; this is temporary storage, not a durable backup. Repository reports
contain sanitized counts, hashes, and verification outcomes only.

Prepare additive schema first, seed membership, deploy compatible feed consumers,
then stop the old archiving workflow before retaining historical reviews. Enable
the revised workflow only with verified compatible application/schema/data state.
Rollback requires application, workflow, and narrow record recovery together,
with later-editor conflict checks. Reverting only the old workflow is unsafe.

No production schema/data apply, workflow publication, deployment, merge, or push
is inferred from access. Prepare a concrete candidate and request any remaining
exact external-action approval at the release gate. The owner authorized
authenticated AccuLynx reads using the workspace-root environment on 2026-09-15;
all 53 owner-supplied matches and postal ZIPs have now been verified. The one-time
private `location-enrichment-v1` artifact prepares only job/ZIP/geography updates;
CMS apply/readback and the subsequent scoped required-field constraint remain pending.

## File ownership

Coordinator: contract, application data/snapshot adapters, shared types, consumers,
publication integration, common utilities, package scripts, authoring docs, release
evidence. Model specialist: new schema/permission/SQL preparation and model tests.
Review-sync specialist: new workflow patch/contract/tests/recovery instructions.
Migration specialist: new migration tooling, inventory, manifest, migration tests.
Frontend specialist (after reassignment): common location components, selectors,
focused selector/component tests. Explicit handoff transfers ownership; no two
writers edit a file simultaneously. Freeze revisions and hashes before review.
