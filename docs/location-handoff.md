# SonShine location migration — applied-phase handoff

Verified 2026-09-15. **The approved Directus preparation and migration phase is
complete. Workflow publication and website deployment remain held.** The five
location hubs and 85 reusable neighborhoods are drafts; the current public site
continues to use its existing WordPress location pages.

## State and revisions

| State | Result |
| --- | --- |
| Implemented | Common hubs, deterministic selection, deployment snapshots, navigation/FAQ/SEO/sitemap integration, model/privacy, review-sync patch, repeatable import and enrichment tooling. |
| Migrated | 219 approved operations accounted for: five page drafts, 85 neighborhood drafts, 89 files, one taxonomy-only area and 39 junctions. All 53 project enrichments applied and verified. |
| Published | No new location/neighborhood publication. No workflow save/publication. Existing 32 reviews remain unchanged. |
| Deployed | No deployment by this task. Current application remains `0271ec70f46a2b31c4eb012da28459f6a9144184`. |
| Verified | Actual schema/permissions/constraints, every imported target and media byte hash, source dates, no-op reruns, privacy, Node 22 checks, credentialed builds and local standalone behavior. |
| Remaining | Five-page SEO/editorial publication preparation, held review/geography decisions, membership seeding, coordinated workflow/app cutover and deployed acceptance. |

Execution candidate: **`43fbd45f24bb4c9bd4d68f3ed19fe457d3f31a0e`**.
Application behavior remains the independently reviewed A4
`7afefbd5606bcf5284690fd5ba97bfacce67dece`; subsequent code fixes cover permission
inventory, semantic JSON defaults and source-date restoration for new files.
Branch: `feat/directus-location-hubs`.
Worktree: `/Users/home/Documents/GitHub/sonshine-location-migration-apply`.
The original checkout remains at `0271ec7`. No push, PR, merge or deployment was
performed. The final documentation commit is a descendant of the execution candidate.

Contract `location-v3`; model `location-model-v4`; SQL `location-invariants-v3`.
Location snapshot format 1 is bound to project/video snapshot format 2 by digest.

| Artifact | SHA-256 (canonical unless noted) |
| --- | --- |
| Applied location plan, 219 operations | `a86b32efe0f8066a0c3feb3ba51d6b7883918a4e401fc723b44407bd62fde710` |
| Fresh post-import plan, zero operations/conflicts | `8b4ba11f266c8762c037da95cb211ae5eced22295e8d293be181ad80ac4831d1` |
| Applied enrichment plan, 53 updates | `7b74818c99e51db4da303bfb5a07428e335dce67904dcdc9a7627cdebc2912b2` |
| Prepared revised workflow graph, unpublished | `ce3321a4fa5e6c9061b754b5a21b166f70663910fe2ac780224c3087a9025cf8` |
| Prepared five-page SEO/date proposal (file hash) | `f7276557a5841c7d9313ba1829db68ccbc8c9bcd7d17341aef929e00e3202eb1` |
| Actual draft visual evidence (file hash) | `7b1ffa6343399d96cac71104aec6d1c219751e5c46e1dc9421322bffa6bf9a75` |
| Verified production-flag project/video snapshot | `941ae39d93a20420d6a13e7b35d4b8cc72d240a34f6e2b68f80e8e5e82e82c93` |
| Matching location snapshot with drafts excluded | `f0debe9f1468796304d3ee4d94926e8738bce13df72b4861103cec2373cfad53` |

## Source reconciliation

| Source | Accounted disposition |
| --- | --- |
| Five WordPress pages | Five existing canonical owners updated as drafts; route slugs and taxonomy identities preserved. |
| 88 neighborhood occurrences | 85 draft creates, one canonical duplicate match, two held. |
| 72 selected reviews | All held for verified source ratings; 71 dates retained, one absent date stays null; two source URLs need correction. No invented Google IDs. |
| 93 media references | 89 immutable file creates, one byte-duplicate match, two held, one excluded duplicate-owner photo. |
| 292 relationships | 39 creates, 90 media updates folded into owners, 86 original matches, 76 held, one exclusion. Includes 17 approved directed neighbor pairs. |
| Existing coverage taxonomy | One taxonomy-only Parrish record; no additional landing page. |
| 53 projects | 53 owner-verified job/ZIP enrichments applied, read back and repeated with no writes. All existing primary service areas preserved. |

The main location planner retains a generic 53-entry enrichment hold because it
uses a separate pipeline. The completed enrichment receipts and required-constraint
readback supersede that line; enrichment is complete, not blocked.

Verified corrections distinguish Plantation in Venice from Lakeside Plantation in
North Port and correct the mislabeled DeSoto Lakes source entry to DeSoto Acres
in Sarasota while preserving original source identity. Longboat Key belongs to
Sarasota. University Park / West of Trail and Arroyo / Crestline / Village Park
remain held. ZIP alone was never used to establish neighborhood membership.

All project neighborhoods remain unverified/null and have no frontend label or
wrapper. The SonShine-only job/ZIP requirement is active; other clients retain
optional fields. Actual public and website access excludes both fields. Customer
addresses were lookup inputs, not retained customer payloads or repository fixtures.

## Verification and independent dispositions

- All eleven A1–A4 integrated review findings remain closed. The applied-phase
  compatibility fixes and timestamp-recovery P2 received independent confirmation.
  The release-checklist neighborhood-publication omission was corrected and
  independently closed. Actual draft/SEO review found no new material defect.
- Independent live migration review matched all 219 targets, all 89 media hashes,
  all timestamp restorations and recovery receipts. No material execution defect
  remained. The first file was safely recovered after Directus changed upload dates.
- The original-plan repeat matched **219, wrote zero**. Fresh replanning proposed
  **zero operations and zero conflicts**. Enrichment repeated **53 matches, zero writes**.
- Effective permission probes passed before and after enrichment. The actual
  database enforces tenant consistency, unique jobs and the SonShine-only requirement.
- All 30 applicable Node 22 checks passed. Credentialed default and production-flag
  builds passed: 451 pages, 53 projects, 79 videos, 333 gallery images and 438 CMS
  route owners. Production-flag local builds report absent lead/analytics environment
  values; live lead submissions and production analytics were not exercised.
- Standalone checks returned 404 for all five drafts, two taxonomy-only areas and
  an unknown slug. All 53 project pages, project/video APIs, FAQ and four relevant
  sitemaps responded successfully; the draft-only location sitemap is empty.
- No actual job IDs or credentials were found in 4,066 generated/build/changed
  source files or 72 response bodies. Snapshot digests match.

Actual draft previews use the imported content and real components at desktop and
mobile widths. No overflow or missing image was observed. The private
`draft-preview/publication-content-proposal-v1.md` prepares all five SEO/date sets.
Two image associations need verification; the prepared default omits photos for
Newtown / Washington Park, Waterford and Sawgrass until confirmed. No CMS update
was made from this proposal. Evidence and limits are in
[verification](location-verification.md). This does not
substitute for the final five published-route build and deployed browser acceptance.
The [full verification record](location-verification.md) separates synthetic,
actual CMS, local runtime and deployed checks.

## Remaining owner decisions and final approval boundary

The approved Directus phase needs no further approval. Affected CMS editing may
resume; subsequent execution must refresh modification state and preserve later edits.

1. Review the five pages' prepared SEO/editorial publication values and actual
   drafts, plus the 85 imported neighborhood records. Their shared SEO fields are
   currently empty and publication remains draft. Approve eligible neighborhoods
   for publication too; page publication alone does not expose neighborhood cards.
   Resolve the noted photo associations or use the prepared omission default.
2. Supply verified ratings/source evidence for the 72 held reviews and correct two
   malformed source links. Retain uncertain neighborhood entries as held until their
   identities/coverage are verified. No further project/job mapping is needed.
3. Approve the final coordinated workflow publication and website deployment only
   after those content decisions and remaining checks are resolved. The current
   candidate cannot be deployed as the five-page release while its owners are drafts.

No membership seed or historical review expansion occurred. The original workflow
is still active and compatible with the unchanged 20-published/12-archived review
set. Membership is zero: deploying new sitewide consumers before seeding would
empty that feed. The [release guide](location-release.md) specifies the sequence:
pause the old workflow and confirm no active old run, refresh/seed exact membership,
install the revised workflow while paused, publish reviewed page and neighborhood
content, build and
deploy compatible consumers, then retain/import approved historical reviews and
verify the final snapshot before enabling the revised workflow.

## Recovery

Approved private root:
`/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15`
(directories 0700, files 0600). It contains:

- Exact applied plans, authorization, source inventories and completed private mapping.
- `location-apply-02/`, `location-repeat-01/`,
  `project-enrichment-apply-01/`, `project-enrichment-repeat-01/`.
- Schema/policy before-images, SQL and privacy readbacks, source-date receipts.
- Original and proposed workflow graphs and the historical membership seed plan;
  refresh that seed before release.
- `prior-application-0271ec7.docker.tar.gz`, a verified readable prior image archive,
  and its export receipt. Image digest:
  `sha256:37463c5bfb2ea184893788de6b0c3e0e03060c12bf2558a41283eed86f745b07`.
- Credentialed build/runtime privacy receipts, `execution-checkpoint-02.json`
  and `draft-preview/` review artifacts.

Rollback must compare current state with narrow after-images before restoring
migration-owned fields. Keep explicit privacy permissions and additive schema.
Restoring original null job/ZIP fields requires separately authorized removal of
only the SonShine requirement first. Reverting the old archiving workflow alone is
unsafe. Preserve WordPress originals, compatibility fields, files and hosting.
No recovery run or WordPress retirement was performed.

Repository authoring and content-ownership documents reflect the implemented model.
Shared-context public ownership remains unchanged until verified release; then use
its metadata, lint, focused commit and synchronization process.
