# SonShine location migration — final preparation handoff

Verified 2026-09-15. **Implementation and migration preparation are complete for
the reviewed candidate. Production migration and full release acceptance remain
incomplete.** The owner's completed project/job mapping has been verified.

## State and revisions

| State | Result |
| --- | --- |
| Implemented | Common location hubs, deterministic selection, deployment snapshots, publication/navigation/FAQ/SEO/sitemap integration, additive model/privacy tooling, review-sync patch and repeatable import/enrichment tooling. |
| Migrated | No live records or files. Location plan proposes 219 mutations; separate enrichment plan proposes 53 updates. |
| Published | No new landing-page publication or workflow changes. The existing archiving workflow remains active. |
| Deployed | No deployment by this task. Refreshed live application remains 0271ec70f46a2b31c4eb012da28459f6a9144184. |
| Verified | Source accounting, 53 authenticated job matches/ZIPs, local tests, simulated reruns/recovery, fixture visuals and independent reviews. |
| Blocked | Production authorization/access resolution, schema/privacy apply, actual migration/backfill/readback, required-field constraint, successful candidate build and actual-page/release acceptance. |

Reviewed application: **`7afefbd5606bcf5284690fd5ba97bfacce67dece` (A4)**.
Branch: `feat/directus-location-hubs`.
Worktree: `/Users/home/Documents/GitHub/sonshine-location-hubs`.
The original checkout remains clean at `0271ec7`. No push, PR, merge or deployment
was performed. This handoff is a documentation-only descendant of the reviewed code.

Contract `location-v3`; model `location-model-v4`; SQL `location-invariants-v3`.
Location snapshot format 1 is bound to project/video snapshot format 2 by digest.

| Prepared artifact | Canonical SHA-256 |
| --- | --- |
| Location plan v4, 219 mutations | 4aa9693445fdb8e2d22ec00657ec40eba5961e9ebd6a5e04549eb5f1bf1ef424 |
| Enrichment plan v1, 53 updates | bd575388e8a5088e768ad484aa7a0c4deae4394673af6ee12e00cec2f8e3db42 |
| Revised review workflow graph | ce3321a4fa5e6c9061b754b5a21b166f70663910fe2ac780224c3087a9025cf8 |
| Actual feed-membership seed plan | c6f2a74ee8998060c6d0396e3f42586d97ade177734968cb8f0382581895bda8 |

## Source reconciliation

| Source | Accounted disposition |
| --- | --- |
| Five WordPress pages | Five updates to existing canonical service areas; preserved routes and taxonomy identities. |
| 88 neighborhood occurrences | 85 creates, one canonical duplicate match, two held. |
| 72 selected reviews | All held for verified source ratings; 71 dates preserved, one absent date stays null; two source URLs need correction. No fabricated Google IDs. |
| 93 media references | 89 immutable file creates, one byte-duplicate match, two held, one excluded duplicate-owner photo. Originals retained. |
| 292 relationships | 39 creates, 90 folded media updates, 86 matches, 76 held, one exclusion. Includes 17 owner-approved directed neighbor pairs. |
| Existing coverage taxonomy | One taxonomy-only Parrish record preserves existing coverage; no additional public page. |
| 53 projects | All owner mappings and authenticated job identities/ZIPs verified; 53 separately prepared updates, no conflicts or unavailable jobs. |

The job lookups preserve all existing primary service areas. Postal city/state/country
corroborate those existing assignments; this is not a municipal-boundary survey.
All neighborhoods remain unverified/null and produce no frontend label or wrapper.
No customer addresses, contacts, full job payloads or credentials were retained.
The private completed mapping remains outside Git.

Verified corrections distinguish Plantation in Venice from Lakeside Plantation in
North Port, and correct the mislabeled DeSoto Lakes source entry to DeSoto Acres
in Sarasota while preserving its original source identity. University Park / West
of Trail and Arroyo / Crestline / Village Park remain held. Primary evidence and
media limitations are in [migration](location-migration.md).

## Verification and independent dispositions

| Candidate review | Result |
| --- | --- |
| A1 cff3fcc: correctness/publication, privacy/integrity, migration/release | Eight findings; coordinator fixes independently confirmed at A2 429bdf2. |
| A3 f916d02: enrichment, recovery, geographic integration and release compatibility | Three additional P2 findings: UUID case identity, nested Git destinations, malformed private JSON errors. |
| A4 7afefbd: affected independent confirmations | All three fixed; all eleven integrated findings closed. No new material findings in the final confirmations. |

Reviewers did not act as sole reviewers of their own implementation. Each candidate
was frozen while under review. The [verification record](location-verification.md)
contains findings, fixes, artifact versions and limits.

Node 22 lint/typecheck and applicable sanitizer, JSON-LD, fetch-policy and pipeline
checks pass. Focused results include 70 enrichment/private-storage checks, 17
migration checks, 31 review-sync cases, 18 selection cases, 10 component cases,
35 shared-shell cases, 10 archive-control checks and 15 video-playback checks.
Actual invariant SQL passes in synthetic PostgreSQL, including 32 rejected invalid
writes; reviewers separately tested the UUID index and constraint.

Independent in-memory replay verified all 219 migration operations, 219 before/after
receipts and 89 media hashes, then 219 no-ops and zero replan operations. Enrichment
recovery was interrupted after write 27; resumption matched 27 and applied 26,
followed by a zero-write rerun. These are simulations, not live recovery receipts.

The baseline credentialed build passed at 0271ec7 (456 pages). The candidate's
credentialed prebuild passed its fixtures, then failed closed at the unapplied
Directus neighborhood schema. **There is no successful full candidate build.**
No stale generated location/project artifact was used as a fallback.

Six synthetic visual scenarios were inspected, including mobile, thin/empty pools
and null neighborhoods. Five overview maps contain no customer-home pins; five
disputed photographs received full-size review. The other photographs were reviewed
in contact sheets. Actual migrated-page visuals, editorial claims, links, canonicals,
structured data and browser interactions remain release checks.

## Remaining inputs and release gates

1. Resolve all effective Directus reader/public/editor/sync policy ownership with
   authorized administrative access. Current website project grants include a
   wildcard; tighten them before adding private references, then prove actual
   direct/nested/aliased denial. A restrictive additional grant is insufficient.
2. Designate durable private recovery storage and retain the actual prior deployable
   application artifact. Current temporary files do not establish durable recovery.
3. Resolve source-rating evidence for the 72 held reviews and the two malformed
   links; verify the two remaining neighborhood identities/coverage assignments or
   explicitly retain their held dispositions. No further project/job mapping is needed.
4. Authorize the concrete schema/policy/data actions and coordinated maintenance
   window. Fresh post-schema target inventories and reviewed plans must replace the
   deliberately schema-unready plans. Apply/read back the 53 enrichments, then
   enforce SonShine-only job/ZIP requirements. Neighborhood stays nullable.
5. Complete the credentialed candidate build, actual five-page visual/editorial
   review, public-output/privacy probes, deployment and workflow readback.

The exact-action boundary comes from [AGENTS.md, Deployment Boundary](../AGENTS.md):
“Do not mutate, deploy, redeploy, publish, revalidate production, submit real leads,
or run migration apply commands without explicit authorization for that exact action.”
This task has not exercised those production actions.

## Cutover and rollback

The concrete [release sequence](location-release.md) applies permissions and additive
schema first. It pauses the old archiving workflow before retaining historical
reviews, seeds the exact latest-feed membership, installs the revised workflow while
paused, and deploys compatible membership-gated consumers before expanding historical
publication. The final content snapshot and workflow are then verified together.

Rollback pauses synchronization and coordinates the retained application artifact,
workflow and narrow before-images. Compare later editorial state before restoring
fields. Preserve additive schema and safe explicit project permissions. Reverting
only the old archiving workflow is unsafe. Retain WordPress originals, compatibility
fields and WordPress media hosting through verification.

## Recovery and working artifacts

Private temporary root: `/private/tmp/sonshine-location-migration-20260915`
(directory 0700, files 0600). It includes:

- `plan-candidate-v4.json`, `approvals-reviewed-v3.json`, `prepared-recovery-v4.json`
  and `prepared-mapping-v4.json`.
- `project-enrichment-plan-v1.json`, `project-enrichment-discovery-v3.json`,
  `project-enrichment-before-v2.json` and the owner's completed mapping.
- `review-workflow-current-active.json`, `review-workflow-patch-v4.json`,
  `review-seed-input-actual-v1.json` and `review-seed-plan-actual-v1.json`.
- Original source/media exports, geography supplement and `visual-preview/index.html`.

Prepared before-images are not production execution receipts. Capture fresh narrow
before/after state during authorized apply. `LOCATION_MIGRATION_PRIVATE_ROOT`
supports approved durable storage outside Git. See [enrichment](location-enrichment.md),
[model permissions](location-model-permissions.md) and [review sync](location-review-sync.md)
for commands and ownership boundaries.

AGENTS.md, CONTENT.md and SEO.md describe candidate authoring behavior and explicitly
preserve current production ownership. Shared-context ownership records remain
unchanged until a verified cutover; then follow their metadata, lint, focused commit
and synchronization process.
