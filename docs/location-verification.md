# Location migration candidate verification

Current scope: static, manually maintained location reviews. The owner withdrew all
n8n changes on 2026-09-15. [Current release instructions](location-release.md) and
[manual review ownership](location-reviews.md) supersede every historical workflow,
membership seed and cutover instruction below. Abandoned patch/seed artifacts are
withdrawn and must not be executed. The existing workflow remains unchanged.

See [current editorial status](location-editorial-status.md) and [handoff](location-handoff.md)
for applied counts and remaining website-release approval. A1–A4 and the original
applied-phase evidence below describe their named historical candidates; they do not
establish verification of subsequent manual-review changes.

## Applied-phase verification — 2026-09-15

Execution code: `43fbd45f24bb4c9bd4d68f3ed19fe457d3f31a0e`. Application behavior is
unchanged from independently reviewed A4; intervening changes fix the permission
inventory response, JSON-default comparison and new-file timestamp recovery.
Shared contract `location-v3`, model `location-model-v4`, SQL `location-invariants-v3`.

| Artifact | Canonical SHA-256 / result |
| --- | --- |
| Applied location plan | `a86b32efe0f8066a0c3feb3ba51d6b7883918a4e401fc723b44407bd62fde710` |
| Fresh post-import replan | `8b4ba11f266c8762c037da95cb211ae5eced22295e8d293be181ad80ac4831d1`; zero operations/conflicts |
| Applied enrichment plan | `7b74818c99e51db4da303bfb5a07428e335dce67904dcdc9a7627cdebc2912b2`; 53 exact updates |
| Original workflow | Original graph below remains active; no workflow save/publication |
| Current deployed application | `0271ec70f46a2b31c4eb012da28459f6a9144184`; unchanged |

Independent actual readback verified every approved field of all 219 migration
targets, all 89 file byte hashes, 218 before/after pairs plus the recovered first
file, and 89 guarded source-timestamp restorations. Same-plan repeat matched 219
with zero writes. Reviews remain exactly equal to pre-import inventory: 20 published
and 12 archived. Taxonomy IDs/slugs/scope/external identity and legacy compatibility
fields remain unchanged. All five landing pages and 85 neighborhoods are drafts.

Independent enrichment/privacy review verified all 53 populated unique job IDs and
ZIPs, unchanged areas, null neighborhoods, actual SonShine-only required constraint
and direct/nested/alias public denial. Global optionality for other clients and the
existing required primary area are preserved. No customer lookup payloads or private
identifiers appear in these reports.

### Live compatibility fixes and independent dispositions

| Finding | Resolution and evidence |
| --- | --- |
| Directus permissions endpoint returns a complete unpaginated response with virtual system rows | Narrow virtual-row exclusion, persistent identity validation and client-side matching; independent review, focused checks and live apply/readback pass (`b5e412d`). |
| Directus returns parsed JSON defaults rather than serialized defaults | JSON-only semantic comparison preserves drift rejection; synthetic and actual zero-action schema verification pass (`05d1f6b`). |
| Directus upload overwrites source timestamps; API updates refresh modified_on | New-file creation-proof SQL helper conditions on exact ID, metadata and both current timestamps; byte verification, durable before/after receipts and API readback. No ordinary existing-file repair (`43fbd45`). |
| P2: already-correct timestamp retry could omit recovery evidence | Fresh readback and durable match receipt added. Independent reproduction and 41 checks including PostgreSQL-compatible SQL pass; finding closed before execution. |

All 30 repository-prescribed/applicable Node 22 checks pass, including lint,
typecheck, sanitizers, JSON-LD, fetch policy, project/video pipeline, archive/player,
location selection/components/model/review-sync/migration/enrichment and shared shell.
A credentialed candidate build passes: 451 generated pages, 53 projects, 79 videos,
333 gallery images and 438 published CMS route owners. Its five fewer pages than
the historical baseline are the five intentionally draft location hubs. No stale
location snapshot was used. This build does not approve publishing those drafts.

Production-flag credentialed build also passed. It reported missing local lead and
analytics environment values; no live form submission or analytics test was performed.
The standalone production-flag runtime returned 404 for the five drafts, two
additional taxonomy-only areas and an unknown slug. All 53 project pages, project
and video resource APIs, FAQ and location/project/video/image sitemaps responded
successfully. The location sitemap is empty because no landing page is published.
Snapshot digests: project/video
`941ae39d93a20420d6a13e7b35d4b8cc72d240a34f6e2b68f80e8e5e82e82c93`,
location `f0debe9f1468796304d3ee4d94926e8738bce13df72b4861103cec2373cfad53`.
Live local resource pagination returns all 53 projects and 79 videos in two pages
each without duplicate IDs. The Sarasota archive filter returns exactly the 18
matching snapshot projects. Recursive public-object inspection passes for 11,327
fields; the configured business address postal code is intentionally public.
A scan of all 53 actual private job references and configured credential values
found zero occurrences in 4,066 generated/build/changed-source files and 72 response
bodies. The private receipt is `candidate-runtime-privacy-43fbd45-01.json`.

The independent migration/release reviewer found no material execution or recovery
defect and confirmed all source dispositions and no-op receipts against this exact
code/plan. The original workflow remains compatible with the unchanged review set;
the former membership-dependent consumer was subsequently withdrawn; current
sitewide behavior is restored to baseline, with manual imports excluded by null identity.

### Actual draft visual and publication preparation

Private capture `draft-preview/input.json` is bound to input digest
`c6a6568925edb4da4b947a8c91079a756b052204ac48c20c094e3bf2d5570360`.
It combines current draft page/neighborhood projections with published project,
video and shared-shell data. All five pages were inspected at 1440px and 390px;
images loaded and no horizontal overflow was observed. Mobile evidence uses six
viewport captures per page because full-page capture exceeded the browser limit.
Each page shows six selected project/video facades. The private preview adapter
was corrected to attach each published video by videoId, matching the application
snapshot reader, before final capture. Application code did not change.

| Page | Neighborhoods | Local / nearby projects | Local / nearby sponsors |
| --- | ---: | ---: | ---: |
| Sarasota | 21 | 6 / 0 | 2 / 1 |
| Bradenton | 19 | 2 / 4 | 1 / 2 |
| Lakewood Ranch | 20 | 1 / 5 | 0 / 3 |
| Venice | 15 | 6 / 0 | 0 / 3 |
| North Port | 10 | 6 / 0 | 6 / 0 |

All five maps describe coverage without observed customer-home pins. All visible
images have descriptions. The 30 project links and 20 service links use canonical
published destinations; nearby cards retain actual location labels. Every project
neighborhood is null, and its label/wrapper is absent. Local review groups are
empty. Each preview has eight shared FAQs; this does not create local FAQ content.
Existing independent project testimonials remain, without a business rating aggregate.

Two image associations need editorial evidence: Newtown / Washington Park's
waterfront image, and the photo shared by Waterford and Sawgrass. The prepared
safe default omits those three optional photo links while retaining files and
provenance. This recommendation has not changed CMS records.

`draft-preview/publication-content-proposal-v1.md` and its guarded JSON companion
prepare the five missing shared SEO/publication-date fields per page. The original
WordPress dateGmt supplies published_at; no current date is substituted. Titles,
descriptions and keyword sets use verified service categories and existing local
copy. All five proposed pages pass the actual normalizer with publication simulated
only in memory. No hypothetical snapshot was persisted into the application.
The future apply must recheck the recorded modification dates and empty before-values.
Proposal file hash: `f7276557a5841c7d9313ba1829db68ccbc8c9bcd7d17341aef929e00e3202eb1`.
Visual evidence file hash: `7b1ffa6343399d96cac71104aec6d1c219751e5c46e1dc9421322bffa6bf9a75`.

An independent reviewer confirmed the exact proposal/source/input hashes, all five
original publication dates and modification dates, the five-field/null-before
projections, and service/copy consistency. Twenty mobile hero/project/coverage/FAQ
captures across all five cities passed independent visual spot inspection and hash
checks. No new material finding was reported. The reviewer supported omitting the
three uncertain optional image associations pending evidence and confirmed the
absence of neighborhood-route links and AggregateRating markup.

These static component previews exclude hydration, real form submission, video
playback, production header/footer and deployed metadata. External link syntax is
checked; destination availability was not tested. They do not replace final
published-page build, browser and deployed acceptance after authorization.

Independent documentation review found one P2 omission: the release checklist
originally named only page publication. The corrected sequence explicitly reviews
and publishes eligible neighborhood drafts before building, retaining held records
and omitting uncertain media. The reviewer independently confirmed closure.
A minor pre-apply enrichment inventory wording error was also corrected.

All five existing production location routes and the homepage, project archive,
video library and FAQ still returned HTTP 200 after migration. This verifies
continued availability of the old deployed application, not a new location release.

## Historical preparation version record

- Starting application and refreshed deployed revision:
  `0271ec70f46a2b31c4eb012da28459f6a9144184`.
- First frozen candidate (A1): `cff3fcc91eafb49adf2a04737861a20bf718e8de`.
- Confirmed candidate (A2): `429bdf2e70f32a66c5b92a650d82c3a358922b86`.
  All eight A1 findings were independently confirmed fixed.
- Enrichment/geography candidate (A3): `f916d0260257bf60e6f0daf67fae5672e62306f6`.
  Its three additional findings and the A4 correction record appear below.
- Final reviewed application candidate (A4):
  `7afefbd5606bcf5284690fd5ba97bfacce67dece`. All eleven integrated review findings
  are independently confirmed resolved. See [final handoff](location-handoff.md).
- Shared contract: `location-v3`; location snapshot format 1 with project snapshot
  format 2 and a required matching SHA-256 digest.
- Additive schema: `location-model-v4`; integrity SQL `location-invariants-v3`.
  A1 used model v2 / SQL v1; A2/A3 used model v3 / SQL v2. A4 also enforces
  case-invariant UUID job identity in the planner and actual database.
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
  behavior tested in a private temporary PGlite database, including 32 invalid
  relationship/privacy-integrity writes and the independent photo/map relation.
  Privileged verification scripts were inspected before execution. No live SQL ran.
- Component rendering: 10 synthetic SSR cases, including omitted null-neighborhood
  wrappers and separate photo/map rendering. Selection: 18 focused fixtures.
- Shared shell: 35 fixtures, plus a successful credentialed read-only check of
  one settings record, four services, and nine client-scoped described badges.
- Migration: 17 synthetic accounting/idempotency/ownership/executor cases. Actual
  live inventory and dry-run reproduction succeeded; no apply executed.
- One-time enrichment: 70 synthetic planning, tenant, conflict, idempotency,
  recovery and private-root checks passed. Actual discovery verified all 53
  owner-mapped job identities and ZIPs; the offline plan proposes 53 updates.
- Full Node 22 typecheck, repository lint and the applicable 19 verification
  scripts pass. The revised endpoint guard covers 29 paths and 18 tags, including
  actual GET/POST handler calls that reject mixed requests before any cache write.
- A4 archive controls: 10 checks passed. Video playback/publication: 15 checks passed.

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

## Historical pre-apply acceptance dependencies

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
  follow the coordinated workflow/app
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

### A3 review and A4 corrections

All three reviews ran against clean A3, shared contract location-v3, model v3 /
SQL v2, current location plan v4 and enrichment plan v1. No implementation changed
until every report finished. Findings:

| Finding / severity | Correction and affected checks |
| --- | --- |
| Case variants of a UUID bypassed job uniqueness / P2 | Canonicalize UUIDs in source/target comparisons and SQL writes, add case-invariant unique index and canonical-value constraint. Planner and actual PGlite tests reject duplicate inserts/updates while preserving client scoping. |
| A Git checkout nested beneath the private root could receive private artifacts / P2 | Check Git ancestry of every resolved destination parent for JSON reads/writes and media-byte reads. Added nested-checkout cases. |
| Malformed JSON could leak an input excerpt through review CLI errors / P2 | Common reader now suppresses parsing details before any caller receives the error. Added malformed synthetic private-input regression. |

All three corrections pass focused checks and independent A4 confirmation at
`7afefbd5606bcf5284690fd5ba97bfacce67dece`. No new material findings were reported.
Prepared content/enrichment plan hashes remain unchanged.

A3 independent migration replay verified all 219 operations, 219 before/after
receipts and 89 media hashes, then 219 no-ops and zero replan operations. Enrichment
review simulated 53 updates, interrupted after write 27 before its after-receipt,
resumed with 27 matches and 26 updates, then made zero writes on the next run.
Another reviewer inspected all five disputed photos at full size and confirmed
three corrected communities and two held entries, preserving original provenance.
The original workflow graph, revised graph and actual seed artifacts were unchanged.
These are offline tests, not production write or recovery evidence.

A4 reviewers independently reproduced case-invariant mapping and existing-job
ownership checks, nested Git-directory/worktree-file rejection, and sanitized
malformed-input errors through the actual review CLIs. PostgreSQL checks also
verified the canonical constraint and folded unique index independently, and the
read-only verifier rejected a missing constraint. The standard SQL suite rejects
32 invalid mutations; the extended reviewer run added two independent rejections.
All final reviewers reported unchanged worktrees and no production actions.
