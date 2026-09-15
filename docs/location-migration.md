# Location migration tooling and candidate

Status: prepared and dry-run verified; no production schema, records, files,
workflow, or deployment changes applied by this tooling.

Shared contract: v3 in [location-contract.md](location-contract.md). Migration
artifact version remains `location-migration-v1`. Starting application revision:
`0271ec70f46a2b31c4eb012da28459f6a9144184`. The coordinator records the frozen
integrated application revision separately.

## Prepared candidate

The current private candidate is
`/private/tmp/sonshine-location-migration-20260915/plan-candidate-v3.json`.
Its canonical plan hash is
`54a660973869ca8fd45367ba5582d7ba1cc027ff92376893f160f161fdd120bb`.
It contains 215 proposed mutations, with source occurrences accounted separately.
It has `schemaReady=false` and the apply executor rejects it. After approved
schema changes, a fresh target inventory and new reviewed plan are required.

| Source group | Total | Create | Update | Match | Held | Excluded |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Existing coverage taxonomy | 1 | 1 | 0 | 0 | 0 | 0 |
| Location pages | 5 | 0 | 5 | 0 | 0 | 0 |
| Neighborhood occurrences | 88 | 83 | 0 | 1 | 4 | 0 |
| Selected reviews | 72 | 0 | 0 | 0 | 72 | 0 |
| Source media | 93 | 87 | 0 | 1 | 4 | 1 |
| Relationships | 292 | 39 | 88 | 84 | 80 | 1 |
| Project enrichment | 53 | 0 | 0 | 0 | 53 | 0 |

No conflicts were overwritten. Relationship counts include 88 primary-area
occurrences, 93 media references, 72 review-area proposals, ten sponsor pairs,
17 approved direct-neighbor pairs, and twelve existing coverage-list entries.
The 88 media relation updates are folded into their page/neighborhood operations;
they are not another 88 API writes. No navigation records currently contain a
direct location URL needing migration.

Parrish is present in the existing coverage list but absent from the thirteen
canonical service areas. Its prepared record is published taxonomy with
`page_status=taxonomy_only`, no page content, and no fabricated WordPress ID. The
database must generate `sonshine-roofing:parrish` as its scope key. Its coverage
junction follows that record; it creates no additional public route.

The five existing area records receive concise local draft introductions. Existing
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

Four neighborhood occurrences and their photos remain held: Plantation in Venice
and North Port, University Park / West of Trail, and Arroyo / Crestline / Village
Park. The latter source photo visibly names Arroyo Vista. Resolving those actual
conflicts requires additional evidence; ordinary unambiguous WordPress coverage
assignments are retained without another owner-approval gate.

All 93 source assets were downloaded privately with verified HTTPS, checked as
WebP by MIME and image decoding, and hashed. Total source bytes: 5,069,036; distinct
byte hashes: 92. Source GMT creation and modification values were captured for all
93. Five overview maps were inspected at full size and contain public roads,
landmarks, and area boundaries, with no customer-home pins. Descriptions identify
them as area overviews, without claiming each map outline is an exact service
boundary. The 88 neighborhood photographs were inspected in four contact sheets;
they were not all inspected at original resolution. Concise descriptions state
what is visible and make no claim of completed roofing work.

Neighborhood photographs use `roofing_neighborhoods.image`. Actual coverage maps
use `coverage_map`; photos must never be placed in that field. All reviewed source
bytes remain intact. One exact duplicate byte stream shares a canonical Directus
file; its two observed aerial descriptions are compatible. Four photos remain
held with their geographic conflicts, and the duplicate-owner photo is excluded.
The result is 87 proposed new immutable files for 88 eligible used references.

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

Use Node 22. Commands below are local preparation examples. Load the established
environment into the process; never paste or print credentials.

```sh
node scripts/migrate-wordpress-locations.mjs --mode inventory \
  --schema-state pending \
  --source /private/tmp/sonshine-location-migration-20260915/new-source.json \
  --targets /private/tmp/sonshine-location-migration-20260915/new-targets.json

node scripts/location-migration/media.mjs \
  --source /private/tmp/sonshine-location-migration-20260915/new-source.json \
  --directory /private/tmp/sonshine-location-migration-20260915/new-media \
  --manifest /private/tmp/sonshine-location-migration-20260915/new-media.json

node scripts/migrate-wordpress-locations.mjs --mode plan \
  --source /private/tmp/sonshine-location-migration-20260915/new-source.json \
  --targets /private/tmp/sonshine-location-migration-20260915/new-targets.json \
  --approvals /private/tmp/sonshine-location-migration-20260915/reviewed-decisions.json \
  --plan /private/tmp/sonshine-location-migration-20260915/new-plan.json

node scripts/verify-location-migration.mjs
```

After the additive model is actually applied, use `--schema-state ready` and pass
`--approvals` to inventory so it reads only this migration's deterministic file
IDs and verifies existing destination bytes. Missing fields or required reads
fail; upstream errors are never converted into empty content. WordPress uses
cursor pagination; Directus uses bounded pages with stable ID ordering and rejects
repeated identities. Source totals are reconciled, not hard-coded import limits.

Artifacts are mode-0600 regular files below the mode-0700 private root. Output
creation is exclusive and refuses to overwrite earlier evidence or follow
symlinks. Keep all source exports, decisions, mappings, receipts, and media outside
Git. This temporary directory still needs an approved durable recovery copy before
production work. Current artifacts include:

| Artifact | Purpose / canonical content hash |
| --- | --- |
| source-final-v2.json | Completed live source inventory; `5a3f23fa10a7ccf39bc652e64654b78973f956f0761b5a8acff9d911d1d212d1` |
| targets-final-v2.json | Current pre-schema targets; `0b25c14d382581bfae96a9fb3eb2ed59ef6e83fad35ff82caa63349f1a6a1e1b` |
| approvals-reviewed-v2.json | Media descriptions, verified geographic corrections, and approved neighbors; `da926447c21e4266b05d7782adba1710a1f0258f45f64d242d91beb1c4a9342f` |
| media-v1.json | Source attachment metadata, byte hashes, and local file mapping; `ceb8df61a0279d3d1b3d6f6221d8072fde9f84fd3cdab70f484f2a71d6b0edde` |
| media-v1/ | Original image bytes and numbered contact sheets |
| plan-candidate-v3.json | Current dry-run candidate and every source disposition; hash above |
| prepared-recovery-v3.json | Proposed narrow before-images; explicitly prepared, not execution receipts |
| prepared-mapping-v3.json | Proposed source/target and immutable-file mappings; explicitly not applied |

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
restore reviewable. Source enrichment is separately pending the owner's manual
project-to-job mapping: authenticated AccuLynx read access is available, but all 53
project assignments and the subsequent SonShine-only required-field constraint
remain incomplete. This tooling performs no unattended AccuLynx operations.

## Verification

Sixteen Node 22 synthetic checks pass, covering source accounting, reruns,
publication preservation, source-review nulls and ownership, verified initial
geography, duplicate neighborhoods/sponsors/media, Parrish taxonomy-only behavior,
pagination, editorial conflicts, exact plan authorization, before-image ordering,
tenant rejection, dates, explicit review targets missing from refreshed inventory
or conflicting with canonical provenance, and unprepared-schema rejection. Scoped ESLint passes.
The live inventory and private dry-run executed successfully. Production apply and
readback have not executed. Independent A1 review replayed the actual 215-operation
plan in memory with 215 second-run no-ops and zero replan operations/conflicts;
the review-target correction preserves its canonical hash. See the candidate
verification record for findings and confirmation status.
