# Location project enrichment evidence

Status: authenticated discovery complete; owner mapping and enrichment remain pending.
Contract: `location-v2`.
Application base: `0271ec70f46a2b31c4eb012da28459f6a9144184`.
Last verified: 2026-09-15.
Verification source: authenticated AccuLynx read, live Directus schema and scoped
project read, existing public project snapshot, and private template readback.

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
| Verified project-to-job matches | 0 |
| Ambiguous matches identified | 0 |
| Unavailable pending owner mapping | 53 |
| Total accounted for | 53 |
| Applied project updates | 0 |

The live Directus read returned 53 distinct project records. All have WordPress
source identities. The inspected title, slug, description, body, and source
identity fields contain no explicit AccuLynx links or named job references; all
project bodies are empty. The current live schema has no job-reference field.
No existing mapping was supplied, and the owner confirmed that mappings will be
checked manually. Job matching has therefore not been attempted from similar
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
  orientation, and `job_id: null`.
- `project-enrichment-accounting-v1.json`: a per-project pending disposition,
  empty verified enrichment fields, and the required-constraint readiness flag.
- `acculynx-auth-proof.json`: sanitized access evidence and response field names.

The template contains no actual job references or customer-address fields. Both
mapping/accounting files were read back with 53 entries and checked for mode
`0600`; the enclosing migration directory is private. The unfilled template
SHA-256 is
`fc145e4a007fcc6043d6e23595fbf1337fa876b45e52abcebf09f6e8997e754e`.
The temporary directory is not a durable backup.

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

Verified ZIP, service-area, and neighborhood candidates: **0**.
Successful enrichment readback: **not performed**.
SonShine-only required job-ID/ZIP constraint: **not ready**.

The additive nullable fields can be prepared independently. Apply the required
constraint only after all required project/job/ZIP fields have been verified,
the authorized backfill succeeds, and every affected record passes readback.
This discovery performed no AccuLynx writes, Directus updates, workflow changes,
or deployments.
