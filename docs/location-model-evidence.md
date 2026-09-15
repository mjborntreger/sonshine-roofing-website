# Location model evidence

Current contract: manual review amendment, snapshot `location-v3`; model
`location-model-v5`; SQL `location-invariants-v4`. The initial v4/v3 phase below
is historical. Subsequent explicitly approved removal of two unused review-feed
fields, their CHECK and two reader-field entries passed independent live readback;
all original privacy/integrity protections remain. See [current model results](location-model-permissions.md).
Starting application: `0271ec70f46a2b31c4eb012da28459f6a9144184`.
Last verified: 2026-09-15. Verification source: initial configured Directus MCP
discovery, authorized schema/policy execution receipts, read-only SQL verification,
actual website/anonymous permission probes and independently verified enrichment.
The applied location migration and timestamp recovery revision is
`43fbd45f24bb4c9bd4d68f3ed19fe457d3f31a0e`.

## Initial applied model and privacy verification

The coordinator tightened one project reader grant before adding the private
fields, then applied 49 additive schema actions and the transactional invariant
SQL. Reader extensions applied eleven changes: seven updates and four creates.
The final schema `--verify-only` reported zero remaining actions. Read-only SQL
verification passed, including the now-installed SonShine enrichment constraint.

All 53 projects were enriched and independently read back; existing primary areas
were retained and neighborhoods remain null. The same-plan repeat matched all 53
without writes. Direct, nested, aliased and wildcard privacy probes passed for the
website reader and anonymous access before and after backfill. Job IDs and ZIPs
remain excluded from their public projections.

That initial phase created fourteen canonical service areas, including Parrish
taxonomy-only, five draft pages and 85 draft neighborhoods, without review writes.
The current handoff supersedes those counts with 87 published neighborhoods and 72
manual reviews. Website deployment remains held; n8n work was withdrawn.

Private recovery root:
`/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15`.
Evidence includes `schema-apply-01.json`, `schema-verify-02.json`,
`permissions-tighten-apply-01.json`, `permissions-extend-apply-01.json`,
`privacy-probe-before-backfill-01.json`, `privacy-probe-after-backfill-01.json`
and the separate enrichment receipts. Files are mode 0600 under mode-0700 storage.

## Historical discovery state before application

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
No requested location fields or new collections existed at discovery. The unused
`location_landing_pages` scaffold remains untouched.

The 13 canonical area slugs are bradenton, englewood, lakewood-ranch, myakka-city,
nokomis, north-port, osprey, palmetto, port-charlotte, punta-gorda, sarasota,
siesta-key and venice. All five preserved route slugs already have canonical IDs.
Do not replace these IDs, slugs, taxonomy external IDs or scope keys.

`roofing_projects.service_area` is required in SQL and Directus, and its FK is
RESTRICT. The project and area client FKs are RESTRICT. Their external_id and
scope_key columns are nullable unique strings. Reviews.external_id is nullable
and globally unique; it remains the verified Google resource identity.

Reviews use `owner_reply`, `url`, nullable exact `review_date`,
`source_created_at`, and `source_updated_at`. WordPress provenance was absent at discovery.
Reviews.client is required in the UI but nullable in SQL with SET NULL deletion.
FAQ, sponsor and coverage client FKs also use SET NULL. FAQ.service uses SET NULL,
which could silently change local scope to global; the applied model replaces this
behavior with RESTRICT. Navigation menu/page/parent edges have Directus metadata
but no SQL FK. The model adds the required integrity edges explicitly.

Coverage currently stores `service_area_sections.service_areas` JSON containing
copied `service_area` names and optional `href`; retain it as compatibility data,
and add the ordered `areas` canonical junction. Sponsors retain their slug array
while the new relation becomes authoritative.

## Historical access evidence and resolved exposure

At discovery the website reader had read-only access. `roofing_projects` and
`roofing_service_areas` are filtered to published SonShine records but use the
wildcard field grant. `videos` has an explicit field grant including its project
relation. Therefore adding job_id before restricting project fields would expose
it directly and through nested video reads. UI hidden/readonly does not prevent
that disclosure.

Reviews, FAQs, sponsors, coverage and navigation had unscoped wildcard reader
grants. The applied reader permissions replace the reviewed target grants with
explicit projections and tenant/publication predicates. Administrative policy
inspection preceded application; reader access alone did not establish ownership.

Anonymous GETs to projects, nested video/project and reviews return 403. These
were initial denial checks, not proof that a future policy addition remained safe.
The release gate rechecks both anonymous and authenticated effective permission
fields and explicit, wildcard, aliased and nested job-reference queries.

Directus policies combine additively; a restrictive new policy cannot cancel an
existing wildcard grant. Audit every effective reader/public policy before schema
application. [Directus policy documentation](https://directus.com/resources/v11-release-notes).

## Verification limits and release dependencies

Read APIs establish field nullability, single-column uniqueness and declared
relations. They do not establish all live PostgreSQL triggers/composite indexes.
The initial discovery did not run privileged SQL. Subsequent authorized invariant
installation and explicitly read-only verification established the current model.
Existing video verification contains writes and still requires separate review
and authorization despite rollback.

The candidate's PostgreSQL verification is explicitly read-only and separated
from its schema/invariant apply files. SQL execution, exact policy ownership,
post-change denial probes, project enrichment and the SonShine-only constraint
are now completed for this authorized run. Job identifiers and customer lookup
data never enter this evidence or fixtures. Workflow publication, the credentialed
application build, actual-page acceptance and deployment have separate evidence
and authorization gates.

## Local candidate verification

The prepared model passed `node scripts/verify-location-model.mjs` on Node
22.23.2. Targeted ESLint passed for all new model JavaScript files. The actual
invariant and post-backfill SQL passed in a temporary in-memory PostgreSQL engine
using @electric-sql/pglite 0.5.8: apply/rerun, read-only verification, 32 rejected
invalid mutations, trimmed/null references, tenant and neighborhood relationships,
FAQ exclusivity/deletion, junction uniqueness, navigation ownership, review-feed
rollover and SonShine-only required fields, including whitespace-only references
before and after the required-field gate, plus case-invariant UUID job identity
on inserts and updates. All fixtures were synthetic.

Temporary test dependency: `/private/tmp/sonshine-location-model-test`.
This directory contains test tooling only, not migration recovery or client data.
These synthetic checks preceded the authorized production SQL application and
live post-change verification above. They do not replace those live receipts or
establish application deployment.

### Contract v2 photo amendment

Migration inspection identified the 88 WordPress neighborhood image values as
photos. The installed schema includes nullable `roofing_neighborhoods.image`, with an
independent file relation and explicit public permission field. `coverage_map`
retains its distinct coverage-map semantics. The photo field and verified media
are now applied. Synthetic tests cover a v1-to-v2 additive rerun and independent
photo/map references and photo deletion.
