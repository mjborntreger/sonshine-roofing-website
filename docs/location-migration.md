# Location migration tooling and applied results

Status: authorized Directus schema/data migration applied and read back on
2026-09-15. Five pages and 85 neighborhoods remain drafts. Workflow publication
and application deployment remain held.

Shared contract: v3 in [location-contract.md](location-contract.md). Migration
artifact version remains `location-migration-v1`. Starting application revision:
`0271ec70f46a2b31c4eb012da28459f6a9144184`. The coordinator records the frozen
integrated application revision separately. Execution and guarded file-timestamp
recovery used `43fbd45f24bb4c9bd4d68f3ed19fe457d3f31a0e`.

## Applied plan and reconciliation

The approved durable recovery root is
`/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15`.
The executed `location-plan-ready-01.json` has canonical hash
`a86b32efe0f8066a0c3feb3ba51d6b7883918a4e401fc723b44407bd62fde710`.
All 219 operations are accounted for: the completed run applied 218 operations
and matched the file created by the first interrupted attempt. It restored source
timestamps on 89 newly created files. `location-apply-02/complete.json` and
`location-apply-summary-02.json` record these results; narrow receipts retain the
individual readbacks. No reviews or projects were written by the location import.
The same original-plan live repeat then matched all 219 operations with zero
writes (`location-repeat-summary-01.json`); ordinary matches did not invoke
timestamp restoration.

The fresh post-apply plan, `location-plan-after-01.json`, has hash
`8b4ba11f266c8762c037da95cb211ae5eced22295e8d293be181ad80ac4831d1`:
zero proposed operations and zero conflicts. It accounts for five page matches,
86 neighborhood matches/two held, 90 media matches/two held/one excluded,
215 relationship matches/76 held/one excluded, one taxonomy match and 72 held
reviews. The following table preserves the executed plan's source dispositions;
its folded relationship updates are not additional API operations.

| Source group | Total | Create | Update | Match | Held | Excluded |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Existing coverage taxonomy | 1 | 1 | 0 | 0 | 0 | 0 |
| Location pages | 5 | 0 | 5 | 0 | 0 | 0 |
| Neighborhood occurrences | 88 | 85 | 0 | 1 | 2 | 0 |
| Selected reviews | 72 | 0 | 0 | 0 | 72 | 0 |
| Source media | 93 | 89 | 0 | 1 | 2 | 1 |
| Relationships | 292 | 39 | 90 | 86 | 76 | 1 |
| Project enrichment | 53 | 0 | 0 | 0 | 53 | 0 |

The 53 enrichment holds are this planner's separate-pipeline accounting. All 53
were applied and verified by the enrichment pipeline; its SonShine-only required
constraint is installed. They are not outstanding project mappings.

No conflicts were overwritten. Relationship counts include 88 primary-area
occurrences, 93 media references, 72 review-area proposals, ten sponsor pairs,
17 approved direct-neighbor pairs, and twelve existing coverage-list entries.
The 90 media relation updates are folded into their page/neighborhood operations;
they are not another 90 API writes. No navigation records currently contain a
direct location URL needing migration.

Parrish was present in the existing coverage list but absent from the thirteen
canonical service areas. Its new record is published taxonomy with
`page_status=taxonomy_only`, no page content, and no fabricated WordPress ID. The
database-generated `sonshine-roofing:parrish` scope key was verified. Its coverage
junction follows that record; it creates no additional public route.

The five existing area records received concise local draft introductions. Existing
IDs, taxonomy publication, slugs, scope keys, and taxonomy provenance remain owned
by their existing records. The planner initializes a landing page only when its
page fields are empty. Later editorial content and page publication are preserved.
Imported neighborhoods begin as drafts with optional descriptions omitted.

## Geography and media decisions

The owner approved all seventeen direct nearby relationships in the five lists
recorded in [the evidence](location-migration-evidence.md). They are explicit
directed relationships; the migration performs no recursive or distance expansion.

Longboat Key uses one Sarasota-owned neighborhood. Its duplicate Bradenton
occurrence maps to that canonical record. The Sarasota photograph is retained for
the card; the alternate Bradenton photo stays in WordPress and is excluded from
import because that duplicate presentation is not used.

Verified source corrections are Bay Isles to Sarasota under the Longboat Key
organization decision, and The Lake Club and The Concession to Lakewood Ranch.
Evidence: [Bay Isles Association](https://www.bayisles.com/contact/),
[The Lake Club HOA](https://www.lakeclublife.com/), and
[The Concession](https://theconcession.com/history/), checked 2026-09-15.

Further full-size photo and primary-source review resolved three source labels:

- Plantation in Venice names Plantation Golf & Country Club on its sign; its
  [official contact page](https://www.plantationgcc.com/contact-us) confirms Venice.
- North Port's Plantation photo names Lakeside Plantation. The
  [official community district](https://www.lakesideplantationcdd.com/) confirms
  North Port. Its display name becomes Lakeside Plantation; its original raw
  source key and deterministic ID remain unchanged. It is distinct from Venice.
- The DeSoto Lakes source entry's filename, alt and distinctive description identify
  DeSoto Acres. The [county-authored neighborhood plan](https://desotoacres.org/wp-content/uploads/2021/01/BOCC-Approved-DeSoto-Acres-Neighborhood-Plan_2020.06.03.pdf)
  corroborates the intended community. Correct the display name to DeSoto Acres,
  retain Sarasota and source identity, omit the description, and use a neutral
  photo description. Exact aerial geolocation was not independently established.

Two occurrences/photos remain held: University Park / West of Trail and Arroyo /
Crestline / Village Park. The [University Park district](https://universityparkrd.com/)
places its community in Manatee County; the combined source label and exact aerial
remain unresolved. The latter photo visibly names Arroyo Vista without verified
Sarasota linkage. Ordinary unambiguous coverage assignments are retained.

All 93 source assets were downloaded privately with verified HTTPS, checked as
WebP by MIME and image decoding, and hashed. Total source bytes: 5,069,036; distinct
byte hashes: 92. Source GMT creation and modification values were captured for all
93. Five overview maps were inspected at full size and contain public roads,
landmarks, and area boundaries, with no customer-home pins. Descriptions identify
them as area overviews, without claiming each map outline is an exact service
boundary. The 88 neighborhood photographs were inspected in four contact sheets;
five disputed photographs were subsequently inspected at original resolution.
The full set was not inspected at original resolution. Concise descriptions state
what is visible and make no claim of completed roofing work.

Neighborhood photographs use `roofing_neighborhoods.image`. Actual coverage maps
use `coverage_map`; photos must never be placed in that field. All reviewed source
bytes remain intact. One exact duplicate byte stream shares a canonical Directus
file; its two observed aerial descriptions are compatible. Two photos remain
held with their geographic conflicts, and the duplicate-owner photo is excluded.
The result is 89 new immutable files for 90 eligible used references.

### Source timestamp preservation

Directus rewrote file timestamps during upload, and its date-updated special also
rewrote `modified_on` during an API patch. The first attempt stopped at that
readback failure. The reviewed helper `scripts/location-migration/file-timestamps.mjs`
then restored only source timestamps through conditional SQL. It requires the
original matching absent-before creation receipt, canonical byte-derived file ID,
unchanged planned metadata and both current timestamps. The private caller also
verified bytes and the freshly created file projection before invoking it.

The helper durably saves a before-image, requires exactly one conditional update,
reads back through Directus and saves after evidence. Recovery of already-correct
timestamps requires another API read and a durable match receipt. This recovered
the interrupted first file and preserved dates for the other new uploads.
Ordinary migration matches never trigger timestamp repair; existing editorial
files are not repair targets. Original bytes and recovery records remain intact.

## Review ownership

All 72 WordPress reviews remain held because a source five-star rating has not
been verified. Seventy-one source dates are ISO timestamps; the parser preserves
their source calendar dates. The one absent date stays null. Every original
source link, exact date representation, and retained owner reply remains in the
private source export. Two source links require correction from evidence.

The planner supports a private, verified review decision keyed by source
provenance, with `sourceVerified`, `rating`, and `evidence`. A confirmed existing
match also needs `targetId` and `matchVerified`. It never infers Google identity
from a WordPress post or the old star display, and never creates `external_id`.

Existing reviews preserve source facts, publication, and editor assignments.
Verified null URL, reply, or review-date fields may be filled. Differing populated
values produce a conflict. Existing review publication is never written. Initial
service-area assignment requires explicit `serviceAreaSlug`, `geographyVerified`,
and `geographyEvidence`; it can initialize a null relation but cannot replace an
editor's existing assignment. New verified imports start as drafts. Feed membership
is outside migration ownership and is prepared by the review-sync workflow owner.

## Commands and private artifacts

Use Node 22. Commands below prepare a fresh inventory and plan. Load the established
environment into the process; never paste or print credentials.

```sh
export LOCATION_MIGRATION_PRIVATE_ROOT=/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15

node scripts/migrate-wordpress-locations.mjs --mode inventory \
  --schema-state ready \
  --approvals "$LOCATION_MIGRATION_PRIVATE_ROOT/approvals-durable-v1.json" \
  --source "$LOCATION_MIGRATION_PRIVATE_ROOT/new-source.json" \
  --targets "$LOCATION_MIGRATION_PRIVATE_ROOT/new-targets.json"

node scripts/migrate-wordpress-locations.mjs --mode plan \
  --source "$LOCATION_MIGRATION_PRIVATE_ROOT/new-source.json" \
  --targets "$LOCATION_MIGRATION_PRIVATE_ROOT/new-targets.json" \
  --approvals "$LOCATION_MIGRATION_PRIVATE_ROOT/approvals-durable-v1.json" \
  --plan "$LOCATION_MIGRATION_PRIVATE_ROOT/new-plan.json"

node scripts/verify-location-migration.mjs
```

With the additive model installed, use `--schema-state ready` and pass
`--approvals` to inventory so it reads only this migration's deterministic file
IDs and verifies existing destination bytes. Missing fields or required reads
fail; upstream errors are never converted into empty content. WordPress uses
cursor pagination; Directus uses bounded pages with stable ID ordering and rejects
repeated identities. Source totals are reconciled, not hard-coded import limits.

Artifacts are mode-0600 regular files below the mode-0700 private root. Output
creation is exclusive and refuses to overwrite earlier evidence or follow
symlinks. Keep all source exports, decisions, mappings, receipts, and media outside
Git. Durable copies and all 93 media hashes were verified before execution.
`approvals-durable-v1.json` and `media-durable-v1.json` rebase only their 93 local
paths; `rebasing-receipt-v1.json` records unchanged original and mapping hashes.
Location, enrichment and review preparation share this root. The default remains
the historical temporary directory, so set the environment explicitly. Roots and
files require 0700/0600 modes; repository roots, Git descendants and root symlinks
are rejected. Preserved historical preparation artifacts include:

| Artifact | Purpose / canonical content hash |
| --- | --- |
| source-final-v2.json | Historical source inventory; refreshed source nodes were unchanged; `5a3f23fa10a7ccf39bc652e64654b78973f956f0761b5a8acff9d911d1d212d1` |
| targets-final-v2.json | Historical pre-schema targets; `0b25c14d382581bfae96a9fb3eb2ed59ef6e83fad35ff82caa63349f1a6a1e1b` |
| approvals-reviewed-v3.json | Updated media/name verification and approved neighbors; `f2d1d0b573ef7a59a3699e7390b15a417ba369e196f00b9bc1821ee95dd9d3da` |
| geography-supplement-v2.json | Primary-source and full-size evidence for five disputed occurrences; `1be5c639a6ea87f72a9ce7f4560fb7d938964d52eb979454921c423a528d7af6` |
| media-v1.json | Source attachment metadata, byte hashes, and local file mapping; `ceb8df61a0279d3d1b3d6f6221d8072fde9f84fd3cdab70f484f2a71d6b0edde` |
| media-v1/ | Original image bytes and numbered contact sheets |
| plan-candidate-v4.json | Historical unready plan; `4aa9693445fdb8e2d22ec00657ec40eba5961e9ebd6a5e04549eb5f1bf1ef424`; never applied or readiness-edited |
| prepared-recovery-v4.json | Proposed narrow before-images; explicitly prepared, not execution receipts |
| prepared-mapping-v4.json | Proposed source/target and immutable-file mappings; explicitly not applied |
| project-enrichment-plan-v1.json | Historical unready backfill plan; the fresh applied plan is documented in the enrichment guide |

## Apply and recovery contract

The apply executor requires an exact plan hash and a separate private authorization
file naming that hash and the hashed Directus target. Authorization must confirm
the exact production apply, schema/permissions readback, exclusive migration
writer, paused editorial changes, approved recovery storage, and (for review
writes) compatible feed-retention cutover. These flags record the coordinator's
release authorization; generating a plan supplies none of them.

Directus REST does not provide an atomic compare-and-swap guarantee. The executor
rechecks timestamps and narrow field hashes immediately before updates, and the
release must use the authorized brief editorial maintenance window to close the
remaining race. It saves and flushes a narrow before-image before each mutation,
then reads back fields and uploaded bytes. Deterministic media/neighborhood IDs,
canonical source identity reads, unique junction pairs, and exact-match rerun
handling prevent duplicate imports. Changing a source row's position does not
change its identity. A rename is held as an identity conflict instead of silently
overwriting an existing canonical record.

Every execution uses a new private recovery directory and writes numbered
`before`/`after` receipts, plus a result file. A failed or interrupted run retains
its receipts. For recovery:

1. Freeze the affected editorial fields and stop the old archiving workflow using
   the coordinator's approved cross-system release sequence.
2. Keep the prior deployed application artifact and reviewed workflow version.
3. For an update receipt, reread its target and compare the current fields and
   modification timestamp to the recorded after-image. A later edit is a conflict
   for explicit reconciliation, not a restore target.
4. Restore only the recorded before fields after approved comparison. Created
   neighborhoods/reviews are unpublished or unlinked deliberately; do not delete
   shared assets or taxonomy records still referenced by another deployment.
5. Keep uploaded immutable files and WordPress originals. Restore owner relations
   rather than overwriting image bytes. Recheck bytes after any asynchronous media
   processing and before publication.
6. Read back all affected records and verify the application/workflow compatibility
   matrix. Reverting only the former archiving workflow is unsafe.

No automated destructive rollback is included. The receipts make the exact narrow
restore reviewable. All 53 owner-supplied project/job mappings and ZIPs have been
verified through authenticated reads, with existing primary areas preserved and
neighborhoods left null. Their separate backfill applied all 53 updates, passed
independent live readback and a 53-match/no-write repeat, then installed the
SonShine-only required-field constraint. The location planner still labels these
53 entries held and emits its generic enrichment blocker because it does not
consume the separate pipeline's completion evidence. That label is superseded by
the verified [enrichment results](location-enrichment.md), not an unresolved
mapping requirement. No unattended AccuLynx operations are included.

## Verification

Seventeen Node 22 synthetic checks pass, covering source accounting, reruns,
publication preservation, source-review nulls and ownership, verified initial
geography, duplicate neighborhoods/sponsors/media, Parrish taxonomy-only behavior,
pagination, editorial conflicts, exact plan authorization, before-image ordering,
tenant rejection, dates, explicit review targets missing from refreshed inventory
or conflicting with canonical provenance, verified display-name correction with
stable source identity, and unprepared-schema rejection. Scoped ESLint passes.
Actual schema, migration and per-operation readbacks completed, followed by the
zero-operation/zero-conflict fresh plan and 219-match/no-write original-plan
repeat above. The guarded timestamp helper passes
41 synthetic checks, including local PostgreSQL execution, concurrency refusal,
quoted metadata, interrupted recovery and durable match evidence. Historical
independent reviews also replayed earlier candidate plans in memory; those tests
remain distinct from the applied evidence. See the candidate verification record
for current whole-application checks and review dispositions.

The pages and neighborhoods are draft content. Held review ratings/source links,
two neighborhood/photo conflicts, actual-page editorial/visual acceptance,
compatible review workflow cutover and deployment remain release gates.
