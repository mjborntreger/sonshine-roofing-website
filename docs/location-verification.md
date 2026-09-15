# Location migration candidate verification

Status: implementation and migration preparation. No production schema/data apply,
workflow publication, or application deployment was performed by this task.
Full release acceptance remains incomplete.

## Version record

- Starting application and refreshed deployed revision:
  `0271ec70f46a2b31c4eb012da28459f6a9144184`.
- First frozen candidate (A1): `cff3fcc91eafb49adf2a04737861a20bf718e8de`.
- Confirmed candidate (A2): `429bdf2e70f32a66c5b92a650d82c3a358922b86`.
  All eight A1 findings were independently confirmed fixed. Subsequent enrichment
  tooling and geographic corrections require a separate A3 review record.
- Shared contract: `location-v3`; location snapshot format 1 with project snapshot
  format 2 and a required matching SHA-256 digest.
- Additive schema: `location-model-v3`; integrity SQL `location-invariants-v2`.
  A1 used model v2 / SQL v1; A2 adds whitespace normalization and permission fixes.
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
- Migration: `location-migration-v1`, contract v3, private `plan-candidate-v4.json`;
  canonical hash `4aa9693445fdb8e2d22ec00657ec40eba5961e9ebd6a5e04549eb5f1bf1ef424`.
  The plan has 219 proposed mutations and is not executable before fresh applied
  schema/permission readback. See the full [source accounting](location-migration.md).
- Enrichment: private `location-enrichment-v1`, `project-enrichment-plan-v1.json`;
  canonical hash `bd575388e8a5088e768ad484aa7a0c4deae4394673af6ee12e00cec2f8e3db42`.
  All 53 updates are prepared; schema/privacy gates prevent apply. No required
  constraint has run. See [enrichment evidence](location-enrichment-evidence.md).

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
- Candidate credentialed prebuild exposed a fixture client-environment leak at A1.
  After correction, all prebuild fixture gates passed with the real client environment.
  The build then failed closed because the new project neighborhood schema/expansion
  is not present in live Directus. This is expected before additive schema apply,
  and is **not** a successful candidate build. The corrected build runner propagated exit 1.
  No fallback or stale generated project/location snapshot was retained.
- Focused fixtures cover project/video independent publication, geographic
  selection edge cases, integer review identities, exclusive FAQ scopes,
  sanitization, image descriptions, fetch errors and snapshot compatibility.
- Review workflow: 31 synthetic Code-node cases; native validation of the prepared
  changed node configurations; rollover, deliberate unpublication, successful
  empty selection and exact membership/order verification.
- Schema: synthetic additive rerun/drift/permission/recovery checks. PostgreSQL
  behavior tested in a private temporary PGlite database, including 30 invalid
  relationship/privacy-integrity writes and the independent photo/map relation.
  Privileged verification scripts were inspected before execution. No live SQL ran.
- Component rendering: 10 synthetic SSR cases, including omitted null-neighborhood
  wrappers and separate photo/map rendering. Selection: 18 focused fixtures.
- Shared shell: 35 fixtures, plus a successful credentialed read-only check of
  one settings record, four services, and nine client-scoped described badges.
- Migration: 17 synthetic accounting/idempotency/ownership/executor cases. Actual
  live inventory and dry-run reproduction succeeded; no apply executed.
- One-time enrichment: 63 synthetic planning, tenant, conflict, idempotency,
  recovery and private-root checks passed. Actual discovery verified all 53
  owner-mapped job identities and ZIPs; the offline plan proposes 53 updates.
- Full Node 22 typecheck, repository lint and the applicable 19 verification
  scripts pass. The revised endpoint guard covers 29 paths and 18 tags, including
  actual GET/POST handler calls that reject mixed requests before any cache write.

The independent review findings and fixes are recorded below. Synthetic
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

- All 53 manual project-to-job mappings and authenticated job lookups are verified,
  with 53 valid ZIPs and preserved primary areas. Neighborhoods remain unverified.
  Approved backfill and successful readback are still required before enforcing
  the SonShine-only job/ZIP required constraint.
- Verify held review ratings and problematic source links; preserve unknown dates.
  No ratings are inferred from WordPress star graphics.
- Resolve remaining geographic conflicts and complete actual media/editorial review.
  All five direct nearby lists were explicitly approved by the owner.
- Approve durable private recovery storage and capture current narrow before-images
  plus the prior deployable application artifact before production changes.
- Resolve effective Directus administrative policy topology; authorize and apply
  reviewed schema/permissions/data, run actual probes and a credentialed build,
  review subsequent enrichment integration, and follow the coordinated workflow/app
  cutover and rollback steps in [release](location-release.md).
- Verify the five deployed routes, 404 cases, sitemap/noindex/navigation/FAQ
  boundaries, public outputs and workflow readback against recorded artifacts.

Shared context ownership records have not been changed because production ownership
has not changed. After verified release, use the context repository's metadata,
lint, focused commit and synchronization process.

## Independent review record

Three independent reviewers examined clean A1 at
`cff3fcc91eafb49adf2a04737861a20bf718e8de`, shared contract `location-v3`, model v2,
SQL v1, the unchanged workflow hash above, and migration plan v3 hash
`54a660973869ca8fd45367ba5582d7ba1cc027ff92376893f160f161fdd120bb`.
No implementation changed during
their review. The coordinator owns every correction below. The same reviewers
confirmed all eight findings fixed at frozen A2, with no new material findings
within the affected scope. Their conclusions do not authorize production release.

| Review / severity | Finding | Correction and focused evidence |
| --- | --- | --- |
| Correctness / P1 | Fixture client inherited the credentialed build environment. | Scope and restore the fixture client; retain the cross-client rejection case. Credentialed prebuild fixtures now pass. |
| Correctness / P2 | Query, fragment and same-site absolute navigation URLs bypassed location publication checks. | Normalize the URL, resolve its canonical published owner, then preserve a valid suffix. Added draft/taxonomy/unknown and published URL variants. |
| Correctness / P2 | An expanded neighborhood with missing or invalid status silently disappeared. | Validate the status enum; only known draft/archived records normalize to absent. Added malformed and intentionally unpublished cases. |
| Privacy / P1 | Service-area reader projection omitted requested source_updated_at. | Add the public timestamp and check all requested root fields against prepared projections. |
| Privacy / P2 | Permission tightening could broaden an existing narrow field grant. | Preserve the intersection for narrow grants; reject unavailable/empty scopes. Added restrictive-grant cases. |
| Privacy / P2 | Tabs/newlines bypassed blank job-reference normalization and required checks. | Normalize edge whitespace to null and reject invalid required values in actual SQL; 30 rejected-mutation PGlite checks pass. |
| Privacy / P2 | Recovery paths accepted the repository root or symlinks into Git. | Resolve existing ancestors/symlinks, reject any Git ancestor and require a private directory. Added root, descendant, symlink and valid external-path cases. |
| Migration / P2 | A missing explicit review target could become a create; a conflicting target could override canonical provenance. | Require exactly one explicit target consistent with every provenance match; both cases now produce conflicts and no review writes. |

The migration/release reviewer independently replayed all 215 prepared operations
in memory, verified 87 media byte hashes and 215 before/after receipts, then observed
215 no-ops on a second execution and zero operations/conflicts on replanning.
The corrected planner reproduces the same canonical plan hash. These checks do
not constitute a live migration or recovery rehearsal.

A2 correctness confirmation additionally passed an independent 64-case navigation
matrix, ten neighborhood-state cases, and an in-process tenant-environment
restoration check. Privacy confirmation passed model, pipeline and actual PGlite
SQL checks (30 rejected invalid writes). Migration confirmation passed 16 tests
and reproduced the same 215-operation artifact. Worktrees remained unchanged
during all three confirmations. The subsequently added seventeenth migration
fixture covers the verified display-name correction while retaining source identity.

Preliminary independent model-specialist audit found five issues before freeze:
internal revalidation bypass, shared-layout snapshot leakage, silently missing
eligible FAQs, incomplete navigation targets, and malformed shared fetch results
becoming empty arrays. All five were fixed with affected focused checks; final
independent A1 review covered those fixes and their integrated behavior. Actual
schema permissions, enriched records, migrated pages and release remain unverified.
