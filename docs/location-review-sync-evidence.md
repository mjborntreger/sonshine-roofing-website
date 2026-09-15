# Location review synchronization evidence

## Evidence baseline

- Application starting revision: `0271ec70f46a2b31c4eb012da28459f6a9144184`.
- Evidence baseline contract: `handoff-v0`; implementation now follows consolidated [location-v3](location-contract.md).
- Read-only live verification: 2026-09-15 using configured production n8n MCP.
- Workflow: **SRI Latest Reviews Catcher -> Directus**, active; current and active version identifiers, nodes, and connections agree.
- Current workflow saved at `2026-08-22T01:06:29.315Z`; retained history version created at `2026-08-22T01:06:29.319Z`.
- Graph SHA-256 (canonical recursively sorted `nodes`, `connections`, `settings`): `dfe166e47bc8224252cb8a4c51354465ae9c99fdcd3a0e337689e5c367ae9569`.
- Latest successful scheduled execution metadata: `2026-09-15T06:15:50.028Z` to `2026-09-15T06:15:51.374Z`. Five most recent records inspected were successful scheduled runs. Failure metadata query from 2026-08-22 returned zero retained error/crashed records; retention limits mean this is not a complete historical failure claim. Initial evidence refresh fetched no execution payloads; later bounded source/readback inspection for the concrete seed is documented below.
- Narrow private workflow recovery: `/private/tmp/sonshine-location-migration-20260915/review-workflow-current-active.json` (directory mode 0700, file mode 0600). Recovery SHA-256: `b8b42f245dc62efee8fee521c13a231c6c5c697239d48491edd79a01c1c3457a`. The file includes configuration references and must stay outside Git and reviewer attachments. This temporary location must be retained or moved to approved private durable recovery storage before release.

No live workflow edits, tests, executions, publication, unpublication, or Directus mutations were performed for this evidence refresh.

## Confirmed live behavior

The handoff describes the active behavior accurately. The daily 2:15 AM America/New_York workflow fetches at most 40 Google reviews, selects written five-star reviews by source creation timestamp, and truncates to 20. Both normalization and client resolution reject fewer than 20. The upsert payload sets `status=published` on creation **and update**, so a selected deliberately unpublished review is republished. Departing managed records receive `status=archived`. Final readback filters publication and demands exactly 20 published managed records.

Google resource `name` supplies `external_id`; source creation/update timestamps are required. The existing name abbreviation and approved brand-spelling normalization are source transformation behavior. The workflow does not write `url` or owner replies. Preserve those fields on all later sync runs. Current `Get Existing Managed Reviews` retrieves the collection without a tenant query before local filtering; replace this with an explicit client-scoped query.

Current application sitewide consumers use `lib/content/directus-reviews.ts`: published, same client, Google source, actual rating five, populated `external_id`; sort by legacy `sort_order` and source dates. They have no feed-membership condition. Expanded historical publication must wait until compatible consumers are deployed. The workflow also calls the existing reviews revalidation endpoint; its candidate behavior must remain compatible with the coordinator's deployment-frozen review/location snapshot.

## Implemented field and ownership contract

| Field or responsibility | Owner | Proposed behavior |
| --- | --- | --- |
| `latest_feed_member` | Google sync | Boolean, default false. True exactly for the selected verified Google identities, capped at 20. |
| `latest_feed_order` | Google sync | Nullable integer. Contiguous 1-based order for selected members; null for nonmembers. |
| `status`, `service_area` | Editors | Existing updates and departure cleanup never send either field. New eligible Google records retain `status=published` creation behavior. |
| `external_id` | Google sync / verified identity matching | Verified Google resource identity only; never a WordPress-derived substitute. Identity conflicts stop before writes. |
| `author_name`, `rating`, `review_text`, `review_date`, `source`, `source_created_at`, `source_updated_at` | Google sync for verified Google matches | Refresh source facts. Missing source dates fail source normalization instead of inventing dates. |
| `url`, retained owner replies | Existing verified authoring or migration | Omitted from every sync write; explicitly checked for preservation in fixtures. |
| Separate WordPress provenance | Migration | Sync leaves it untouched. Imported review facts need explicit migration ownership and conflict rules. |
| Existing `sort_order` | Compatibility retained | Do not overwrite during the new sync. New consumers use feed order for the sitewide feed; location selection uses actual review dates. |

Sitewide query: client match, editorial publication, actual five-star rating, Google source and verified identity, `latest_feed_member=true`; stable ordering by `latest_feed_order`, source date, canonical ID. Location query: same client, editorial publication, actual five-star rating, approved direct service-area match. Location eligibility requires neither feed membership nor `external_id`. Unassigned records are not local or nearby matches.

## Workflow changes prepared together

1. Normalize the actual eligible selection to 0–20 records. Validate upstream shape, rating, identity, name, text and source timestamps. Distinguish a successful empty source response from a failed or malformed response.
2. Resolve one active intended client, accept the capped actual target count, and fetch managed reviews with a server-side tenant filter and required readback fields.
3. Plan create/update/no-op using only sync-owned values. Add publication on create only. Use separate feed fields. Preserve editor status/service-area, source URLs, replies, provenance and compatibility fields by omission on update.
4. Read back upserts without publication filtering. Validate exact source-owned values and target membership before removing stale membership.
5. Replace archive actions with membership clear (`latest_feed_member=false`, `latest_feed_order=null`). No status mutation on departure.
6. Final readback filters tenant and feed membership, not status. Verify exact identity-set equality to the selected target, count at most 20, no duplicates, correct order and source facts. Do not assert any collection-wide publication count.
7. Handle zero targets explicitly so the graph still performs membership cleanup/readback when normalization emits no per-review actions.
8. Update node names, switch rules, all expressions, sticky notes, summary fields, revalidation semantics, and rollback instructions together. Keep credential objects and existing shared error workflow references intact.

## Compatible cutover and rollback proposal

The coordinator owns the final release and must authorize external effects. A brief maintenance window is the simplest coherent sequence given the existing active archiving workflow.

1. Prepare additive schema and permission changes, membership seeding plan, compatible application artifact, exact workflow patch and synthetic checks. Capture private narrow record before-images with target modification timestamps and retain the prior application artifact.
2. At authorized cutover, pause the old scheduled workflow and verify no old execution remains running before seeding or retaining history. Keep it paused throughout intermediate steps.
3. Apply additive schema, seed membership to the verified selected set without changing editorial publication, and verify permissions/readback. Deploy compatible consumers before expanding published historical records.
4. Apply and verify the revised workflow while paused. Apply the reviewed import and editorial publication decisions only after both the new consumers and nonarchiving workflow are ready. Deploy the final normalized location snapshot, then enable the revised schedule and read back the active graph.
5. Verify a successful authorized sync, membership set, retained historical review, deliberate-unpublication behavior, application artifact identity and deployed snapshot identity.

Rollback: pause the revised workflow first and stop concurrent migration. Restore the prior application artifact as appropriate; restore affected membership/editorial records only from narrow before-images after checking that later editorial modifications have not occurred. Restore the old archiving workflow only after historical records are protected/restored and old feed consumers again see their compatible record set. A workflow-only rollback is unsafe. Keep additive schema and compatibility fields until recovery is verified.

## Planned synthetic acceptance evidence

Test actual workflow code or shared patch-generated code with synthetic records for: 0/1/19/20/over-20 eligible targets; latest-feed rollover retaining an older published local review; selected draft/archived reviews remaining unpublished; new unassigned eligible review created published and excluded from locations; source URL/reply/provenance preservation; rerun no-op; stable source-date ties; duplicate verified identity stop; cross-client isolation; missing/invalid source-date failure; partial upsert failure stopping cleanup; stale member cleanup; exact final membership/order mismatch failure; preserved editor changes between plan and write; and no archive-status mutation remaining anywhere in the candidate workflow.

## Unresolved dependencies

- Coordinator owns application consumer updates, schema integration, and deployment snapshot integration.
- The prepared graph uses dedicated successful-empty handling and stop-on-error source/readback nodes. A real zero-review connector response remains a live verification limit; synthetic empty behavior is covered.
- Applying schema, seeding/importing data, editing/publishing production workflow and deployment remain gated by coordinator authorization. A prepared patch is not a published workflow.
- Recovery artifacts currently live in private temporary storage and need release-time retention.

## Prepared candidate and checks

- Contract: `location-v3`; local workflow artifact format `sonshine-review-workflow-patch-v1`.
- Current candidate: `/private/tmp/sonshine-location-migration-20260915/review-workflow-patch-v4.json`, mode 0600. The earlier `review-workflow-patch-v1.json` and `review-workflow-patch-v2.json` are superseded and must not be used for release. The v3 file aligns the contract label with `location-v3`; workflow behavior and graph hash are unchanged.
- Candidate graph SHA-256: `ce3321a4fa5e6c9061b754b5a21b166f70663910fe2ac780224c3087a9025cf8`.
- The builder generated 35 atomic MCP operations from the guarded refreshed source graph. It changes all related normalization, context, tenant queries, upsert, departure, readback and assertion behavior together, and updates canvas notes. Source, schedule, credentials and existing sitewide cache-refresh target are retained. Location deployment remains explicit.
- **31 focused synthetic checks passed on Node 22.23.2**, including execution of the exact candidate Code-node source against the refreshed private graph. The tests cover rollover, selected draft/archived preservation, source facts, zero/thin/full/over-limit selection, deduplication, ties, source errors, tenant mismatch, partial readback, set/order checks, protected-field preservation, idempotent seed planning, guarded rollback, and reconstructing the exact candidate graph from its atomic operation list.
- Native n8n `validate_node_config` accepted all 14 changed parameter configurations. This was validation only; no workflow node was executed.
- Focused ESLint passed. No package files or application consumers were edited by this assignment.
- `scripts/location-reviews/prepare-data.mjs` prepares exact-selection seed plans and later-edit-aware narrow rollback plans. A populated private seed plan was subsequently prepared as recorded below. No executed seed, import, or mutation before-image is claimed because no record mutation was authorized/performed.
- Full workflow publication, live readback of additive permissions/membership, real source-empty behavior, production rollover/unpublication, deployment, and independent integrated review remain outstanding release gates.

See [the workflow preparation and recovery guide](location-review-sync.md) for commands and the compatible cutover/rollback sequence. Reports intentionally omit private identifiers and source/customer payloads.

## Actual membership seed preparation

Read-only preparation verified at `2026-09-15T17:01:46.767Z`:

- The latest successful intended scheduled workflow run remained the 2026-09-15 06:15 UTC run above. Requested execution data was restricted to `Normalize Latest 20`, `Final Published Readback`, and `Verify Final Latest 20`, with a bounded item limit. In-memory validation confirmed the exact same **20 verified Google identities in the same contiguous order** in source selection and final readback, plus successful final verification. Publication counts were not used to infer membership.
- Only the required identity/order projection and sanitized proof metadata were retained. No raw execution, author name, review text, customer payload, credentials, or account configuration was written to a file or report.
- Refreshed workflow current and active nodes/connections/settings still matched the reviewed baseline graph. A fresh minimal Directus read fetched only `id`, `client`, `external_id`, `source`, `status`, `sort_order`, and `date_updated` for all **32** same-client review records. Every selected identity matched one current Google record; duplicate identities/records and cross-client matches were checked.
- Private input: `/private/tmp/sonshine-location-migration-20260915/review-seed-input-actual-v1.json`, mode 0600; SHA-256 `3d24d7768defe4e673312ca7689248e8dd05d127ce1a1e4aa9bf69cb6bf6a07e`.
- Private prepared plan: `/private/tmp/sonshine-location-migration-20260915/review-seed-plan-actual-v1.json`, mode 0600; SHA-256 `c6f2a74ee8998060c6d0396e3f42586d97ade177734968cb8f0382581895bda8`.
- Exact selected identity/order projection SHA-256: `f4bd05774be44efb15448dccaeda552094d412b6bae942ebab473d4457e9250e`.
- The plan contains **32 membership/order-only updates: 20 selected and 12 nonselected**. Membership fields do not yet exist in the source read; after additive default-false schema application, a freshly prepared equivalent plan may omit the 12 already-defaulted nonmembers.
- Local in-memory plan verification reproduced the exact selected identity/order set, preserved all 32 existing editorial status values, and produced **zero updates on a second run**. This is a dry-run/idempotency check, not Directus write/readback evidence.
- **No seed was applied.** Before authorized apply, reverify the latest successful selection and each target's client/identity/modification state against the private input. A new scheduled selection or target edit requires reconciliation/repreparation. Additive schema and permission verification, maintenance-window pause, compatible consumer deployment and narrow before-image capture remain cutover prerequisites.

Contract-v3 metadata alignment produced private `review-workflow-patch-v4.json`; v1, v2 and v3 patch files are superseded. Review behavior and the candidate graph hash remain unchanged.
