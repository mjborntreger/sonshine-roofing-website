# SonShine WordPress Blog to Directus — n8n Migration Plan

Status: executed and reconciled on 2026-07-19. This document retains the approved design and records the completed implementation below.

Prepared: 2026-07-19

Completion record:

- Queue: 106 `verified`, two `excluded`, no pending/running/retry/failed row, no duplicate Directus ID, and an idle/cleared control lease.
- Published workflows: `SRI WordPress Blog Migration — Orchestrator` (`bqIVeYxuLw6dyCJN`) and `SRI WordPress Blog Migration — Post Worker` (`e2AA9vGpPmZIXU1K`), both Manual Trigger/caller-only with no execution-data retention.
- Directus: 106 published posts, 220 exact topic junctions, 21 approved topics, 11 Michael relations, 95 null-author organization fallbacks, maximum three topics, both exclusions absent, and exact body plus title/excerpt/date/SEO scalar reconciliation against the live singular-post source snapshot. The migration itself and all staged n8n apply executions remained draft-first; publication was a later explicitly authorized Directus-only action.
- The temporary Directus service user is suspended and its token is cleared, making the retained encrypted n8n credential inert.
- A post-migration identity correction keeps the two Michael records separate: all 11 blog relations, the least-privilege author read, both current/active workflow graphs, and all 106 canonical queue hashes now agree on the SonShine-scoped Michael. The corrected workflow versions were statically validated and published but were not runtime-executed.
- The final queue does not retain `dry_run_verified_at`: apply success overwrote those values with null. The complete dry run is evidenced by the documented staged executions; future worker changes should preserve the existing timestamp rather than fabricating a backfill.
- Two independent read-only reviews completed sequentially. Reviewer-one findings were resolved and re-verified; the fresh second review reported no unresolved issue.
- The 106 verified Directus posts were published on 2026-07-19 under Michael's
  later explicit authorization. The local frontend cutover now makes Directus
  the only blog source, with no environment switch or WordPress blog fallback.
  Production deployment, WordPress retirement, and legacy-field cleanup were
  not performed.

## Approved scope

- The XML blog sitemap is the authoritative source list.
- The approved manifest contains 108 unique sitemap posts: 106 migration candidates and two exclusions.
- Exclude `grouper-tacos` and `lead-safe-certified`.
- Migrate the other 106 posts as-is. Content consolidation, rewriting, and freshness work are deferred.
- Use each post's `proposed_topic_slugs` from `blog-topic-migration-manifest.json`.
- Enforce the approved default maximum of three topics. The manifest currently has no candidate above that maximum.
- Preserve the WordPress slug, original publication date, last-modified date, rendered body, excerpt intent, author display, featured image, inline images, SEO metadata, and approved topic relations.
- Build work starts as unpublished drafts. Michael has explicitly authorized the primary agent to run, test, polish, and publish the two migration workflows under the staged progression in this plan. Publication must use the exact reviewed/tested versions and does not authorize any unrelated n8n change.
- The assigned n8n builder subagent may create and update the unpublished workflow drafts and their migration queue scaffolding when the primary agent delegates that stage. It may not execute nodes or workflows, test against live systems, publish, unpublish, or broaden scope. The primary agent owns all review, testing, polishing, execution, and publication decisions.

## Read-only findings that shape the design

- The live Directus `blog_posts` collection currently has `title`, `slug`, `body`, `excerpt`, `client`, `featured_image`, scalar `topic`, `author`, `status`, `meta_title`, `meta_description`, `primary_focus_keyword`, and `focus_keywords`. It does **not** yet have the approved M2M topics relation, `published_at`, `featured`, a stable source key, a source-modified timestamp, or dedicated canonical/Open Graph fields.
- The scalar `topic` field is a four-choice Borntreger Digital dropdown. It must remain during a frontend dual-read/backfill period; this migration must not overwrite it with SonShine terms.
- Directus keeps separate Borntreger Digital and SonShine Roofing Michael
  Borntreger person records. WordPress exposes two authors for the published
  set: Michael Borntreger and the SonShine Roofing organization. Across all 108
  source posts, 11 are attributed to Michael and 97 to SonShine; both exclusions
  belong to the SonShine organization, leaving 11/95 in the 106-post candidate
  set. The exact approved blog mapping is the SonShine-scoped person UUID
  `f028dafd-c2fb-4d59-a561-2be5e46ea318`; do not fuzzy-match or collapse the two
  Michael records.
- The public WordPress GraphQL source exposes the fields already used by the SonShine frontend: rendered content/excerpt, publication and modified dates, author, featured image, categories, and Rank Math title/description/canonical/Open Graph values.
- The existing `SRI WordPress Media Migration Manifest` n8n Data Table is the durable source-to-Directus media map. Per `n8n.md`, it is complete: 190 verified imports plus one verified existing asset, with source URL, WordPress media IDs, post slugs, roles, and Directus file IDs. The old migration workflow is no longer MCP-visible, but the state table remains available.
- The media manifest covered 107 posts and excluded only `grouper-tacos`; media belonging only to the newly excluded `lead-safe-certified` post can remain unused. The post migration should never delete it.
- The current Directus-aware HTML sanitizer accepts semantic article markup and Directus `/assets/{uuid}` image paths, but removes WordPress-only responsive-image attributes. A pre-apply renderer test must identify any source markup that would be lost materially.

## Recommendation

Build two unpublished workflows:

1. **SRI WordPress Blog Migration — Orchestrator**
   - Manual trigger only.
   - Owns preflight, the queue, leases, batching, retry scheduling, terminal failure reporting, and final reconciliation.
   - Uses the shared `Error Handler` as required by `n8n.md`.

2. **SRI WordPress Blog Migration — Post Worker**
   - Callable only through Execute Sub-workflow.
   - Receives one strictly validated queue claim, transforms one post, and in apply mode writes/read-backs one Directus draft and its topic junctions.
   - Returns typed success/retryable/terminal results to the orchestrator.
   - Does not attach the shared Error Handler because the queue owner owns retries and terminal escalation.

This split is warranted. It keeps state/retry policy out of transformation code, lets a single post be dry-run or replayed independently, and prevents a partial post failure from losing the rest of the batch. A third workflow is unnecessary; reconciliation belongs in the orchestrator.

## Queue and state

Use a new native n8n Data Table named `SRI WordPress Blog Migration Queue`. This is temporary migration state, not operational client data, so NocoDB would be heavier and would mix a one-time content transfer into the business source of truth. The existing media table remains read-only input.

Native Data Tables support string, number, boolean, and date columns. JSON values below are serialized strings.

| Field | Type | Purpose |
| --- | --- | --- |
| `row_type` | string | `control` for the one run-lock row; `post` for the 108 manifest rows. |
| `job_key` | string | Application-unique identity. After source resolution: `wordpress:sonshine-roofing:{databaseId}`. |
| `source_post_id` | string | Immutable WordPress database ID, stored as a string. |
| `source_slug` | string | Approved manifest slug. |
| `source_url` | string | Exact public sitemap URL. |
| `sitemap_lastmod` | date | Sitemap last-modified timestamp for drift reporting. |
| `disposition` | string | `migrate` or `exclude`. |
| `topic_slugs_json` | string | Ordered approved topic slugs, one to three for candidates. |
| `manifest_schema_version` | string | Expected manifest version, currently `1.1.0`. |
| `manifest_sha256` | string | Hash of the approved canonical manifest used to seed the queue. |
| `status` | string | `excluded`, `pending`, `running`, `retry_wait`, `dry_run_verified`, `post_written`, `verified`, or `failed`. |
| `attempts` | number | Automatic worker claims; maximum three. |
| `manual_retry_count` | number | Separately approved retry claims after automatic exhaustion. |
| `next_attempt_at` | date | Earliest manual run that may reclaim a retryable item. |
| `lease_owner` | string | Run/execution correlation ID for the current claim. |
| `lease_expires_at` | date | Thirty-minute post lease or run-lock expiry. |
| `run_id` | string | Current migration run ID. |
| `last_execution_id` | string | Compact n8n correlation only; no execution URL or secret data. |
| `source_fetched_at` | date | Successful exact WordPress read. |
| `payload_sha256` | string | Hash of the canonical desired Directus scalar payload plus topic IDs. |
| `directus_post_id` | string | Reconciled Directus UUID after a confirmed create/readback. |
| `dry_run_verified_at` | date | All read-only preconditions and transforms passed. |
| `post_written_at` | date | Scalar post readback passed. |
| `relations_written_at` | date | Exact M2M topic readback passed. |
| `verified_at` | date | Full final readback passed. |
| `created_by_migration` | boolean | Confirms the record originated from this migration rather than a pre-existing editorial record. |
| `manual_retry_requested` | boolean | Explicit operator request to reconsider a failed item without deleting history. |
| `last_error_code` | string | Stable non-sensitive error code. |
| `last_error_summary` | string | Bounded, sanitized diagnostic; no body HTML, API response, credential, or personal data. |
| `result_summary_json` | string | Compact counts/hashes only, never the full article body. |

Seed all 108 manifest records so exclusions are explicit audit rows. Exactly 106 must have `disposition=migrate`; the two approved exclusions must start and remain `status=excluded`. Add one separate `row_type=control` row for the application-level run lease. Counts always filter `row_type=post`.

n8n Data Tables do not provide a database unique constraint or true compare-and-set transaction. The workflow therefore remains manual-only and single-operator, performs exact pre/post claim readbacks, and refuses to start while the unexpired control lease belongs to another run. This narrows accidental overlap but is not represented as transaction-safe.

## Directus prerequisites

The migration must not be created as a write-capable workflow until these prerequisites are applied and read back under a separately approved Directus plan:

1. Create client-scoped `blog_topics` and the M2M junction to `blog_posts`.
2. Enforce or otherwise reliably validate unique `(client, slug)` topics and unique post-topic junction pairs.
3. Add `blog_posts.published_at` and `blog_posts.featured`.
4. Add a unique namespaced migration identity field. Recommended name: `external_id`, value `wordpress:sonshine-roofing:{databaseId}`. A single unique string closes duplicate-create ambiguity better than separate non-unique source/source-ID fields. Mark it read-only in the Directus editor because automation owns it.
5. Add `source_updated_at` for the original WordPress modified timestamp and mark it read-only in the Directus editor because automation owns it. `date_created` must remain the Directus record-creation audit timestamp. Keep `published_at`, `featured`, and ordinary content fields editable.
6. Do not add `canonical_path`, `og_title`, or `og_description` initially. The frontend derives the canonical public path from the slug and uses `meta_title`, `meta_description`, and the Directus featured image for social metadata.
7. Resolve Michael's WordPress author identity to the SonShine-scoped `persons`
   UUID `f028dafd-c2fb-4d59-a561-2be5e46ea318` by exact approved mapping. Leave
   all 95 organization-authored candidates' `author` relation null and preserve
   the frontend organization fallback display `SonShine Roofing`. Keep the
   Borntreger Digital Michael record separate; do not fuzzy-match names.
8. Keep the legacy scalar `topic` field until `borntreger-digital-website` is migrated/backfilled and both frontends consume the new relation. The SonShine importer writes only `topics`.
9. Pre-create the exact approved 21 SonShine topic records. The migration workflow should verify them, not invent or rename taxonomy during a post run.
10. Add/verify a database or workflow guard that a post and every related topic have the same client.

All imported posts should initially be `draft`. A later batch publication/cutover is a distinct production change requiring explicit approval.

## Manual trigger, batching, rate limits, and resume

The orchestrator has one Manual Trigger and a documented configuration Code node with these non-secret settings:

- `MODE`: `dry_run` by default; only `apply` permits Directus writes.
- `BATCH_SIZE`: hard-restricted to `1`, `5`, or `10`; default `1`.
- `ONLY_SLUG`: optional exact pilot/recovery slug.
- `EXPECTED_MANIFEST_SHA256`: hash generated from the approved manifest.
- `MAX_AUTOMATIC_ATTEMPTS`: fixed at `3`.
- `LEASE_MINUTES`: fixed at `30`.
- Automatic retry delays: 5 minutes after the first retryable outcome and 30 minutes after the second. A retryable outcome on the third automatic claim becomes terminal rather than scheduling a fourth automatic claim.

Only one post worker runs at a time. Wait one second between posts. Safe WordPress/Directus reads may retry up to three observations with 2/10/30-second delays; HTTP 429 honors a bounded `Retry-After` value. Deterministic exact-set PATCH operations may receive bounded retries only when followed by exact readback. Directus creates, junction creates, and any future asset import are non-idempotent writes and are never blindly retried.

An expired `running` lease is recoverable only after the worker reconciles Directus by `external_id` and the queue's known post ID. Already completed checkpoints are preserved. A manual rerun selects only `pending`, due `retry_wait`, requested-retry, or expired-lease records. It never resets the whole table.

The recommended progression is:

1. Read-only dry run of all 106 candidates.
2. One selected pilot with `BATCH_SIZE=1` and representative inline media/multiple topics.
3. A second one-post pilot with older legacy markup.
4. Reviewed batches of five.
5. Optional batches of ten only after the first two five-post batches reconcile cleanly.

No schedule trigger is needed for a one-time migration. If Michael later wants unattended retry polling, adding/publishing a schedule is a separate approval; it is not part of this design.

## Orchestrator node sequence

Names below are proposed canvas names and responsibilities. Sticky notes should divide `CONFIGURATION`, `SOURCE/MANIFEST PREFLIGHT`, `DIRECTUS PREFLIGHT`, `QUEUE CLAIM`, `WORKER LOOP`, and `RECONCILIATION/REPORT`.

1. **Manual Start** — the only trigger.
2. **Set Migration Configuration** — emit mode, batch size, optional slug, expected hash, retry/lease constants, and a collision-resistant `run_id`.
3. **Validate Migration Configuration** — reject unknown keys/modes, invalid batch sizes, or missing expected hash.
4. **Read Run Control Row** — read the single control row.
5. **Claim Run Lease** — guarded update when no valid lease exists.
6. **Verify Run Lease** — exact owner/expiry readback; otherwise stop with an overlap error.
7. **Fetch Public Blog Sitemap** — HTTPS GET to the exact approved sitemap URL, no redirects to an unapproved host.
8. **Parse and Validate Sitemap** — parse XML, require 108 unique public SonShine URLs, validate slug grammar, and capture `lastmod`.
9. **Read Queue Snapshot** — read every post row plus the control row.
10. **Validate Approved Manifest Snapshot** — require 108 unique post rows, exactly 106 migrate/two exclude, exact excluded slugs, one to three topics for every candidate, no candidate above three, all references in the approved 21-topic catalog, and the expected manifest hash/version.
11. **Read WordPress Post Index** — paginate the public GraphQL published-post index in pages of 100.
12. **Reconcile Sitemap, Queue, and WordPress** — require exact slug-set equality and one immutable database ID per slug; construct/verify every namespaced `job_key`.
13. **Resolve SonShine Directus Client** — require exactly one active client by slug; do not embed a client UUID.
14. **Read Directus Topic Catalog** — fetch all topics for the resolved client.
15. **Validate Directus Topic Catalog** — require one exact active name/slug match for each approved topic and reject cross-client or duplicate matches.
16. **Read Directus Author Map** — fetch the approved author records/fallback contract.
17. **Validate Directus Author Map** — prove every WordPress author ID maps to exactly one approved result.
18. **Read Media Manifest Snapshot** — read the existing media Data Table.
19. **Validate Media Manifest Health** — require only `verified`/`verified_existing` mappings used by candidate posts, unique source identity, valid Directus file IDs, and no exhausted/unfinished state. Unused excluded-post assets are allowed.
20. **Recover Expired Post Leases** — reconcile expired claims without clearing checkpoints; exhausted rows become `failed`.
21. **Select Due Migration Jobs** — filter by mode, due state, optional slug, and deterministic order; cap at batch size.
22. **Loop Posts One at a Time** — serial Split in Batches.
23. **Claim Post Lease** — guarded row update: expected prior state, increment either automatic attempts or the separately requested manual-retry count once, then set owner/expiry/run/execution IDs.
24. **Verify Post Lease** — exact readback; zero or conflicting rows fail closed.
25. **Execute Post Worker** — synchronous callable worker with the strict API below.
26. **Classify Worker Result** — accept only a typed `verified`, `dry_run_verified`, `retryable`, or `terminal` envelope.
27. **Commit Success Checkpoints** — guarded queue update from the returned post ID, payload hash, and timestamps.
28. **Schedule Retry** — preserve checkpoints, clear lease, set `retry_wait` and the bounded next-attempt timestamp.
29. **Commit Dead Letter** — set `failed`, preserve post ID/checkpoints, and store only stable sanitized diagnostics.
30. **Inter-Post Rate Limit** — one-second Wait.
31. **Continue Serial Loop** — process the next selected row.
32. **Read Final Queue Snapshot** — count every status after the batch.
33. **Reconcile Directus Migration Set** — in apply mode, read namespaced SonShine source records and verify no duplicate source keys and no excluded slug.
34. **Build Compact Run Report** — report total/excluded/pending/dry-run/verified/retry/failed counts, affected slugs, and hashes; omit article bodies and raw API errors.
35. **Release Run Lease** — guarded clear owned by this run and verified by readback.
36. **Finish Manual Run** — return the compact report only. Do not send email or Telegram from ordinary success paths.

If a top-level technical error occurs after claiming the run, a final owned-lease cleanup branch should attempt a safe release before throwing to the shared Error Handler. It must never release another run's lease.

## Post worker API and node sequence

The Execute Sub-workflow Trigger accepts exactly one item:

```json
{
  "api_version": "1.0",
  "row_id": "n8n-data-table-row-id",
  "run_id": "migration-run-id",
  "lease_owner": "claim-owner-id",
  "mode": "dry_run",
  "expected_manifest_sha256": "approved-hash"
}
```

Extra keys, unsupported versions/modes, malformed IDs, or a hash mismatch reject before any external read.

Proposed worker sequence:

1. **Execute Post Worker Trigger** — callable trigger only.
2. **Validate Worker Request** — strict API `1.0` validation.
3. **Read Claimed Queue Row** — exact row-ID lookup.
4. **Verify Post Claim and Disposition** — require candidate disposition, matching run/lease, unexpired lease, expected hash, and one to three approved topic slugs.
5. **Fetch WordPress Post by Slug** — one public GraphQL query for `databaseId`, slug/URI/status, title, date, modified date, rendered excerpt/content, author identity, featured image identity/URL/alt text, all source categories, and Rank Math SEO/Open Graph fields.
6. **Validate WordPress Source Identity** — require published source, exact slug/database ID/public URL, valid timestamps, nonempty title/body, and no excluded slug.
7. **Resolve Featured State and Approved Topics** — set `featured=true` only if the source includes the historical `featured` category; ignore all other WordPress category assignments and use only the manifest topic slugs.
8. **Read Media Mappings for Post** — filter the existing media table by candidate slug and role.
9. **Build Media Alias Map** — normalize literal-space/percent-encoded aliases and WordPress media IDs to one verified Directus file ID.
10. **Validate Directus Media Files** — read each referenced Directus file and require the expected ID, image MIME type, nonzero size, approved SonShine folder/role, and nonempty Directus description. The existing file is authoritative; no metadata rewrite occurs.
11. **Transform Body HTML and Internal Links** — deterministically replace featured/inline WordPress upload URLs with `/assets/{directus_file_id}`; remove obsolete `srcset`, `sizes`, and lazy-source attributes that point to WordPress derivatives; rewrite internal backend-host links to the public SonShine host; preserve semantic body markup, text, headings, lists, tables, links, image alt text, and supported YouTube embeds.
12. **Validate Transformed HTML** — reject scripts, unsupported iframe hosts, unmapped WordPress upload references, malformed Directus asset IDs, missing mapped images, or an unexpected text-content/hash loss. Do not silently drop a failed element.
13. **Normalize Directus Scalars** — decode title entities; produce a plain-text excerpt from the rendered excerpt; map original `date` to `published_at`, `modified` to `source_updated_at`, SEO title/description to `meta_title`/`meta_description`, and author according to the pre-approved mapping. Canonical URLs are derived by the frontend from the preserved slug and are not stored.
14. **Resolve Directus Relations** — use the preflighted client, author, featured file, and exact topic IDs; verify every topic has the same client.
15. **Build Canonical Payload and Hash** — stable key order and SHA-256 over all desired scalar/relation values; never include credentials or response envelopes.
16. **Dry-Run Gate** — in `dry_run`, perform no Directus mutation and return `dry_run_verified` with hashes/counts.
17. **Find Directus Post by External ID** — require zero or one exact namespaced match.
18. **Classify Create, Resume, or Conflict** — zero means create; one migration-owned draft means reconcile/resume; published, non-migration-owned, duplicate, or wrong-client matches are terminal manual-review conflicts.
19. **Create Draft Post Scalars** — one non-retried create with `status=draft`, external ID, client, title/slug/body/excerpt/dates/SEO/featured/author/featured image. Do not create M2M rows in this call.
20. **Reconcile Ambiguous Create** — after an error/timeout, exact GET by unique external ID; continue only if one record matches the desired identity. Never blind-retry the create.
21. **Patch Resumable Migration Draft if Needed** — deterministic exact-set PATCH only for a record already proven to belong to this migration; never update an unrelated/editorially changed record.
22. **Verify Scalar Post Readback** — exact field values, normalized instants, body hash, client, author, featured image, status, and source key.
23. **Read Existing Topic Junctions** — require no unexpected cross-client or duplicate relation.
24. **Create Missing Topic Junctions** — create only missing unique pairs, one at a time, without blind retry; reconcile an ambiguous response by exact junction readback.
25. **Verify Exact Topic Set** — require the approved one-to-three topic IDs and no extras.
26. **Final Post Readback** — prove all scalar, media, author, date, SEO, status, and topic postconditions and no remaining WordPress upload host.
27. **Return Typed Worker Result** — one compact result with outcome, post ID, payload hash, checkpoints, and stable error classification. No full body or raw response is returned.

The worker does not mutate the queue. The orchestrator is the only queue-state owner.

## Media import and deduplication contract

The post workflow should **not** import assets. That work is already complete and verified in the existing media manifest and Directus image pipeline. Re-importing inside the post worker would create duplicate assets, couple article retries to image processing, and reactivate a migration that has already been closed.

For every source image reference:

- Resolve by normalized source URL and, when available, WordPress media ID.
- Require the mapping's post association/role to include the current slug and `featured` or `inline` use.
- Require exactly one Directus file ID after alias collapse.
- Use `/assets/{uuid}` in body HTML and the UUID relation for `featured_image`.
- Treat `verified_existing` as equivalent to `verified` only for its documented existing mapping.
- If a source image is not mapped, stop that post with `MEDIA_MAPPING_MISSING`. Do not automatically import it.
- A genuinely new/missed asset requires a separately reviewed repair addition to the media migration process, followed by media readback, before the post is retried.

No image binary passes through n8n in this workflow. Existing Directus descriptions and automation provenance are preserved unchanged.

## Mapping contract

| WordPress | Directus | Rule |
| --- | --- | --- |
| `databaseId` | `external_id` | Namespaced as `wordpress:sonshine-roofing:{databaseId}`. |
| `slug` | `slug` | Preserve exactly; validate public sitemap URL. |
| rendered `title` | `title` | Decode HTML entities without rewriting wording. |
| rendered `content` | `body` | Preserve semantic content; replace media/backend links only as documented. |
| rendered `excerpt` | `excerpt` | Decode to compact plain text; do not invent a new summary. |
| `date` | `published_at` | Preserve original instant; never force it into `date_created`. |
| `modified` | `source_updated_at` | Preserve source last-modified instant. |
| author ID/name | `author` or organization fallback | Exact approved two-entry mapping; never fuzzy-match by display name. |
| featured image | `featured_image` | Existing verified Directus file relation. |
| historical Featured category | `featured` | Boolean presentation state. |
| manifest `proposed_topic_slugs` | `topics` M2M | Exact one-to-three approved client topics; source hierarchy ignored. |
| Rank Math SEO title | `meta_title` | Preserve rendered value. |
| Rank Math SEO description | `meta_description` | Preserve rendered value. |
| Rank Math canonical URL | not stored | Validate source identity against the preserved slug, then let the frontend derive the public canonical URL; never copy the WordPress backend hostname. |
| Rank Math Open Graph title/description | dedicated fields if approved | Preserve only when the schema/frontend explicitly supports them; otherwise document the intentional simplification. |
| Rank Math Open Graph image | Directus image relation | The observed differences are WordPress size/encoding variants of the featured asset; resolve to the same canonical Directus file unless a dry run proves otherwise. |
| Rank Math focus keyword(s) | Directus focus fields | Populate only from an exact supported source field. Do not infer keywords from article text or topic assignments. |

## Idempotency and write safety

- `external_id` is the Directus idempotency key; `job_key` is the queue identity; `payload_sha256` detects drift.
- A unique Directus external ID and unique post-topic pair are prerequisites, not optional best-effort checks.
- New posts are created only when exact lookup returns zero. Creates are non-retried.
- A lost create response is reconciled through exact external-ID readback.
- Resumes may patch only an identified migration-owned draft and must read back the exact desired state.
- Topic junction creation is missing-only and followed by exact set readback.
- The workflow never deletes a post, topic, file, or junction.
- A changed source post after manifest approval is a drift condition. Compare GraphQL `modified`, sitemap `lastmod`, and payload hash; report it rather than silently migrating a different version unless Michael explicitly accepts a refreshed source snapshot.

## Dry run, checkpoints, and reconciliation

Dry run performs every source, manifest, schema, topic, author, media, HTML, and target-conflict read but stops before Directus mutation. It may update only the approved migration queue/checkpoint table after that table and draft workflow creation are separately authorized.

Per-post checkpoints are monotonic. A later checkpoint never clears an earlier confirmed one. The queue keeps a Directus post ID as soon as create reconciliation proves it, even if relations or final verification fail.

The full preflight must prove:

- Sitemap: 108 unique URLs.
- Queue manifest: 108 unique post rows.
- Disposition: 106 migrate and exactly two excluded (`grouper-tacos`, `lead-safe-certified`).
- WordPress: exactly one published source record per sitemap slug and no extra published source slug in the migration set.
- Topics: all 106 candidates have one to three approved slugs and all references resolve to the approved 21-topic SonShine catalog.
- Authors: all 106 map through the exact approved two-author contract.
- Media: every featured and inline source reference resolves to one verified Directus file.
- Target: no duplicate external IDs, duplicate SonShine slugs, cross-client topics, or pre-existing conflicting records.

The final apply reconciliation must prove:

- Exactly 106 verified Directus posts with the migration's namespaced external IDs.
- Zero Directus post for either excluded external ID/slug.
- 106 unique source IDs, 106 unique candidate slugs, and one queue row per source.
- Exact title, slug, slug-derived public canonical behavior, author display contract, publication/modified dates, body hash, excerpt, SEO fields, featured state/image, and approved topic set for every post.
- Every post remains draft until a separately approved publication/cutover step.
- No migrated body references the WordPress uploads host and no post has more than three topics.
- Queue terminal total reconciles: `verified=106`, `excluded=2`, with zero pending/running/retry/failed rows.

The final report should be a compact JSON/Markdown summary emitted by the manual execution and optionally exported locally. It should list failed/ambiguous slugs and stable error codes, but not copy article bodies or secret-bearing responses into n8n execution data.

## Dead-letter and manual recovery

Retryable examples: WordPress/Directus 429, transient 5xx, network timeout, or delayed exact readback after an idempotent write.

Terminal examples: manifest/hash mismatch, source set drift, excluded slug, malformed source identity, more than three topics, unknown/duplicate/cross-client topic, author ambiguity, missing/duplicate media map, unsupported active content, duplicate external ID, conflicting pre-existing Directus record, or exact readback mismatch.

After three automatic claims, set `failed`. A retry requires `manual_retry_requested=true` after Michael reviews the condition. Manual retry increments `manual_retry_count`, preserves automatic-attempt history, hashes, post ID, and checkpoints, and does not delete or recreate the post. Each additional manual retry requires a new explicit request after the prior one returns to `failed`.

## Rollback and recovery

- WordPress remains the production content source throughout import and verification.
- Directus posts are created as drafts, so stopping the workflow has no public effect.
- The preferred rollback is to stop, inspect queue/readback state, and correct/resume the affected drafts. Do not delete automatically.
- If a migration-created draft must be removed or archived, that is a separate explicit destructive/production-data authorization with exact IDs.
- The approved final frontend has no source flag or WordPress blog fallback. If
  a post-cutover regression requires restoring WordPress, revert the frontend
  cutover code and redeploy deliberately; do not erase Directus data.
- Retain the queue and media manifest until final reconciliation, frontend cutover, and the later freshness pass are complete. Archive/rename cleanup is separately approved.

## Security and production safeguards

- Use existing n8n credentials by binding; never put tokens, credential names/IDs, webhook paths, or secrets in Code nodes, sticky notes, the queue, reports, or this document.
- Allow only the exact HTTPS sitemap/public host, the exact WordPress GraphQL host, and the configured Directus base. Reject unexpected redirects and source hosts.
- Do not expose a public webhook. The workflows are manual/callable only.
- Keep both workflows unpublished. The orchestrator gets the shared Error Handler; the callable queue worker does not duplicate recoverable alerts.
- Disable successful execution payload retention and execution-progress snapshots where supported. Durable diagnostics live in compact queue state. Avoid retaining full public article bodies repeatedly in n8n execution history.
- Michael has explicitly authorized the primary agent to run and test these two migration workflows through the staged progression in this plan. The primary must still stop at each safety gate, inspect exact saved-draft/readback evidence, and limit write-capable tests to the named pilot or batch. This authority does not extend to the builder subagent or to unrelated workflows/systems.
- No email, Telegram, NocoDB, AccuLynx, Hatch, Stripe, Shlink, or other business side effect belongs in this migration.
- Do not run or reactivate the completed media migration merely to test this post workflow.
- Every future successful n8n MCP write must be documented in `n8n.md` in the same session, including new tables, workflows, settings, tags, and later edits.
- At workflow creation, include sticky notes covering purpose, trigger/source, manifest/count gates, queue/lease semantics, Directus/media side effects, retry ownership, exclusions, dry-run/apply mode, and the manual publication prohibition.

## Python alternative

A local Python migration has real advantages for this one-time job:

- It can read the approved JSON directly from disk.
- `lxml`/BeautifulSoup makes HTML and responsive-image transformation easier to unit-test than regex-heavy n8n Code nodes.
- Code, fixtures, and reports are naturally version-controlled.
- A local SQLite ledger can provide strong unique constraints and transactions.

Its costs in this environment are significant:

- The verified media mapping currently lives in an n8n Data Table and would need a safe export.
- A Directus token would need to be provisioned to the local runner without leaking into shell history/logs.
- It would create a second state/retry system instead of reusing the already established migration pattern and credentials.
- Operational inspection and manual batch progression would be less visible in the existing n8n control plane.

**Recommendation:** use the n8n orchestrator/worker design for this migration because the media ledger, Directus access, retry conventions, and prior SonShine migration history already live there. Keep the transformation logic as pure functions and test the same functions/fixtures locally before inserting them into Code nodes. Use Python only if the full dry run demonstrates HTML cases that cannot be represented safely in n8n without brittle parsing; if that happens, export the media manifest and design a SQLite-backed script before any content write.

## Staged implementation and testing plan

The implementation followed the staged sequence below; the completion record at
the top of this document is authoritative for the resulting state.

### Stage 0 — completed: written design

- Read `n8n.md`, the approved manifest, live Directus schema, relevant frontend adapters/sanitizer, public sitemap, public WordPress author/source shape, and the existing media-table schema.
- Produce this plan.
- Make no n8n or remote write.

### Stage 1 — approved Directus schema/data implementation

- Apply/read back `blog_topics`, M2M junction, dates/featured/external-ID/source fields, unique constraints, 21 topics, and author mapping.
- Keep legacy scalar topic for Borntreger frontend compatibility.
- No posts migrated yet.

### Stage 2 — delegated n8n draft/table construction

- The primary delegates this stage to the n8n builder subagent after confirming Stage 1 readback.
- The builder reads the n8n Workflow SDK reference and applicable best practices.
- The builder creates the queue table, seeds the 108 approved rows plus one control row, and reads back exact counts/hash.
- The builder creates both workflows with sticky notes, tags/folder placement, safe retention settings, and the shared handler only on the orchestrator.
- The builder validates nodes and complete graphs while composing and updates `n8n.md` after successful n8n writes.
- The builder leaves both workflows unpublished and performs no node/workflow execution or live-system test.
- The primary then independently reads back every saved node, connection, setting, credential binding, table field, queue row count, and manifest hash before polishing any issue.

### Stage 3 — primary-agent side-effect-free validation and polish

- Unit-test pure manifest, sitemap, HTML, mapping, hashing, and response-classification nodes with synthetic/pinned fixtures.
- Run the SonShine frontend sanitizer/render test over all 106 transformed bodies locally; inventory removed tags/attributes, remaining WordPress URLs, headings/tables/embeds, and text-content hashes.
- Test create-response ambiguity and relation reconciliation with mocked responses only.
- Re-read saved workflows, settings, credentials bindings, connections, and queue schema. Update documentation for any change.

### Stage 4 — primary-agent read-only migration dry run

- Run manual `MODE=dry_run` against all 106 candidates.
- Permit WordPress, sitemap, Directus, and n8n Data Table reads plus approved compact queue checkpoint writes only.
- Require zero source/schema/topic/author/media/HTML/target conflicts before apply.
- Review the compact report with Michael.

### Stage 5 — primary-agent one-post draft pilot

- Explicitly authorize one named post and its exact Directus draft/junction writes.
- Use batch one, verify every scalar/media/relation/readback, render it locally, and rerun the same post to prove idempotency.
- No publication or frontend cutover.

### Stage 6 — primary-agent controlled draft batches and exact-version publication

- Run a second batch-one legacy-markup pilot, then two batches of five.
- Review queue, Directus, frontend rendering, and logs between batches.
- Increase to ten only after clean reconciliation.
- Stop on any invariant failure; do not skip a failed post merely to reach 106.
- After draft tests and exact saved-version readback pass, publish only the exact tested orchestrator and worker versions. Reconfirm the active versions match before any subsequent published execution.

### Stage 7 — final reconciliation and Directus-only frontend cutover

- Prove the exact 106/2 terminal contract.
- Complete the SonShine Directus adapter and Borntreger Digital M2M topic frontend/backfill work before removing scalar-topic support.
- Run builds, sitemap/canonical/structured-data/archive/filter/detail/image/date checks.
- Publication of Directus posts, local frontend cutover, cache revalidation,
  WordPress retirement, and deployment each require separate explicit approval.
  Publication and the local Directus-only cutover were later approved and
  completed; deployment, cache revalidation, and WordPress retirement remain
  separate.

### Stage 8 — first independent read-only review

- After the authorized draft-migration operation is implemented and
  locally/remotely reconciled, spawn one independent subagent with read-only
  authority only. Publication, local cutover, and deployment were separate
  gates and were not prerequisites for reviewing the completed draft migration.
- Review the current Directus schema/data, 106/2 counts, topic and author mappings, media/body fidelity, n8n queue/workflow state and exact versions, both frontend implementations, builds, routes, sitemaps, metadata, and recovery posture.
- The primary agent evaluates every finding, rejects unsupported suggestions with evidence, merges warranted corrections, updates documentation, and reruns affected verification before proceeding.

### Stage 9 — second independent read-only review

- Only after Stage 8 feedback is resolved, spawn a different independent subagent for a fresh read-only review of the then-current state. Do not run the reviewers concurrently and do not ask the second reviewer merely to confirm the first.
- The primary independently evaluates and merges warranted findings, reruns the complete final reconciliation/build/smoke suite, and reports any intentionally deferred issue.
- Neither reviewer may mutate files, Directus, n8n, WordPress, deployments, or any other system.

## Approved decisions and execution authority

1. Add unique `external_id`, plus `published_at`, `source_updated_at`, and `featured` to `blog_posts`.
2. Keep separate Borntreger Digital and SonShine Roofing Michael records, and
   use the SonShine-scoped `persons` record
   `f028dafd-c2fb-4d59-a561-2be5e46ea318` for the 11 Michael-authored candidates
   through one exact approved mapping.
3. Leave the 95 organization-authored candidates' `author` relation null and use the existing `SonShine Roofing` organization fallback.
4. Do not add dedicated canonical/Open Graph text fields initially; derive canonical paths from slugs and use `meta_title`, `meta_description`, and the Directus featured image.
5. Leave focus-keyword fields empty when WordPress does not expose exact values; do not infer them.
6. Normalize HTML deterministically by replacing mapped media/backend URLs and removing obsolete WordPress responsive/lazy attributes while preserving semantic rendered HTML.
7. Treat a missing media mapping as terminal/manual repair and never automatically re-import.
8. Import all 106 candidates as Directus drafts through manual progression `1 → 1 → 5 → 5 → optional 10`, with no schedule trigger.
9. The primary agent has explicit permission to run, test, polish, and publish these two migration workflows under this plan's safety gates. The n8n builder subagent may build unpublished drafts and queue scaffolding only; it may not execute, test, publish, or unpublish them.
10. After the operation is complete, two independent read-only subagents must review sequentially, with primary-agent review/merging and re-verification between them.
