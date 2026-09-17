# Location migration release and recovery

Owner scope amendment, 2026-09-15: location reviews are a static import followed by
manual maintenance. The existing n8n workflow remains unchanged. The owner has
approved Directus preparation/migration, private recovery, all 72 five-star reviews,
SEO values, and neighborhood publication. The September 16 execution also covers
export/CI repairs, overviews, neighborhood copy, project-neighborhood verification
and local FAQs. The September 17 owner-confirmed project memberships and Arroyo
Vista removal are applied; see the [decision record](location-decisions-20260917.md).
The owner subsequently approved all 25 proposed neighborhood additions and
authorized execution of the integrated merge/release plan. The additions and 28
project connections are applied; see [release execution](location-release-20260917.md).

Read the [current handoff](location-handoff.md), [manual review contract](location-reviews.md)
and [verification record](location-verification.md) before execution.

## Completed foundations

- Applied additive location schema, canonical relationships and actual reader
  permissions. Project job references remain private, including nested access.
- Verified and applied all 53 owner-supplied project/job/ZIP matches, then enforced
  required job ID and ZIP for SonShine only. Existing primary areas are preserved;
  neighborhood remains nullable. No unattended AccuLynx automation is included.
- Applied the original 219-operation location plan with exact field, byte and
  timestamp readback, followed by a 219-match/no-write repeat.
- Applied five approved SEO/date sets. All five page owners are now published,
  with noindex false and populated overviews. Originally published 87 canonical
  neighborhoods; the completed September 17 changes leave 113 published and one archived,
  including two owner-confirmed additions and 25 approved release additions. Retained the approved P1/P2 image associations. Current editorial
  counts and verification are in [editorial status](location-editorial-status.md).
- Added 25 published local FAQs and preserved all 45 previous FAQs. Each hub shows
  five local answers before the eight shared answers. The rendered order and
  structured data are covered by regression tests.
- Retained narrow recovery receipts and prior application image in the approved
  private root `/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15`.

The retained rollback application is `0271ec70f46a2b31c4eb012da28459f6a9144184`.
The integrated release was deployed and verified at `4967397` on September 17;
see [public release evidence](location-release-20260917.md#production-verification).
No workflow save or workflow publication is part of this release. Current import totals and cleanup results belong
in the handoff; historical plans are not current execution instructions.

## Export and verification contract

`inventoryWordPress()` writes `wordpress-location-source-v2` with
`contentFormat=rendered-html` and an explicit body-availability value per page.
Missing or null rendered bodies fail the capture; an available empty string is
recorded separately. The September 16 capture recovered all five current rendered
bodies. It does not reconstruct historical RAW content or replace a WordPress
backup. Retain earlier exports and receipts; never overwrite them with a recapture.

Quality CI runs `npm run verify:locations` (the nine existing location checks plus
export regression tests) and `npm run verify:dynamic-routes`. Dynamic-route checks
cover locations, projects, blog posts, people, glossary terms, special offers,
sitemaps and resource API input. Complete route-owner pagination rejects missing
counts, truncation, duplicate identities and records outside published client
scope. Special-offer static paths and sitemap entries use the same complete
published inventory.

## Static review import gate

No further workflow or deployment approval is needed to execute the authorized
static import. Before writing, freeze an identifiable candidate and exact private
plan, independently review deduplication and source facts, verify fresh target state,
and retain narrow before-images. New reviews must keep null Google identity.
Confirmed Google-managed matches require disposition rather than duplication.

Import drafts, verify all fields and location relations, then publish the approved
new records with status-only writes. Replan from fresh targets and verify no
additional operations or duplicate records. Confirm the existing managed review set
and sitewide response are unchanged. The existing n8n workflow stays active and
untouched throughout; no seed, patch, rollover change or workflow rollback applies.

Unused feed-preparation columns, their CHECK and explicit reader fields may be
removed only after a global unused-value check, SQL dependency review and exact
metadata/permission before-images. A dependency or nondefault value stops cleanup.
Private abandoned patch/seed files are withdrawn evidence, never release artifacts.

## Website release — authorized execution

1. Freeze application revision, model/invariant version, exact migration receipts,
   and normalized location/project snapshot hashes. Recheck later editorial changes.
2. Verify the five page owners' copy, indexability, maps, neighborhood photos, local
   claims, canonicals, links, FAQs and structured data. All neighborhoods and eligible
   reviews must have their intended publication state before the build.
3. Verify the existing publication states and run the Node 22 repository checks,
   including `verify:locations` and `verify:dynamic-routes`, and the credentialed
   build. Required upstream/schema/tenant errors must fail the build. Record the
   exact generated content digests; do not republish or reset the five owners.
4. Under the owner's execution authorization, deploy the validated application artifact. Verify the five preserved routes,
   unknown/draft/taxonomy-only 404s, canonical navigation, noindex/sitemap behavior,
   FAQ scope, empty-section omission and project/video independence. Perform desktop
   and mobile visual review against the actual deployed artifact.
5. Verify that CMS edits do not change deployed location output until another build.
   Verify the unchanged sitewide review feed and manually maintained local reviews.
6. Update verified shared-context ownership through its lint/diff/commit/sync process.
   The September 17 release established Directus production ownership. Treat this
   checklist as the gate for subsequent releases, not a request to replay migration.

## Rollback

The prior image is retained as `prior-application-0271ec7.docker.tar.gz`, image digest
`sha256:37463c5bfb2ea184893788de6b0c3e0e03060c12bf2558a41283eed86f745b07`.
It was verified readable; recovery has not been executed.

1. Stop migration activity and retain the affected editorial pause. Keep the existing
   Google workflow unchanged; static null-identity reviews are outside its ownership.
2. Restore the prior application artifact when needed. Its sitewide reader excludes
   null-identity manual imports, so published static reviews do not expand its feed.
3. Compare each current row's fields and modification state to its saved after-image.
   Restore only unchanged migration-owned fields. Later edits become conflicts.
   Avoid deleting new files or records with later references; preserve WordPress originals.
4. Retain additive schema and private-project permissions. Restoring pre-enrichment
   null job/ZIP values first requires authorized removal of only the SonShine required
   constraint. Preserve uniqueness and all private-field protections.
5. Verify restored application/content versions, page publication, media references,
   project/video behavior and review isolation. Keep the private receipts and prior
   application artifact until verification. WordPress-host retirement is out of scope.
