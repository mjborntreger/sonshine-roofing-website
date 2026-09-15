# Location source evidence

Status: local migration candidate prepared; production migration, enrichment, and release pending.
Verified: 2026-09-15. Contract: [location contract v3](location-contract.md).
Application starting revision: `0271ec70f46a2b31c4eb012da28459f6a9144184`.

Current candidate totals, media inspection, commands, and recovery preparation are
in [location-migration.md](location-migration.md). The counts and hashes below
retain the initial Stage 1 inventory; Stage 4 artifacts are listed in that guide.

## Current inventory

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
owner is Sarasota under the settled owner decision. Plantation appears in North
Port and Venice and requires verification before merging or assigning it. Other
geographic claims need review, particularly combined labels such as University
Park / West of Trail, Bay Isles, The Lake Club, and The Concession. Existing ZIP
lists do not establish neighborhood membership.

The 93 media references have 93 distinct WordPress attachment IDs and URLs. Two
had empty source alt text. Stage 4 downloaded and decoded all 93 images, verified
their byte hashes and GMT timestamps, reviewed all five overview maps at full
size, and reviewed neighborhood photos in contact sheets. No customer-home pins
were found in the overview maps. Four conflicting neighborhood images remain
held; the current guide records the exact limits and final dispositions.

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

The owner approved these five lists during Stage 4. No relationship is written.
Each proposed target already exists as a published SonShine service area, which
confirms CMS service coverage. The lists are an editorial inference from regional
geography, not an automatic distance rule or claim of municipal adjacency.

| Page | Proposed directly eligible areas |
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

## Migration preparation contract

- Match page owners by existing client and canonical slug, preserving IDs,
  taxonomy `external_id`, and `scope_key`. Store the location-post ID separately.
- Use source attachment IDs for media identities. Hash downloaded bytes, preserve
  verified source dates, and retain a private source-to-Directus mapping. Never
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
  rollback. This document is inventory evidence, not an applied migration manifest.

## Enrichment and release limits

The owner subsequently supplied authorized authenticated AccuLynx read access.
The coordinator assigned a separate read-only enrichment discovery and private
mapping-template task. The owner confirmed project/job mappings are not yet
available and will fill them manually. All 53 projects remain pending verified
mappings; ZIP and neighborhood assignments cannot be inferred from public project
copy. The subsequent SonShine-only required-field constraint remains blocked until
successful enrichment is documented. This migration specialist queried no job or
customer records.

No production schema, record, file, workflow, or deployment writes occurred.
Permission tightening must precede adding the private job field because the
coordinator identified wildcard project access on the website-reader policy.

## Private evidence

Mode-0700 directory: `/private/tmp/sonshine-location-migration-20260915`.
Raw JSON files are mode 0600. This is temporary evidence storage; a durable approved
recovery location is required before production migration. No raw review payloads,
customer/job identifiers, credentials, or source exports are committed.

| Private file | SHA-256 |
| --- | --- |
| wordpress-locations.json | `5874734a0c7f6e82e21ad31022abb48a303d75a805629662893f541615e422fb` |
| directus-reviews.json | `8bc39534b38ebe40d336596daf8da09fc2e39589f690134b061d76d94cd290f7` |
| directus-roofing_projects.json | `c1c594a110f7bec0695cf31a5fa74fe06d1bea762fb7972c8e91bb45c9048c00` |
| directus-sponsor_features.json | `3bad46f96495b3a72a5057d83d6b58dff43d5e4ceb4e2e2015c48ae5ffd96a36` |
| directus-roofing_service_areas.json | `a77114d2b4f2acb6445326276ce981ab0386b8534ddd9751becf76e56e3c5373` |

The private directory also contains a sanitized aggregate inventory and review
match-candidate dispositions. Media bytes and migration before-images have not yet
been created. The initial Python HTTPS attempt failed local CA validation; Node's
verified TLS requests succeeded. Certificate verification was never disabled.
