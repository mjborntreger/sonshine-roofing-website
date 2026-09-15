# Review feed and location review synchronization

Contract: [location-v3](location-contract.md). This is a **prepared local change**;
no workflow, membership seed, review import, or rollback has been applied to production.
The additive schema/privacy phase is applied; the existing active workflow and
32-review set remain unchanged. Follow the coordinator's [release sequence](location-release.md).

## Ownership and queries

`latest_feed_member` and `latest_feed_order` describe the current Google feed.
They do not publish or unpublish a review. Google owns verified resource identity,
source facts/timestamps, and those feed fields. Editors own `status` and
`service_area`. Migration owns separate `wordpress_provenance` and explicitly
verified imported facts. `external_id` remains a nullable globally unique Google
resource name; imports without a confirmed Google identity leave it empty.

New eligible Google reviews retain published creation behavior. Updates contain
only source facts and feed fields. They omit `status`, `service_area`, `url`,
`owner_reply`, `wordpress_provenance`, and legacy `sort_order`; even editorial
changes made after planning therefore survive an update. Departing reviews get
`latest_feed_member=false` and `latest_feed_order=null`, retaining publication.

| Consumer | Required eligibility | Order/publication boundary |
| --- | --- | --- |
| Sitewide Google feed | Same client, published, Google source, actual five stars, populated verified Google ID, feed member | Feed order, then source dates and stable ID; existing cache refresh remains in place |
| Local/nearby reviews | Same client, published, actual five stars, approved direct service-area match | Actual review dates, missing dates last, stable ID; deployment snapshot only |

Location reviews require neither feed membership nor Google identity. Unassigned
reviews are never geographic backfill. Project testimonials remain independent.
The retained cache request sends only `directus:reviews:sonshine-roofing`; it does
not publish location snapshots or create location routes.

## Local tools

All tools are preparation only: they have no network calls, embedded credentials,
or live mutation command. Use Node 22. Inputs/outputs remain below the approved
mode-0700 private directory, with mode-0600 files. Output writes use exclusive
creation to preserve previous recovery evidence and reject symlink replacement.

```sh
export LOCATION_MIGRATION_PRIVATE_ROOT='/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15'
fnm exec --using 22 node scripts/verify-location-review-sync.mjs

fnm exec --using 22 node scripts/location-reviews/build-patch.mjs \
  --recovery /Users/home/Documents/SonShine-Migration-Recovery/2026-09-15/review-workflow-current-active.json \
  --out /Users/home/Documents/SonShine-Migration-Recovery/2026-09-15/review-workflow-patch-candidate.json

fnm exec --using 22 node scripts/verify-location-review-sync.mjs \
  --private-recovery /Users/home/Documents/SonShine-Migration-Recovery/2026-09-15/review-workflow-current-active.json
```

The patch builder requires the exact refreshed source graph hash and identical
current/active graphs. It prepares atomic MCP update operations and a private
candidate graph; it does not apply or publish them. A changed graph is a hard
stop requiring fresh review. Immediately before an authorized apply, retrieve
current/active state again and compare to `sourceGraphSha256`; the input file's
earlier capture alone is not proof of current live state. Do not import the
private `candidate` object as an active workflow or commit it.

The runtime factory in `scripts/location-reviews/core.mjs` is embedded verbatim
into candidate Code nodes. Verification executes those generated nodes in an
isolated local JavaScript VM with synthetic inputs. It covers source selection,
planning, upsert readback, cleanup, and final set verification against both a
synthetic graph and the refreshed private production graph.

### Empty selection and failure behavior

Source normalization selects 0–20 eligible records, sorts by Google creation
date, and breaks ties by verified source identity. Identical source duplicates
collapse; conflicting duplicates fail. Missing/invalid attribution, identity,
timestamps or source shapes fail without invented values.

The old filter is removed because it stopped the graph when every source review
was ineligible. The source node now has `onError=stopWorkflow` and
`alwaysOutputData=true`; normalization explicitly recognizes its successful-empty
item. Mixed empty/malformed rows fail. Zero selections emit an upsert no-op so
cleanup and final readback run. Directus reads also have dedicated successful-empty
handling and stop on errors. A missing upsert or mismatched source field fails
before departure cleanup. All reads use the resolved active SonShine client;
cross-client rows fail validation instead of silently participating.

Final readback queries membership, not publication. It must equal the selected
identity set, cap at 20, and preserve contiguous feed order. An editor may unpublish
any selected review without failing source-membership verification. No total
published-count assertion remains.

### Membership seeding

```sh
fnm exec --using 22 node scripts/location-reviews/prepare-data.mjs \
  --mode seed \
  --input /Users/home/Documents/SonShine-Migration-Recovery/2026-09-15/review-seed-input.json \
  --out /Users/home/Documents/SonShine-Migration-Recovery/2026-09-15/review-seed-plan.json
```

The private input contains `clientId`, `reviews`, an ordered
`selectedExternalIds` array, `selectionVerified=true`, `verifiedAt`, and
`verificationSource` (`google-source-selection` or
`verified-current-feed-readback`). Obtain the exact selected identities from an
authorized verified source/readback. **Do not infer selection from publication
counts or fabricate identities.** A populated seed input and plan were prepared
privately from the verified 2026-09-15 scheduled source selection and matching
final readback; see [the actual seed evidence](location-review-sync-evidence.md#actual-membership-seed-preparation).
Neither input nor plan is checked into Git or applied to production.

Every selected identity must resolve to one confirmed same-client Google record.
The output contains only membership/order updates, including clearing previous
nonselected membership. It preserves every editorial field. An identical rerun
produces no updates. Capture narrow before-images and final modification timestamps
privately around any authorized seed apply; this tool does not perform that apply.
Immediately before applying the prepared plan, refresh the active workflow and
latest successful selection, then recheck each target's client, verified identity,
and `date_updated` against the private input. Reprepare if the selection or target
state changed. The current plan predates additive membership fields: its 32 narrow
updates initialize 20 selected memberships and 12 nonmembers without changing
publication. After default-false schema fields exist, a fresh plan may need only
the 20 selected updates.

### Guarded recovery planning

```sh
fnm exec --using 22 node scripts/location-reviews/prepare-data.mjs \
  --mode rollback \
  --input /Users/home/Documents/SonShine-Migration-Recovery/2026-09-15/review-rollback-input.json \
  --out /Users/home/Documents/SonShine-Migration-Recovery/2026-09-15/review-rollback-plan.json
```

Input contains `beforeImages` and `currentRows`. Each narrow image has a canonical
`id`, `client`, a `before` field map and verified `after` field map including
`date_updated`. Restores require the same client, exact final modification time,
and matching after-values for every restored field. Later edits or missing rows
produce conflicts for manual reconciliation. Duplicate/invalid images and
undesignated fields fail. This prepares updates only; it never deletes newly
created records or mutates production.

## Cutover compatibility

The coordinator authorizes and executes each external step. Retain the prior
application artifact, the exact workflow current/active recovery graphs, and
narrow record before-images. The approved durable private root above now contains
the verified prior application image and schema/data recovery receipts. Refresh
workflow state and membership evidence before the remaining release.

1. Apply verified additive schema and permissions. Keep historical review
   retention disabled while the old archiving workflow can still execute.
2. During the authorized maintenance window, pause the old schedule and verify
   no old execution remains running. Capture current selected identities and
   narrow record before-images. Seed membership and verify exact readback.
3. Apply the reviewed workflow operations while paused; verify the saved graph,
   queries, error behavior and unchanged credential references. Complete any
   required authorized synthetic node checks without live side effects.
4. Publish the reviewed page and eligible neighborhood records, then build/deploy
   the compatible application with membership-gated sitewide consumers before
   expanding the published historical collection. Until then, preserve the
   existing 20-review public set. Keep held geography and uncertain media excluded.
5. Apply reviewed imports/editorial decisions; deploy the final normalized
   location snapshot. Verify route/content/snapshot identities. Enable the
   revised workflow only after both application and schema/data are compatible.
6. Read back active graph/version after publication, then verify an authorized
   scheduled cycle and the actual capped membership set. Confirm that an older
   approved local review remains published outside the feed and that a
   deliberately unpublished selected review remains unpublished. Local fixture
   results do not replace this production verification.

Rollback starts by pausing the revised workflow and stopping migration activity.
Restore a compatible application artifact and guarded narrow records, checking
later editorial edits before every restore. Restore the old archiving workflow
only after the retained history is protected/restored and old consumers again
see a compatible publication set. **Restoring only the old workflow is unsafe.**
Keep additive schema and legacy compatibility fields through recovery verification.

## Verification and limits

See [the refreshed evidence](location-review-sync-evidence.md) for source and
candidate hashes, checks and private artifact locations. Tracked tests and reports
contain synthetic values only. No workflow execution payloads, customer data,
real job references, credentials, account IDs or real review records are included.

Local tests prove the prepared logic and operation construction. They do not
prove live membership field permissions, source connector behavior during an
actual empty result, a published candidate, an executed seed/import, production
rollover, deployment behavior, or independent integrated review. Those remain
coordinator release gates.
