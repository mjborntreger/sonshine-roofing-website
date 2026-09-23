# Location project enrichment evidence

> Historical migration evidence. Its import commands, temporary fields and recovery paths
> describe the original release, not current operating instructions. See
> [CONTENT.md](../CONTENT.md), [DEPLOY.md](../DEPLOY.md), and
> [migration cleanup](migration-cleanup.md) for the supported system.

Status: all 53 projects enriched and independently verified; SonShine-only required job-ID/ZIP constraint applied and validated.
Contract: `location-v3`.
Application base: `0271ec70f46a2b31c4eb012da28459f6a9144184`.
Last verified: 2026-09-15.
Verification source: authenticated AccuLynx read, live Directus schema and scoped
project read, completed owner mapping, 53 authenticated job-specific lookups,
private recovery receipts, post-backfill SQL verification and actual website/anonymous
permission probes. Discovery application revision:
`429bdf2e70f32a66c5b92a650d82c3a358922b86`; execution revision:
`05d1f6ba6f4662a70cbcecdcf2c174a9b4fcf117`.
This evidence does not mark the location migration deployed; website deployment
remains held. The owner withdrew workflow work, so existing n8n remains unchanged.

## Authenticated access

A user-authorized read of the documented AccuLynx jobs endpoint returned HTTP 200
with one assigned job. The request used `pageSize=1`, no expanded contacts, and
descending modification order. The response demonstrated access and the expected
job/address field structure. No individual job values or customer payloads were
retained from this probe. Authentication material was neither logged nor copied.

AccuLynx documents a bearer credential for every request, a paginated jobs list,
and a job-specific lookup. Its external-reference lookup requires a known source
plus a project or job identifier. A WordPress post identifier alone is not an
AccuLynx mapping. Sources: [authentication](https://apidocs.acculynx.com/docs/authentication),
[jobs](https://apidocs.acculynx.com/reference/getjobs),
[job lookup](https://apidocs.acculynx.com/reference/getjob-1), and
[external references](https://apidocs.acculynx.com/reference/getjobexternalreferences).

## Reconciliation

| Disposition | Projects |
| --- | ---: |
| Verified project-to-job matches | 53 |
| Ambiguous matches identified | 0 |
| Unavailable mappings | 0 |
| Duplicate or missing job references | 0 |
| Verified and populated ZIPs | 53 |
| Existing primary areas corroborated and preserved | 53 |
| Neighborhoods unverified and left null | 53 |
| Total accounted for | 53 |
| Applied project updates | 53 |
| Independently verified live results | 53 |
| Same-plan repeat matches / additional writes | 53 / 0 |

The initial Directus discovery returned 53 distinct project records. All have WordPress
source identities. The inspected title, slug, description, body, and source
identity fields contain no explicit AccuLynx links or named job references; all
project bodies were empty. The schema did not yet have a job-reference field at
discovery; that private field is now installed, populated and access-restricted.
The owner completed all 53 mappings manually. Every supplied job ID is unique,
has the expected UUID form, and returned HTTP 200 with the exact same identity.
The existing primary area agrees with each job's postal city, Florida state and
US country fields. This corroborates and preserves the existing editorial relation;
it does not establish municipal boundaries. No matching was inferred from similar
names, street names, dates, ZIP codes, or geographic proximity.

A narrow WordPress source-metadata check did not expose project records through
the currently available anonymous REST type listing, and the project GraphQL
introspection request returned an error. No historical project export was found
in the approved temporary location. This limits legacy-reference discovery; it
does not change the owner's mapping step.

## Private mapping template

The approved durable private directory is
`/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15`.
It contains:

- `project-job-mapping-template-v1.json`: 53 entries with canonical Directus
  project ID, public project URL/title, current canonical service area for
  orientation, and owner-filled job references. Its original template metadata is
  retained because the owner was instructed to change only job_id.
- `project-enrichment-accounting-v1.json`: historical discovery accounting with
  the original pending dispositions; the applied plan and receipts supersede it.
- `acculynx-auth-proof.json`: sanitized access evidence and response field names.

The completed template now contains private job references and must stay outside
Git and public artifacts. Mapping/accounting files were checked for mode
`0600`; the enclosing migration directory is private. The unfilled template
SHA-256 is
`fc145e4a007fcc6043d6e23595fbf1337fa876b45e52abcebf09f6e8997e754e`.
That hash identifies the original unfilled template, not the owner's completed file.
The original temporary staging directory is not the recovery authority. All recovery
references below use the approved durable directory.

## Completed discovery artifacts

All files below remain in the same private directory with mode 0600. The directory
is mode 0700. No street addresses, contacts, full job responses or credentials were
retained. The owner's completed template was not altered.

| Artifact | SHA-256 |
| --- | --- |
| project-enrichment-discovery-v3.json | 7fc3b19eb49c5d905b9037ea7d3d9c0aad87d2afde257cf191ac5e123c0f4a25 |
| project-enrichment-before-v2.json | 16abf862158c721ac65b4f70f6b69d03cff4ceb5c4e77747c59022096a9b550d |
| project-enrichment-inventory-v1.json | 9ea63230fcac24bbb22415a2664e228bce9e1f174c984aaa74f329b07b242155 |
| project-enrichment-verified-mappings-v2.json | 8db6698c5d04f884786011b4b4638fbcbebfc5626fa74e382548b432eefa6c28 |

Discovery v3 supersedes v2, correcting structured state/country parsing and
checking the existing `/project/<slug>` URLs. The historical planner inventory is explicitly
schema-unready and privacy-unverified. Its null new fields describe the future
nullable baseline; they are not a claim that nonexistent live fields were read.
Fresh administrator inventory and permission probes were captured before apply.
Verified-mappings v2 replaces prose labels with the planner's controlled evidence
labels; it preserves all verified values and supersedes v1. The separate
`project-enrichment-plan-v1.json` proposed 53 updates, zero held/conflicted matches,
with canonical plan hash
`bd575388e8a5088e768ad484aa7a0c4deae4394673af6ee12e00cec2f8e3db42`.
Its schema and privacy gates remain false as historical preparation evidence.
The fresh plan below superseded it for the authorized execution; no readiness
flag was manually changed. See [one-time enrichment](location-enrichment.md).

### Completed owner-mapping procedure

The owner completed all 53 entries using the existing project URLs and exact
AccuLynx job UUIDs. Authenticated job-specific reads verified each supplied identity.
Independent review matched the completed template hash to the discovery record
and every proposed job/ZIP/area value to the verified mappings. No further owner
mapping input is needed for these 53 projects. Keep the completed template private.

## Applied plan and readback

`project-enrichment-inventory-ready-01.json` captured the complete current project
and canonical-area inventory at 2026-09-15T19:33:10.018Z, after schema/privacy
verification. `project-enrichment-plan-ready-01.json` has canonical hash
`7b74818c99e51db4da303bfb5a07428e335dce67904dcdc9a7627cdebc2912b2`.
All 53 operations, including expected modification timestamps, exactly match the
historical prepared plan. The source mappings cover 53 distinct projects and 53 unique jobs; the target
inventory contains the same 53 projects, with zero missing, held or conflicted mappings.

Independent live readback at 2026-09-15T19:39:29.167Z verified all 53 desired
job/ZIP/service-area/neighborhood values and tenant identities. Primary service
areas did not change. All neighborhoods remain null: the discovery issue
`neighborhood_not_independently_verified` is accounted for on every project.
Customer addresses were private lookup inputs; no neighborhood was inferred from ZIP.

The durable recovery directory contains:

| Artifact | Verified result |
| --- | --- |
| `project-enrichment-apply-01/` | 53 before receipts, 53 exact after receipts and a complete receipt |
| `project-enrichment-repeat-01/` | Same-plan repeat: 53 match receipts, zero writes and a complete receipt |
| `database-enrichment-required-apply-01.json` | Authorized scoped requirement applied at 19:40:26.979Z |
| `database-model-verify-after-backfill-01.json` | Invariants v3 pass and SonShine requirement validated at 19:40:27.810Z |
| `database-enrichment-final-counts-01.json` | 53 projects, 53 populated unique jobs, 53 valid ZIPs, 53 null neighborhoods |
| `privacy-probe-after-backfill-01.json` | Website and anonymous: three direct/nested/alias denials and two wildcard checks each |

All timestamps above are UTC on 2026-09-15. Recovery directories are 0700 and
receipts are 0600. Required-SQL and verifier receipt hashes match the reviewed
repository scripts. Independent read-only inspection of the actual database CHECK
confirmed its validated binding to the canonical SonShine client: other clients
are exempt, while SonShine requires a nonblank normalized job reference and valid
ZIP. Global job-ID/ZIP columns remain nullable and the primary service area remains
required. The existing job uniqueness and UUID normalization invariants remain active.

Independent effective-permission and live request checks passed after the job
references were populated. Website and anonymous direct/nested/alias job requests
were denied; wildcard responses omitted job ID and ZIP. Six additional direct,
nested and aliased ZIP probes across both access levels were denied. Post-constraint
privacy receipts passed again at 19:40:29.894Z. No private identifiers or responses
are included in repository artifacts.

The authorized one-time backfill and its required-field gate are complete. No
unattended AccuLynx automation, AccuLynx writes, workflow publication or application
deployment was performed by this enrichment work. A rollback to null job/ZIP
before-values must coordinate the scoped requirement and compare current values
and modification state to after-receipts before restoring anything.
