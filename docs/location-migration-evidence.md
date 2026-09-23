# Location source evidence

> Historical migration evidence. Its import commands, temporary fields and recovery paths
> describe the original release, not current operating instructions. See
> [CONTENT.md](../CONTENT.md), [DEPLOY.md](../DEPLOY.md), and
> [migration cleanup](migration-cleanup.md) for the supported system.

Status: authorized migration and enrichment are verified. Current totals include
87 published neighborhoods and 72 published manual location reviews; five pages
remain draft. The existing workflow stays unchanged and website deployment is held.
The initial 43fbd45 reconciliation below is historical; see the [current handoff](location-handoff.md).
Verified: 2026-09-15. Contract: [location contract v3](location-contract.md).
Application starting revision: `0271ec70f46a2b31c4eb012da28459f6a9144184`.

Current applied totals, media inspection, commands and recovery evidence are in
[location-migration.md](location-migration.md). Execution revision:
`43fbd45f24bb4c9bd4d68f3ed19fe457d3f31a0e`. The initial inventory below remains
historical evidence; the fresh pre-apply source nodes were unchanged.

## Initial applied reconciliation

The applied plan hash is
`a86b32efe0f8066a0c3feb3ba51d6b7883918a4e401fc723b44407bd62fde710`.
Its 219 operations completed as 218 applied and one previously uploaded file
matched. All 89 newly created files received guarded source-timestamp restoration
with private before/readback/after evidence. Five page drafts, 85 neighborhood
drafts, ten sponsor junctions, seventeen directed nearby pairs and twelve coverage
junctions are installed. Parrish is a new taxonomy-only area. No review was imported.
The same original-plan live repeat matched all 219 operations with zero writes.

The fresh post-apply plan hash is
`8b4ba11f266c8762c037da95cb211ae5eced22295e8d293be181ad80ac4831d1`.
It proposes zero operations and reports zero conflicts: five page matches,
86 neighborhood matches/two held, 90 media matches/two held/one excluded,
215 relationship matches/76 held/one excluded, one taxonomy match and 72 held
reviews. Separate enrichment applied and verified all 53 projects and installed
the SonShine-only required-field constraint. The location planner's generic
53-entry enrichment hold is superseded by that separate completion evidence.

## Historical discovery inventory

The public WordPress GraphQL location connection was exhausted using three
cursor-paginated requests of two pages each. The five requested routes are the
complete published location set. A subsequent read fetched retained owner replies.

| Route suffix | Neighborhood rows | Review occurrences | Overview maps | Neighborhood assets |
| --- | ---: | ---: | ---: | ---: |
| sarasota | 22 | 15 | 1 | 22 |
| bradenton | 23 | 13 | 1 | 23 |
| lakewood-ranch | 18 | 4 | 1 | 18 |
| venice | 15 | 21 | 1 | 15 |
| north-port | 10 | 19 | 1 | 10 |
| Total | 88 | 72 | 5 | 88 |

All 88 neighborhood rows have names and ZIP lists. There are 86 distinct
normalized names. Longboat Key appears in Sarasota and Bradenton; its canonical
owner is Sarasota under the settled owner decision. Plantation initially required
verification; subsequent source/photo review distinguished Venice's Plantation
from North Port's Lakeside Plantation. Bay Isles, The Lake Club, The Concession
and DeSoto Acres were also resolved as recorded in the current migration guide.
University Park / West of Trail and Arroyo / Crestline / Village Park remain held.
Existing ZIP lists do not establish neighborhood membership.

The 93 media references have 93 distinct WordPress attachment IDs and URLs. Two
had empty source alt text. Stage 4 downloaded and decoded all 93 images, verified
their byte hashes and GMT timestamps, reviewed all five overview maps at full
size, and reviewed neighborhood photos in contact sheets. No customer-home pins
were found in the overview maps. Four neighborhood occurrences were initially
held; later review also found the DeSoto source-label conflict. Three of those five
were resolved. The current guide records the two remaining held photos and the
duplicate-owner exclusion.

Directus was read using the configured website credential and explicit minimal
fields, with page sizes of 25 and stable ID ordering. Readback totals:

| Collection | Total | Published | Archived | Requests |
| --- | ---: | ---: | ---: | ---: |
| roofing_service_areas | 13 | 13 | 0 | 1 |
| roofing_projects | 53 | 53 | 0 | 3 |
| reviews | 32 | 20 | 12 | 2 |
| sponsor_features | 10 | 10 | 0 | 1 |

The existing five canonical service-area slugs all match the requested routes.
Project associations remain present: Sarasota 18, North Port 10, Venice 8,
Bradenton 2, Lakewood Ranch 1, and 14 across the other eight areas. All ten
sponsors have compatibility geography arrays; their current slug values are
Sarasota, Bradenton, North Port, and Port Charlotte. No associations were changed.
Video inventory is owned by the coordinator/model evidence, not reread here.

## Review reconciliation

All 72 source reviews have nonempty source-link fields and retained owner replies;
71 have parseable dates and one has no date. Two source-link values are not valid
absolute URLs and require correction from source evidence. The 72 source-link
values and author/text pairs are distinct in this export.

The public GraphQL schema exposes `ownerReply`. It does not expose `rating` or
`reviewRating`; schema validation rejects both. Public introspection is disabled.
The old frontend's five-star display supplies no rating evidence.

A conservative comparison against all 32 Directus reviews found zero exact URL
or normalized author/text matches and zero attribution-only candidates. All 32
existing records have rating five. This is an initial comparison, not evidence
that a differently formatted or later-edited source record cannot match. All 72
source reviews are held pending independent rating/source verification, including
the two invalid links. No Google identity was fabricated. No existing archived
record was republished.

## Approved direct nearby lists

The owner approved these five lists during Stage 4; all seventeen directed pairs
are now applied. Each target exists as a published SonShine service area, which
confirms CMS service coverage. The lists are an editorial inference from regional
geography, not an automatic distance rule or claim of municipal adjacency.

| Page | Approved directly eligible areas |
| --- | --- |
| Sarasota | Bradenton; Lakewood Ranch; Siesta Key; Osprey |
| Bradenton | Palmetto; Lakewood Ranch; Sarasota |
| Lakewood Ranch | Bradenton; Sarasota; Myakka City |
| Venice | Nokomis; Osprey; North Port; Englewood |
| North Port | Venice; Englewood; Port Charlotte |

Geographic references checked on 2026-09-15:
[Manatee County municipal boundaries](https://www.mymanatee.org/gisits/rest/services/opendata/General/FeatureServer/1),
[Lakewood Ranch community map](https://lakewoodranch.com/wp-content/uploads/2025/12/overall_community_map.pdf),
and [Visit Sarasota County relocation guide](https://www.visitsarasota.com/sarasota-relocation-guide).
The private reviewed decisions record all seventeen approved directed pairs.

## Migration identity and ownership contract

- Match page owners by existing client and canonical slug, preserving IDs,
  taxonomy `external_id`, and `scope_key`. Store the location-post ID separately.
- Keep source attachment IDs as provenance; derive immutable canonical file IDs
  from verified byte hashes so duplicate bytes share a file. Preserve verified
  source dates and retain a private source-to-Directus mapping. Never
  replace bytes of a file referenced by an existing deployment.
- WordPress repeater rows lack independent IDs. Derive neighborhood identity from
  source post ID and normalized real name, and review duplicate/name-change cases.
  Review provenance uses source post ID plus a verified canonical source-link
  identity; invalid links remain held. Array positions are audit context only and
  must never be identity, because editors can reorder rows.
- Keep page/neighborhood/review/media/junction dispositions separate. Every source
  occurrence must end as create, update, match, conflict, held, or excluded. A
  duplicate source occurrence may map to one canonical record but remains counted.
- Migration writes only explicitly assigned migration-owned fields. Before each
  update, reread target modification state and compare a narrow before-image/hash.
  Changed editorial fields create a conflict. Reruns preserve publication,
  geography, source URL, and owner reply according to the ownership contract.
- Use unique canonical relationship pairs and source identities for reruns. Retain
  compatibility fields and WordPress originals through release verification.
- Apply readback must verify values, counts, and relationship membership; private
  recovery maps must record only the affected fields, with later-edit checks before
  rollback. Applied manifests and individual receipts remain private.

## Enrichment and release limits

The owner supplied all 53 mappings; authenticated AccuLynx reads verified their
identities, ZIPs and existing primary areas. The separately authorized enrichment
applied all 53 updates, passed independent live readback and a 53-match/no-write
repeat, then installed the validated SonShine-only required-field constraint.
Neighborhoods remain null; no neighborhood was inferred from ZIP or public copy.
See [enrichment evidence](location-enrichment-evidence.md).

Permission tightening preceded the private field. The applied model and actual
website/anonymous privacy checks are recorded in [model evidence](location-model-evidence.md).
The owner subsequently approved all 72 actual five-star reviews and resolved the
geographic/photo dispositions. Static review import and current reconciliation
are recorded in [the handoff](location-handoff.md). Workflow work was withdrawn;
the existing workflow remains unchanged. Website deployment still requires approval.

## Private evidence

Approved mode-0700 recovery directory:
`/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15`.
JSON and media files are mode 0600. All 93 copied media hashes were verified;
rebasing changed only paths in new derived artifacts and preserved the original
mapping template. The earlier `/private/tmp/sonshine-location-migration-20260915`
directory is historical staging. No raw review payloads, customer/job identifiers,
credentials or source exports are committed.

Current execution evidence includes `location-apply-02/complete.json`,
`location-apply-summary-02.json`, `location-plan-after-01.json`,
`location-plan-summary-after-01.json`, `location-repeat-summary-01.json` and their
narrow per-operation receipts.
The following hashes identify the retained initial discovery exports:

| Private file | SHA-256 |
| --- | --- |
| wordpress-locations.json | `5874734a0c7f6e82e21ad31022abb48a303d75a805629662893f541615e422fb` |
| directus-reviews.json | `8bc39534b38ebe40d336596daf8da09fc2e39589f690134b061d76d94cd290f7` |
| directus-roofing_projects.json | `c1c594a110f7bec0695cf31a5fa74fe06d1bea762fb7972c8e91bb45c9048c00` |
| directus-sponsor_features.json | `3bad46f96495b3a72a5057d83d6b58dff43d5e4ceb4e2e2015c48ae5ffd96a36` |
| directus-roofing_service_areas.json | `a77114d2b4f2acb6445326276ce981ab0386b8534ddd9751becf76e56e3c5373` |

The initial private directory also contained a sanitized aggregate inventory and
review match-candidate dispositions. Media bytes and actual migration before/after
images were created in subsequent authorized stages and retained in durable
storage. The initial Python HTTPS attempt failed local CA validation; Node's
verified TLS requests succeeded. Certificate verification was never disabled.
