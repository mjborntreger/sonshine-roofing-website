# SonShine location migration handoff

## Current scope and authorization

The owner confirmed on 2026-09-15 that location reviews are a static import,
deduplicated and linked to each location, then maintained by hand. All n8n changes
and workflow-cutover requirements are withdrawn. The existing review workflow
remains active and unchanged. Directus migration and the 72 actual five-star reviews
are approved. On 2026-09-16 the owner also authorized the export/CI repair,
overviews, two-pass neighborhood descriptions, project neighborhood research and
local FAQs. Website deployment remains held for final approval.

Application baseline/deployed revision:
`0271ec70f46a2b31c4eb012da28459f6a9144184`.
This manual-review amendment starts from local `6957d2d31846ca392c07062d35c82f8a335975d1`.
September 15 frozen implementation: `4a4c5f6a7aed9dccd383c6de2c1be4c8fdbf6ba2`.
The current candidate includes subsequent export, CI and FAQ changes. The reviewed September 16 completion commit and build digests are recorded in
private `execution-2026-09-16/verification/completion-manifest.json`.

| State | Result |
| --- | --- |
| Implemented | Common location hubs, deterministic local/nearby selection, deployment snapshots, navigation/FAQ/SEO/sitemaps, model/privacy and repeatable migration/enrichment. Manual review isolation replaces the abandoned workflow work. |
| Migrated | Five canonical page owners, 87 original unique neighborhoods, 91 immutable files, one added taxonomy-only area and 39 junctions. All 53 project/job/ZIP enrichments and the SonShine-only required constraint are applied. |
| Published in CMS | All five location page owners are published with overviews and the existing SEO/date sets. The 87 original neighborhoods and 72 manual location reviews remain published. Added 25 local FAQs; the prior 45 FAQs are unchanged. |
| Deployed | Existing WordPress-backed application at `0271ec7`; unchanged by this task. |
| Verified | September 15 import/readback and release-candidate checks remain historical evidence. September 16 export/CI/FAQ changes pass Node 22 lint, typecheck, Tailwind, all nine location verifiers plus export tests, and 14 dynamic-route contract groups. The integrated build generates 456 pages, validates 443 route owners, and serves all five hubs with 13 matching visible/schema FAQs. |
| Remaining | Resolve the Arroyo Vista factual hold and remaining project-neighborhood dispositions, then final release acceptance. The credentialed candidate build and route checks pass; both independent sequential reviews completed without new actionable findings. Website deployment still requires release approval; no workflow change or project-to-job remapping is required. |

## September 16 content and code update

- All five overview fields are populated. Page identities, introductions, SEO and
  publication states are preserved.
- Five published local FAQs per location precede all eight shared FAQs, giving
  13 answers per hub. The shared FAQ component preserves that order on mobile and
  desktop. The archive schema covers the same answers as its visible list.
- Neighborhood description pass one populated all 87 original canonical rows
  from WordPress. Pass two rewrote 86 descriptions with exact readback. Arroyo
  Vista's description is now empty pending identification of the community; its
  name, publication and photo remain unchanged.
- Saved 12 verified project assignments to existing neighborhoods. Another 28
  projects await 25 proposed additions; 11 have documented empty exceptions and
  two membership checks remain unresolved. See [all 53 dispositions](location-project-neighborhoods.md).
  Project-to-job mappings and primary service areas remain unchanged.
- Anonymous WordPress RAW bodies were null despite available rendered HTML. The
  exporter now captures `wordpress-location-source-v2`, labels rendered HTML and
  rejects missing bodies. A new private export contains all five page bodies;
  earlier captures remain immutable historical evidence.
- Quality CI runs `verify:locations` and `verify:dynamic-routes`. The latter covers
  all six parameterized public page families, their sitemaps and the resource API.
  Route-owner validation paginates completely. Special-offer static paths and
  sitemap entries now use the same complete published inventory.

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
- Post-import total is 104 SonShine reviews: 72 manual plus 32 unchanged managed;
  92 published and 12 archived. A fresh verified-target replan returns zero
  operations and 72 review matches.

The planner's 53 generic job-enrichment-held entries are superseded by the completed
separate enrichment pipeline. Project-to-neighborhood verification is a separate
September 16 task. See [enrichment](location-enrichment.md).

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
The September 16 execution files are in `execution-2026-09-16/`, with verified
SHA-256 copy receipts. It contains immutable source inventories, exact plans, private mappings, narrow
before/after receipts, file byte/timestamp proofs and independent evidence. Abandoned
workflow patches and seed plans are withdrawn historical evidence and must not run.

Retained prior application: `prior-application-0271ec7.docker.tar.gz`, image digest
`sha256:37463c5bfb2ea184893788de6b0c3e0e03060c12bf2558a41283eed86f745b07`.
Readability was verified; recovery has not been executed.

See [September 16 execution](location-execution-20260916.md),
[release and rollback](location-release.md), [manual review authoring](location-reviews.md),
[current editorial status](location-editorial-status.md) and [verification](location-verification.md).
Before restore, compare later edits to saved after-images. Preserve private project
permissions and the SonShine-only constraint dependency. Shared-context public
ownership is updated only after website deployment verification.
