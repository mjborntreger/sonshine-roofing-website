# Location migration candidate verification

Status: implementation and migration preparation. No production schema/data apply,
workflow publication, or application deployment was performed by this task.
Full release acceptance remains incomplete.

## Version record

- Starting application and refreshed deployed revision:
  `0271ec70f46a2b31c4eb012da28459f6a9144184`.
- Candidate: recorded below after implementation freeze and independent review.
- Shared contract: `location-v3`; location snapshot format 1 with project snapshot
  format 2 and a required matching SHA-256 digest.
- Additive schema: `location-model-v2`; integrity SQL remains version 1.
- Revised workflow graph SHA-256:
  `ce3321a4fa5e6c9061b754b5a21b166f70663910fe2ac780224c3087a9025cf8`.
- Original workflow graph SHA-256:
  `dfe166e47bc8224252cb8a4c51354465ae9c99fdcd3a0e337689e5c367ae9569`.
- Actual membership seed plan SHA-256:
  `c6f2a74ee8998060c6d0396e3f42586d97ade177734968cb8f0382581895bda8`.
  Its source proof is the successful 2026-09-15 06:15:50 UTC workflow execution;
  selected identities/order and final readback matched exactly. It prepares 20
  members and 12 nonmembers without changing publication. An in-memory second
  preparation produces zero updates. Recheck fresh state before apply.
- Workflow patch artifact: private `review-workflow-patch-v4.json`, contract-v3
  metadata; prior v1/v2/v3 patches are superseded.
- Migration: `location-migration-v1`, contract v3, private `plan-candidate-v3.json`;
  canonical hash `54a660973869ca8fd45367ba5582d7ba1cc027ff92376893f160f161fdd120bb`.
  The plan has 215 proposed mutations and is not executable before fresh applied
  schema/permission readback. See the full [source accounting](location-migration.md).

## Implemented behavior

The five existing slugs use canonical service-area page owners and one static
hub layout. Local and approved nearby content selection is shared, deterministic,
client-scoped, deduplicated, and separately labeled. Optional empty sections and
null neighborhoods disappear. Neighborhood photos and coverage maps are distinct.

Deployment snapshots coordinate locations with existing project/video content,
header navigation, coverage, FAQ scopes, metadata and location/image sitemaps.
Public shared settings, services and the offer popup use the same deployed artifact,
including when a visitor navigates from another page. Internal Next layout paths
and implicit cache tags cannot bypass revalidation protection.
Draft, taxonomy-only and unknown routes are not generated; noindex pages remain
routable but leave the relevant sitemaps. Required upstream and validation errors
abort generation. Revalidation cannot create or update deployed location content.

Private job references and ZIP are excluded from explicit website projections.
Prepared Directus permission changes remove wildcard project fields before adding
job references; database constraints enforce client consistency and relationships.
Actual effective permission probes and production constraints remain unverified
until the separately authorized schema/policy apply.

Review synchronization prepares membership/order independently of editorial
publication. It preserves geography, imported URLs/replies/provenance and deliberate
unpublication; departure from the feed no longer archives an older local review.

## Verification performed

- Node 22 baseline credentialed build at the starting revision passed: 456 pages,
  53 projects, 79 videos, 333 gallery images, 438 CMS route owners.
- Candidate credentialed prebuild was attempted and failed closed because the new
  project neighborhood schema/expansion is not present in live Directus. This is
  expected before additive schema apply, and is **not** a successful candidate build.
  No fallback or stale generated project/location snapshot was retained.
- Focused fixtures cover project/video independent publication, geographic
  selection edge cases, integer review identities, exclusive FAQ scopes,
  sanitization, image descriptions, fetch errors and snapshot compatibility.
- Review workflow: 31 synthetic Code-node cases; native validation of the prepared
  changed node configurations; rollover, deliberate unpublication, successful
  empty selection and exact membership/order verification.
- Schema: synthetic additive rerun/drift/permission/recovery checks. PostgreSQL
  behavior tested in a private temporary PGlite database, including 28 invalid
  relationship/privacy-integrity writes and the independent photo/map relation.
  Privileged verification scripts were inspected before execution. No live SQL ran.
- Component rendering: 10 synthetic SSR cases, including omitted null-neighborhood
  wrappers and separate photo/map rendering. Selection: 18 focused fixtures.
- Shared shell: 35 fixtures, plus a successful credentialed read-only check of
  one settings record, four services, and nine client-scoped described badges.
- Migration: 15 synthetic accounting/idempotency/ownership/executor cases. Actual
  live inventory and dry-run reproduction succeeded; no apply executed.
- Full Node 22 typecheck, repository lint and the applicable 19 verification
  scripts pass. The revised endpoint guard covers 29 paths and 18 tags, including
  actual GET/POST handler calls that reject mixed requests before any cache write.

The independent review dispositions are appended after freeze. Synthetic
fixtures do not substitute for actual public permission probes, credentialed
candidate build, migrated content review, or deployed readback.

## Visual inspection

Generated six fixture-only scenarios using actual hub, hero, card/video facade,
coverage, sponsor and FAQ components with current Tailwind CSS. Inspected Sarasota
at 1440px and 390px, the long Lakewood Ranch title at 390px, Bradenton coverage and
partners, Venice services/map, North Port regional projects, and the empty/null
neighborhood case. No blocking clipping or unintended empty labels was observed.

These previews contain synthetic content and mocked Next/browser boundaries.
Forms and players are inactive. They exclude production header/footer and metadata,
and cannot establish the five migrated pages' editorial, geographic or interaction
acceptance. Preview generator: `scripts/preview-location-components.mjs`.
Private preview index: `/private/tmp/sonshine-location-migration-20260915/visual-preview/index.html`.

## Outstanding acceptance dependencies

- Owner's manually verified project-to-AccuLynx mapping; authenticated API access
  works. All 53 projects require enrichment accounting and approved apply before
  the SonShine-only job/ZIP required constraint can be enforced.
- Verify held review ratings and problematic source links; preserve unknown dates.
  No ratings are inferred from WordPress star graphics.
- Resolve remaining geographic conflicts and complete actual media/editorial review.
  All five direct nearby lists were explicitly approved by the owner.
- Approve durable private recovery storage and capture current narrow before-images
  plus the prior deployable application artifact before production changes.
- Resolve effective Directus administrative policy topology; authorize and apply
  reviewed schema/permissions/data, run actual probes and a credentialed build,
  complete independent review findings, and follow the coordinated workflow/app
  cutover and rollback steps in [release](location-release.md).
- Verify the five deployed routes, 404 cases, sitemap/noindex/navigation/FAQ
  boundaries, public outputs and workflow readback against recorded artifacts.

Shared context ownership records have not been changed because production ownership
has not changed. After verified release, use the context repository's metadata,
lint, focused commit and synchronization process.

## Independent review record

Pending integrated candidate freeze. Reviewers will cover correctness/publication,
privacy/data integrity, and migration/release. Each review must name the candidate
revision and artifact versions, with findings and unresolved live-state limits.

Preliminary independent model-specialist audit found five issues before freeze:
internal revalidation bypass, shared-layout snapshot leakage, silently missing
eligible FAQs, incomplete navigation targets, and malformed shared fetch results
becoming empty arrays. All five were fixed with affected focused checks; final
independent review will assess those fixes against the frozen candidate.
