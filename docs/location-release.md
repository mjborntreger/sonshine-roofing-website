# Location migration release and recovery

Status: local implementation candidate; production migration and release blocked.
Contract: [location-v3](location-contract.md). The final candidate record and
independent review dispositions are in [verification](location-verification.md).

## Live baseline refreshed on 2026-09-15

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

## Authorization and inputs still needed

The implementation task prepares code, local schema/workflow/migration artifacts,
read-only evidence and synthetic verification. Exact production schema/policy/data
apply, n8n publication/unpublication, deploy/merge and push are not performed.
Before an external action, approve its concrete reviewed artifact and effect.

Release also needs these inputs and successful checks:

- Administrative resolution of all effective public/website policy grants and a
  safe SonShine-specific policy for tenant-scoped extensions.
- All 53 owner-supplied project/job mappings and ZIP candidates are verified through
  authenticated AccuLynx reads. Existing primary areas are corroborated and preserved;
  all neighborhoods remain unverified/null. Enrichment apply/readback and the
  subsequent SonShine-only job/ZIP requirement are unapplied. This blocks full acceptance.
- Verified source ratings for held reviews, two corrected source links, unresolved
  neighborhood geography, and reviewed media. The owner approved all five direct
  nearby-area lists recorded in the v3 contract on 2026-09-15.
- A durable approved private recovery directory. Current source/recovery evidence
  is temporary, outside Git at `/private/tmp/sonshine-location-migration-20260915`.
  Preserve modes (directory 0700/files 0600), hashes and narrow before-images.
- A full credentialed candidate build, five actual migrated-page visual/editorial
  reviews, actual permission probes and constraint readback after schema/data apply.

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
4. Retain additive schema and explicit project privacy permissions. Never restore
   wildcard project grants while the private job field exists. Restoring the old
   workflow alone is unsafe: it can archive retained historical reviews and
   republish editorially unpublished reviews. Restore it only after the historical
   set is protected and application/data compatibility is verified.
5. Verify the restored application revision/content snapshot, feed set, published
   page set, media references, project/video behavior and public denial. Record
   recovery conflicts and which system versions remain active. Keep original
   WordPress media hosting; host retirement is outside this release.

No production before-images or prior image export are claimed captured by local
preparation. Temporary workflow recovery graphs and source exports exist; the
actual release must capture current narrow before/after state and retained deployable
artifacts in durable storage before relying on rollback.
