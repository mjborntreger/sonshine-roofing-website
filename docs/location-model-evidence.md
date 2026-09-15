# Location model evidence

Contract: `location-v3`; model `location-model-v3`; SQL `location-invariants-v2`.
Starting application: `0271ec70f46a2b31c4eb012da28459f6a9144184`.
Verified 2026-09-15 using the configured Directus MCP (initial prompt, discovery,
selected schema/fields/relations and bounded identity/status reads) and GET-only
website-reader REST permission checks. No production writes were performed.

## Current state

| SonShine collection | Published | Other | Total |
| --- | ---: | ---: | ---: |
| roofing_service_areas | 13 | 0 | 13 |
| roofing_projects | 53 | 0 | 53 |
| videos | 79 | 0 | 79 |
| reviews | 20 | 12 archived | 32 |
| sponsor_features | 10 | 0 | 10 |
| faqs | 45 | 0 | 45 |

The reconciliation baselines still match. Reviews has 49 records across all
clients, so unscoped collection totals must not be mistaken for SonShine totals.
No requested location fields or new collections exist. The unused
`location_landing_pages` still contains only system scaffolding fields.

The 13 canonical area slugs are bradenton, englewood, lakewood-ranch, myakka-city,
nokomis, north-port, osprey, palmetto, port-charlotte, punta-gorda, sarasota,
siesta-key and venice. All five preserved route slugs already have canonical IDs.
Do not replace these IDs, slugs, taxonomy external IDs or scope keys.

`roofing_projects.service_area` is required in SQL and Directus, and its FK is
RESTRICT. The project and area client FKs are RESTRICT. Their external_id and
scope_key columns are nullable unique strings. Reviews.external_id is nullable
and globally unique; it remains the verified Google resource identity.

Reviews use `owner_reply`, `url`, nullable exact `review_date`,
`source_created_at`, and `source_updated_at`. No WordPress provenance exists.
Reviews.client is required in the UI but nullable in SQL with SET NULL deletion.
FAQ, sponsor and coverage client FKs also use SET NULL. FAQ.service uses SET NULL,
which can silently change local scope to global; the candidate replaces this
behavior with RESTRICT. Navigation menu/page/parent edges have Directus metadata
but no SQL FK. The model adds the required integrity edges explicitly.

Coverage currently stores `service_area_sections.service_areas` JSON containing
copied `service_area` names and optional `href`; retain it as compatibility data,
and add the ordered `areas` canonical junction. Sponsors retain their slug array
while the new relation becomes authoritative.

## Actual access evidence

The current website reader has read-only access. `roofing_projects` and
`roofing_service_areas` are filtered to published SonShine records but use the
wildcard field grant. `videos` has an explicit field grant including its project
relation. Therefore adding job_id before restricting project fields would expose
it directly and through nested video reads. UI hidden/readonly does not prevent
that disclosure.

Reviews, FAQs, sponsors, coverage and navigation currently have unscoped wildcard
reader grants. The prepared permissions replace target reader grants with
explicit projections and tenant/publication predicates. The policy inventory
must be resolved with an authorized admin before application; the reader's
permission endpoint does not reveal complete policy ownership.

Anonymous GETs to projects, nested video/project and reviews return 403. These
are current denial checks, not proof that a future policy addition remains safe.
The release gate rechecks both anonymous and authenticated effective permission
fields and explicit, wildcard, aliased and nested job-reference queries.

Directus policies combine additively; a restrictive new policy cannot cancel an
existing wildcard grant. Audit every effective reader/public policy before schema
application. [Directus policy documentation](https://directus.com/resources/v11-release-notes).

## Verification limits and release dependencies

Read APIs establish field nullability, single-column uniqueness and declared
relations. They do not establish all live PostgreSQL triggers/composite indexes.
No privileged SQL verification script was run; existing video verification
contains writes and requires separately authorized execution despite rollback.

The candidate's PostgreSQL verification is explicitly read-only and separated
from its schema/invariant apply files. SQL execution, exact policy ownership,
post-change denial probes, required project enrichment and its later SonShine-only
constraint remain release gates. Job identifiers and customer lookup data never
enter this evidence or fixtures. Prepared schema is not applied schema.

## Local candidate verification

The prepared model passed `node scripts/verify-location-model.mjs` on Node
22.23.2. Targeted ESLint passed for all new model JavaScript files. The actual
invariant and post-backfill SQL passed in a temporary in-memory PostgreSQL engine
using @electric-sql/pglite 0.5.8: apply/rerun, read-only verification, 30 rejected
invalid mutations, trimmed/null references, tenant and neighborhood relationships,
FAQ exclusivity/deletion, junction uniqueness, navigation ownership, review-feed
rollover and SonShine-only required fields, including whitespace-only references
before and after the required-field gate. All fixtures were synthetic.

Temporary test dependency: `/private/tmp/sonshine-location-model-test`.
This directory contains test tooling only, not migration recovery or client data.
The SQL script is prepared and locally executed; it has not been run against
production. Full permission ownership resolution and live post-change verification
remain explicitly incomplete.

### Contract v2 photo amendment

Migration inspection identified the 88 WordPress neighborhood image values as
photos. The schema now prepares nullable `roofing_neighborhoods.image`, with an
independent file relation and explicit public permission field. `coverage_map`
retains its distinct coverage-map semantics. No production field or media record
was changed. Synthetic tests cover a v1-to-v2 additive rerun and independent
photo/map references and photo deletion.
