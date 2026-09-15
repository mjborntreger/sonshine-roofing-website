# Location migration release and recovery

Status: authorized Directus preparation and migration applied and verified.
Workflow publication and website deployment remain held for final approval.
Contract: [location-v3](location-contract.md). The final candidate record and
independent review dispositions are in [verification](location-verification.md).

## Historical pre-migration baseline on 2026-09-15

- Local main and `origin/main`: `0271ec70f46a2b31c4eb012da28459f6a9144184`.
- Coolify reports the application healthy and its latest finished deployment at
  that same revision (finished 2026-09-15 15:21:58 UTC). This task did not trigger it.
- WordPress: 5 pages, 88 neighborhood occurrences, 72 reviews, 93 distinct assets.
- SonShine Directus: 13 service areas, 53 projects, 79 videos, 32 shared reviews
  (20 published, 12 archived), 10 sponsors, 45 FAQs. Broader shared-client totals
  are not SonShine import counts.
- Additive location schema is absent. Website project access includes wildcard
  fields; anonymous project access is denied. Admin policy topology is unverified.
- Active review graph still forces publication/archival and exactly 20 published
  records. Current and active graphs matched during the refresh. Prepared workflow
  operations are local and are not saved or published in n8n.

## Applied phase and remaining release gates

The owner approved Directus preparation/migration, durable private recovery and
SonShine-only required fields after verified backfill, and paused affected CMS
editing during execution. These actions are complete at execution revision
`43fbd45f24bb4c9bd4d68f3ed19fe457d3f31a0e`:

- Resolved actual policy ownership; tightened the existing project grant before
  adding private fields. Applied 49 additive schema actions, transactional
  invariants and 11 reader-permission extensions. Schema rerun proposes zero actions.
- Applied the 219-operation plan: five draft page owners, 85 draft neighborhoods,
  89 new files, one taxonomy-only area and 39 junctions. All records have readback
  evidence; all file bytes and source timestamps were independently verified.
  Same-plan repeat matched 219 with no writes; a fresh plan has no operations/conflicts.
- Applied and verified all 53 owner-mapped project job/ZIP enrichments, preserving
  primary areas and null neighborhoods. Then applied the SonShine-only required
  constraint. Actual website/anonymous direct, nested and aliased privacy checks pass.
- Retained narrow before/after receipts and the prior application image in
  `/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15` (0700/0600).
  The prior image archive was verified readable; recovery has not been executed.

The current application remains `0271ec7`; the original active workflow and all
32 shared review records are unchanged. Feed membership is unseeded. **Do not deploy
membership-gated consumers before the seed step below.** No remote Git push, merge,
workflow save/publication or website deployment was performed by this phase.

Remaining gates are the five pages' shared SEO/editorial publication preparation,
verified source ratings and two corrected source links for 72 held reviews, the two
held geographic entries, and final workflow/deployment authorization. Held records
stay excluded unless verified; no additional project/job mapping is needed. A
credentialed candidate build passes with all five pages still drafts; that confirms
foundation compatibility, not published five-page acceptance. Actual private draft
previews and their limits are recorded in [verification](location-verification.md).

## Completed preparation stages

Steps 1–5 below are complete for the approved phase. The original application image
is `sha256:37463c5bfb2ea184893788de6b0c3e0e03060c12bf2558a41283eed86f745b07`;
its private archive is `prior-application-0271ec7.docker.tar.gz`. Refresh candidate,
source, target modification state and workflow versions before the remaining release.
The owner may resume editing after phase completion; any later edits must become
reviewed conflicts instead of being overwritten.

## Concrete maintenance-window sequence

No historical review expansion is safe while the old archiving workflow can run,
or while old sitewide consumers can read the expanded published collection.

1. Freeze the reviewed candidate revision and artifact hashes. Retain the previous
   deployed application/image and generated content artifacts through Coolify's
   owning control plane. Confirm they can actually be redeployed without rebuilding
   from a now-incompatible schema. Capture narrow schema/policy/content recovery
   state privately; never copy environment values or whole customer payloads.
2. Resolve effective policy ownership. Prepare and apply the permission **tighten**
   plan first, preserving row filters while removing project wildcard access. Verify
   the actual website/public effective grants before adding `job_id`. A restrictive
   additional policy does not override an existing wildcard.
3. Apply the reviewed additive schema and transactional invariants. Extend the
   reviewed exclusive SonShine reader policies, editor ownership and workflow access.
   Run schema `--verify-only`, read-only SQL verification, actual direct/nested/alias
   private-field probes and unchanged project/video baseline reads. Retain scaffold,
   WordPress originals, compatibility fields and all deployed files.
4. Run the fresh paginated migration dry run against current source/target state.
   Resolve held/conflicting records or document them as release blockers. Apply only
   approved page drafts, verified neighborhoods/media and canonical relations,
   checking before-state immediately before updates and verifying every write.
   Keep historical reviews drafted/held; keep the original published feed set.
5. Complete verified project enrichment through the approved authenticated path;
   retain private addresses only as lookup inputs. Verify every project/job/ZIP/area
   match and apply the separate SonShine-only required-field constraint only after
   the backfill succeeds. Verify uniqueness and actual public denial again.
6. During the approved maintenance window, pause the old workflow and confirm no
   old execution remains running. Re-read the exact current selected Google
   membership from authoritative source/readback, prepare/review its seed plan,
   apply only membership/order changes and verify the exact set. A count of 20
   published records alone does not establish the selected set.
7. Apply the reviewed workflow patch while paused; read back the saved graph and
   verify the expected source/candidate hashes, unchanged credential references,
   queries, successful-empty handling, preservation and capped membership tests.
   Prepare the five reviewed pages for publication, with noindex false after review.
   Review and publish the eligible imported neighborhood records before building;
   their independent draft status otherwise excludes all 85 from neighborhood
   sections. Keep the two held source occurrences excluded. Resolve or omit
   uncertain optional image associations before publishing their owner records.
8. Build and deploy the compatible application **before expanding historical review
   publication**. This application requires all location foundations and five ready
   page owners. Check build failures, route/FAQ/navigation/sitemap publication,
   project/video independence, public outputs and `data-location-snapshot` digest.
   Old cached or ISR feed consumers cannot remain the active application.
9. Apply verified historical review imports and approved editorial/geography
   decisions with narrow before-images. Rebuild and deploy the final snapshot.
   Verify all source dispositions, rerun no-duplication behavior and later-editor
   preservation. Enable the revised workflow only after app/schema/data compatibility.
10. Read back the active workflow graph and deployed artifact. Verify an authorized
    real cycle, exact membership/order, retained older approved local review and
    deliberately unpublished selected review. Confirm content changes appear only
    after a subsequent deployment. Update shared-context ownership records only
    after actual release verification, using its lint/commit/sync contribution process.

See [model permissions](location-model-permissions.md),
[review cutover tooling](location-review-sync.md), and
[migration guide](location-migration.md) for executable preparation commands.

## Rollback

1. Pause the revised workflow and stop migration activity before changing records.
2. Restore the retained compatible application artifact. If reverting to the old
   consumer, first restore/protect its expected publication set so the expanded
   historical collection cannot appear in the old feed during ISR/cache refresh.
   Alternatively keep the compatible membership-gated app while reconciling data.
3. For each affected record/policy, compare current modification state and saved
   after-values with the narrow before-image. Restore only unchanged migration-owned
   fields. Later editorial edits become manual conflicts; never overwrite them.
   Avoid deleting newly imported records/files that now have other references.
   A rollback to the original null project job/ZIP values must first remove only
   the SonShine required-field constraint under explicit rollback authorization;
   its active CHECK correctly rejects those old null values. Preserve the unique
   job identity and privacy protections.
4. Retain additive schema and explicit project privacy permissions. Never restore
   wildcard project grants while the private job field exists. Restoring the old
   workflow alone is unsafe: it can archive retained historical reviews and
   republish editorially unpublished reviews. Restore it only after the historical
   set is protected and application/data compatibility is verified.
5. Verify the restored application revision/content snapshot, feed set, published
   page set, media references, project/video behavior and public denial. Record
   recovery conflicts and which system versions remain active. Keep original
   WordPress media hosting; host retirement is outside this release.

Production narrow before-images, exact after-readbacks, schema/policy snapshots,
workflow recovery graphs and the retained prior application image are now in the
approved durable root. `location-apply-02`, `location-repeat-01`,
`project-enrichment-apply-01` and `project-enrichment-repeat-01` contain the executed
and no-op receipts. See [handoff](location-handoff.md) for artifact hashes and
[enrichment recovery](location-enrichment.md) for the scoped-constraint dependency.
A recovery run still requires fresh later-edit comparisons and explicit authorization.
