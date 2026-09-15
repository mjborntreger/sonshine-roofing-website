# Location project enrichment evidence

Status: all 53 owner mappings and authenticated job lookups verified; backfill unapplied.
Contract: `location-v3`.
Application base: `0271ec70f46a2b31c4eb012da28459f6a9144184`.
Last verified: 2026-09-15.
Verification source: authenticated AccuLynx read, live Directus schema and scoped
project read, completed owner mapping, 53 authenticated job-specific lookups,
and private artifact readback. Discovery application revision:
`429bdf2e70f32a66c5b92a650d82c3a358922b86`.

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
| Verified ZIP candidates | 53 |
| Existing primary areas corroborated and preserved | 53 |
| Neighborhoods unverified and left null | 53 |
| Total accounted for | 53 |
| Applied project updates | 0 |

The live Directus read returned 53 distinct project records. All have WordPress
source identities. The inspected title, slug, description, body, and source
identity fields contain no explicit AccuLynx links or named job references; all
project bodies are empty. The current live schema has no job-reference field.
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

The private directory is
`/private/tmp/sonshine-location-migration-20260915`.
It contains:

- `project-job-mapping-template-v1.json`: 53 entries with canonical Directus
  project ID, public project URL/title, current canonical service area for
  orientation, and owner-filled job references. Its original template metadata is
  retained because the owner was instructed to change only job_id.
- `project-enrichment-accounting-v1.json`: a per-project pending disposition,
  empty verified enrichment fields, and the required-constraint readiness flag.
- `acculynx-auth-proof.json`: sanitized access evidence and response field names.

The completed template now contains private job references and must stay outside
Git and public artifacts. Mapping/accounting files were checked for mode
`0600`; the enclosing migration directory is private. The unfilled template
SHA-256 is
`fc145e4a007fcc6043d6e23595fbf1337fa876b45e52abcebf09f6e8997e754e`.
That hash identifies the original unfilled template, not the owner's completed file.
The temporary directory is not a durable backup.

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
checking the existing `/project/<slug>` URLs. The planner inventory is explicitly
schema-unready and privacy-unverified. Its null new fields describe the future
nullable baseline; they are not a claim that nonexistent live fields were read.
Fresh administrator inventory and permission probes are required before apply.
Verified-mappings v2 replaces prose labels with the planner's controlled evidence
labels; it preserves all verified values and supersedes v1. The separate
`project-enrichment-plan-v1.json` proposes 53 updates, zero held/conflicted matches,
with canonical plan hash
`bd575388e8a5088e768ad484aa7a0c4deae4394673af6ee12e00cec2f8e3db42`.
Its complete input reconciliation is not permission to apply: schema and privacy
gates remain false. See [one-time enrichment](location-enrichment.md).

### Filling the template

1. Open the public project URL and confirm the corresponding AccuLynx job.
2. Change only that entry's `job_id`. Use the API job UUID from an unambiguous
   job reference; do not substitute the displayed job number. A URL alone will
   not count as verified until its identifier succeeds at the authenticated
   job-specific endpoint and the project match is confirmed.
3. Leave uncertain entries `null`. Keep project IDs, URLs, titles, and current
   area fields unchanged.
4. Save and return the completed file privately. Do not put it in Git, a public
   report, or a website content snapshot.

## Next verification gate

Every supplied job reference must be checked with AccuLynx, including duplicate
job IDs across project posts. Customer addresses are private lookup inputs for
verifying ZIP and the canonical primary service area. Neighborhood assignments
require independent geographic evidence; ZIP alone is insufficient. A
neighborhood may remain null and must stay hidden when absent.

Verified ZIP candidates: **53**. Preserved primary-area candidates: **53**.
Verified neighborhood candidates: **0**.
Successful enrichment readback: **not performed**.
SonShine-only required job-ID/ZIP constraint: **prepared, not yet eligible to apply**.

The additive nullable fields can be prepared independently. Apply the required
constraint only after all required project/job/ZIP fields have been verified,
the authorized backfill succeeds, and every affected record passes readback.
This discovery performed no AccuLynx writes, Directus updates, workflow changes,
or deployments.
