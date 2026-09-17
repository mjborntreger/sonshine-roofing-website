# September 17 integrated location release

The owner approved the 25 researched neighborhood additions before launch and
instructed execution of the finalized merge/release plan. This record separates
candidate checks from the completed production verification below.

## Candidate and CMS prerequisites

The integration combines `feat/directus-location-hubs` at
`da4b93cc6b826822d05586c0b8c549e88c8ee3a9` and the dependency update from PR #28 at
`9b0ba5bd3e478e3a351aacf45a7a70ecda5638ab`, preserving both histories. Runtime
validation initially used integration commit `e951bc903391777405542b112b49b59b0607d674`,
tree `292ad3197b1bc1a393530f30f165ce9c87ae58ff`. GitHub then exposed two issues:
a potentially polynomial route-file regular expression and a macOS-only test
temporary path. Commits `96450ce` and `8d879b1` replace the regex with linear
normalization/suffix checks and use a canonical platform temporary directory.
The corrected runtime at `8d879b1fedd1aca8225fb3fd66ca88a8d23f5fce` passed a fresh
credentialed build with identical snapshots. The prior production/rollback source
is `0271ec7`.

All 25 approved neighborhoods were created as drafts, read back, then published
with status-only writes. The exact 28 researched project relations were guarded
against current state before assignment and read back afterward. New records
contain the approved name, slug and existing primary service area; optional
description, landmarks, image and map are null. No WordPress provenance was added.

| Verified CMS result | Count |
| --- | ---: |
| Neighborhoods | 114 |
| Published neighborhoods | 113 |
| Archived neighborhoods (Arroyo Vista) | 1 |
| Published projects | 53 |
| Projects with a neighborhood | 42 |
| Documented empty exceptions | 11 |
| Pending operations when replanned | 0 |

The prior 89 neighborhood records and 14 assignments were preserved. Only the
28 intended project neighborhood relations changed; primary areas and other
project fields remain intact. No n8n, WordPress or AccuLynx writes were performed.
The [assignment report](location-project-neighborhoods.md) identifies every
public project disposition without private job/address data.

## Completed candidate validation

- Fresh `npm ci` and all 24 Quality workflow commands passed on Node 22.23.2.
- A credentialed production-configured build passed: 456 generated pages,
  443 validated published route owners, 53 projects, 79 videos and 333 gallery
  images. The location snapshot contains five published hubs, 113 neighborhoods,
  70 FAQs and the matching project snapshot digest.
- A 56-route acceptance check passed: all five hubs, all 28 affected projects,
  canonical/FAQ schema agreement, archived-record exclusion, location/image/
  project/video sitemaps, taxonomy-only and unknown 404s, legacy redirects,
  representative shared routes and noindex metadata.
- Chrome visual checks covered all five hubs at mobile width 390 and desktop
  widths 1440 or greater, with no horizontal overflow. All 13 FAQ answers per
  hub expand correctly. New text-only neighborhood cards show their project
  links and coexist with described maps/images. Mobile navigation, FAQ search
  (70 total; five Bradenton results), project filtering (53 total; 18 Sarasota),
  reset controls and project-video playback were exercised.
- Live anonymous and website-reader probes denied direct, nested and aliased
  private project job/ZIP access; wildcard reads excluded those fields.
- A scan of 3,057 generated/public artifacts found no website token or serialized
  private project job/ZIP fields. Generated output and environment files remain
  ignored and excluded from Git.
- A separate reviewer assessed the combined runtime diff and found no actionable
  issues in publication/tenant isolation, FAQ selection/schema, snapshots,
  geography, sanitizers, private-field projection, dependency compatibility and
  preserved lead/truck-sale/homepage/About boundaries.
- The reviewer also checked the final three-file CI repair without findings.
  The revalidation suite now covers repeated 100,000-delimiter inputs, route-file
  suffixes and atomic endpoint rejection. The corrected enrichment verifier
  passes all 70 synthetic guards while preserving symlink-root rejection.

Normalized snapshot SHA-256 digests:

```text
projects: 32d6bc70a4ca5439a6f6abbe63e1decde7003e017e9945dac41bf5b769e19ff3
locations: 4e04f7c576bca44cc717863cabaddc7a541f282a02e6c2f1a399a2d967755e16
```

The local environment lacks production lead-delivery secrets and analytics IDs;
their configured key names were verified in Coolify without reading values.
Local validation does not claim a real lead submission or analytics delivery.
The repository's synthetic input/body/consent contracts passed. No real lead was
submitted. The reviewer performed source review; build/browser/CMS evidence above
was collected separately.

## Recovery and production verification

Narrow before-images, exact plans and readback receipts are retained with private
permissions under the established recovery root's `release-2026-09-17` directory.
The after/readback receipt SHA-256 is
`ff1fd52a82aaa7c1c7f74e6caef42fd3016531551490528b233e3b54df145d31`.
The retained prior application image passed gzip integrity verification; see
[recovery instructions](location-release.md#rollback). Recovery has not been run.

### Production verification

[PR #29](https://github.com/mjborntreger/sonshine-roofing-website/pull/29)
merged at 21:16:59 UTC on September 17 as
`4967397d6b80463b102b3bc36c5cf0438de781c7`. Both original source tips are ancestors
of main; GitHub automatically marked PR #28 merged. Final-head Quality and both
CodeQL languages passed, with the aggregate CodeQL result successful. Main-push
Quality and CodeQL also passed. Coolify's enabled main webhook produced deployment
`kzswb6saiqcpn8futr0gfrv6`, finished at 21:21:07 UTC. The exact release container
reports healthy.

Public acceptance passed all 56 routes. Desktop and mobile browser checks
confirmed new cards, maps/images, 13 hub FAQ answers, navigation, 53-project
filter/reset behavior and video playback with a canonical share URL. No real lead
submission was made. The deployed snapshots contain 53 projects, 79 videos, 42
neighborhood assignments, 11 empty exceptions, 113 published neighborhoods, five
pages and 70 FAQs. Their internal digest relationship matches and neither contains
private job/ZIP fields.

Production normalized SHA-256 digests:

```text
projects: d12f353fe9005301c4bb2339938c64afd442f2bc486338cfe158c46c3c4ad56d
locations: 2fa4263ddbba5343b59dfe9b98643ad85531a174dd121e45178ea97ea502a3ea
```

Compared field by field with the local build, production differs only in 79
YouTube upload dates populated by its configured API key and the resulting
project digest referenced by locations. All other fields match. Directus is now
the public location source. WordPress media dependencies and recovery originals
remain; host retirement is outside this release. Source branches/worktrees and
private recovery material are retained.
