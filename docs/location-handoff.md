# SonShine location migration handoff

## Current scope and authorization

The owner confirmed on 2026-09-15 that location reviews are a static import,
deduplicated and linked to each location, then maintained by hand. All n8n changes
and workflow-cutover requirements are withdrawn. The existing review workflow
remains active and unchanged. Directus migration and the 72 actual five-star reviews
are approved; website deployment remains held for final approval.

Application baseline/deployed revision:
`0271ec70f46a2b31c4eb012da28459f6a9144184`.
This manual-review amendment starts from local `6957d2d31846ca392c07062d35c82f8a335975d1`.
Frozen implementation revision: `4a4c5f6a7aed9dccd383c6de2c1be4c8fdbf6ba2`.
Later documentation commits record execution without changing that reviewed code.

| State | Result |
| --- | --- |
| Implemented | Common location hubs, deterministic local/nearby selection, deployment snapshots, navigation/FAQ/SEO/sitemaps, model/privacy and repeatable migration/enrichment. Manual review isolation replaces the abandoned workflow work. |
| Migrated | Five canonical draft page owners, 87 unique neighborhoods, 91 immutable files, one taxonomy-only area and 39 junctions. All 53 project/job/ZIP enrichments and SonShine-only required constraint are applied. |
| Published in CMS | All 87 neighborhoods. Five SEO/date sets applied; all five location page owners remain draft and indexable when published. All 72 manual location reviews are also published. |
| Deployed | Existing WordPress-backed application at `0271ec7`; unchanged by this task. |
| Verified | All imports/readbacks and zero-write reruns; independent review and permissions; Node 22 lint/typecheck/29 verification scripts; credentialed 451-page build and 15 local runtime checks. |
| Remaining | Website-release approval, production-configured build and deployed five-page visual/route acceptance. No workflow approval or project mapping is outstanding. |

## Reconciliation

- Five source pages retain all five public routes.
- 88 neighborhood occurrences resolve to 87 canonical records, with one duplicate
  Longboat Key presentation folded into Sarasota. University Park and Arroyo Vista
  preserve their raw WordPress source identities and existing Sarasota organization.
- 93 media references resolve to 91 new immutable files, one shared-byte reuse and
  one excluded duplicate-owner image. WordPress originals remain intact.
- P1 Newtown/Washington Park is retained. P2 Waterford/Sawgrass is valid for both.
  These are explicit owner dispositions; exact photo geography is not an independent
  research claim. Image descriptions describe what is visible.
- 72 review occurrences are approved, including actual five-star ratings. Source
  allocation: Sarasota 15, Bradenton 13, Lakewood Ranch 4, Venice 21, North Port 19.
  Keep 71 verified dates, one null date, all 72 owner replies and source provenance.
  Two scheme-less links were verified with HTTPS prefixes without changing source keys.
- Fresh pre-import review comparison found no URL, normalized author/text or
  attribution-only candidate among the existing 32 SonShine records, and no duplicate
  source URL/text pair. Independent review found no plausible existing matches. Two pairs with generic
  overlapping praise have distinct attribution, source links and dates and remain
  distinct. All 72 were imported and published, with no Google identities created.
- Post-import total is104 SonShine reviews:72 manual plus32 unchanged managed;
  92 published and 12 archived. A fresh verified-target replan returns zero
  operations and 72 review matches.

The planner's 53 generic enrichment-held entries are superseded by the completed
separate enrichment pipeline, not unresolved mappings. See [enrichment](location-enrichment.md).

## Exact applied artifacts

| Artifact | Hash |
| --- | --- |
| Original 219-operation location plan | `a86b32efe0f8066a0c3feb3ba51d6b7883918a4e401fc723b44407bd62fde710` |
| 53-project enrichment plan | `7b74818c99e51db4da303bfb5a07428e335dce67904dcdc9a7627cdebc2912b2` |
| 85-neighborhood/five-SEO editorial plan | `6f5c09a7d21efe5a8a6c2efc236c1a326bb199fe2936ddafb7ec6a734b71cbd5` |
| University Park/Arroyo Vista increment | `d55cf23d47b5bd1b3e4fbbbc9dd26ef0d898021bb48e80604f0e9bbb7eb0500c` |
| Independent disposition readback | `a4d6585b344b37095519ed2be35c94a62e090fe85374ee8351e810bc7aa630d2` |
| Applied static 72-review plan | `aedc1100fb1061fc34e5be806d63cdee137aa9cec9a236f73cbd96af638a031a` |

The fresh no-operation rerun plan is
`fa58a1cff9ecb32a83d402908f922c97b2a377deb31fe325c5452b662b790070`.
The two unused feed fields, their CHECK and one permission-list subset were removed
with explicit owner approval and independent readback. All privacy protections,
32 original managed reviews and the active workflow are unchanged.

## Recovery and release

Approved private recovery root:
`/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15` (0700; files 0600).
It contains immutable source inventories, exact plans, private mappings, narrow
before/after receipts, file byte/timestamp proofs and independent evidence. Abandoned
workflow patches and seed plans are withdrawn historical evidence and must not run.

Retained prior application: `prior-application-0271ec7.docker.tar.gz`, image digest
`sha256:37463c5bfb2ea184893788de6b0c3e0e03060c12bf2558a41283eed86f745b07`.
Readability was verified; recovery has not been executed.

See [release and rollback](location-release.md), [manual review authoring](location-reviews.md),
[current editorial status](location-editorial-status.md) and [verification](location-verification.md).
Before restore, compare later edits to saved after-images. Preserve private project
permissions and the SonShine-only constraint dependency. Shared-context public
ownership is updated only after website deployment verification.
