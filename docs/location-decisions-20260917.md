# Location decisions applied — September 17, 2026

The owner confirmed the two outstanding project memberships and requested removal
of Arroyo Vista. These CMS changes are applied. Website deployment remains held.

## Applied changes

| Project | Confirmed neighborhood | Preserved primary service area |
| --- | --- | --- |
| High Oaks Trail | Saddlebag Creek Ranches | Myakka City |
| East Corktree Circle | Oak Hollow | Port Charlotte |

Both neighborhoods were created as drafts, read back, published with status-only
writes and linked to their respective projects. Their brief descriptions contain
only the confirmed project membership and existing service-area relationship.
No WordPress provenance, photos, maps or landmarks were invented. Directus assigned
its default `sort=0` to both records. The owner's confirmation resolves the prior
membership evidence gaps; no new external boundary verification is claimed.

Arroyo Vista had **zero project references** across all clients and publication
states. The configured Directus connector rejected physical deletion with
`INVALID_PAYLOAD: Delete actions are disabled.` The record was therefore archived,
which removes it from the published frontend inventory. Its original source
identity, photo and other fields remain retained. No project unlink was needed.

## Current totals and remaining decisions

- 89 neighborhood records: **88 published and one archived**.
- 53 projects: **14 assigned and 39 empty**.
- The 39 empty relations comprise 28 projects awaiting the separate 25 proposed
  additions and 11 documented exceptions. Those additions remain unapproved and
  uncreated; see the [assignment report](location-project-neighborhoods.md).

## Verification and recovery

Fresh CMS comparisons confirmed both memberships, same-client and same-area
relations, and zero pending repeat changes. Only the two intended project relation
fields and system modification timestamps changed. All other selected project
fields and the other 51 project rows are unchanged across the checked fields.
The other 86 original neighborhood rows are unchanged. Arroyo Vista
changed only its status and system modification timestamp.

A credentialed Node 22.23.2 build passed, generating 456 pages and validating 443
published route owners. The generated snapshots contain all 14 intended project
memberships, unchanged primary areas, both new neighborhoods and 88 published
neighborhoods. Arroyo Vista is absent from the snapshot and all five built location
pages. Both affected project pages were generated. No application code changed.

Narrow before-images, the exact plan, draft and final readbacks, build verification
and SHA-256 recovery-copy receipts are retained privately under
`/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15/decisions-2026-09-17/`.
Directories use 0700 and files 0600. Compare live fields with these after-images
before any restore. The September 16 independent reviews remain historical and
do not cover these subsequent writes.

No website deployment, remote Git push, WordPress change, n8n change or AccuLynx
mutation was performed. Public changes require the held website deployment.
