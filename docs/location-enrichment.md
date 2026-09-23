# One-time SonShine project enrichment

> Historical migration evidence. Its import commands, temporary fields and recovery paths
> describe the original release, not current operating instructions. See
> [CONTENT.md](../CONTENT.md), [DEPLOY.md](../DEPLOY.md), and
> [migration cleanup](migration-cleanup.md) for the supported system.

Status: 53 project updates and the SonShine-only required-field constraint applied and verified on 2026-09-15.
Private artifact contract: `location-enrichment-v1`; shared contract: `location-v3`.
Execution revision: `05d1f6ba6f4662a70cbcecdcf2c174a9b4fcf117`.
This is a manually initiated backfill. It adds no AccuLynx synchronization or schedule.
Application deployment remains held; the existing n8n workflow stays unchanged. This status covers enrichment only.

## Completed backfill

The owner supplied 53 manual project/job matches. Authenticated job lookups
verified every identity and postal ZIP. Existing primary areas are corroborated
and retained; every neighborhood remains unverified/null. No additional owner
mapping input is needed for these 53 projects. See the narrow
[discovery evidence](location-enrichment-evidence.md).

The applied `project-enrichment-plan-ready-01.json` has canonical hash
`7b74818c99e51db4da303bfb5a07428e335dce67904dcdc9a7627cdebc2912b2`.
It uses the fresh administrator inventory captured after schema and privacy checks.
All 53 updates exactly match the previously prepared changes, including expected
modification timestamps. Independent live readback verified every desired field,
tenant and canonical project identity. There were no missing, duplicate, held or
conflicting mappings, no primary-area changes and no neighborhood assignments.

The coordinator's repeat of the same plan matched all 53 projects and wrote nothing.
After this readback, the separately authorized required-field SQL was applied.
The validated constraint requires job ID and ZIP only for SonShine. Global field
nullability remains optional; the existing primary service area remains required.
Website-reader and anonymous access checks deny private references, including
nested and aliased requests, and exclude job ID and ZIP from wildcard responses.

The historical `project-enrichment-plan-v1.json`, hash
`bd575388e8a5088e768ad484aa7a0c4deae4394673af6ee12e00cec2f8e3db42`,
remains unapplied evidence of preparation before schema installation. Its readiness
flags were not changed; a fresh inventory and plan replaced it for execution.

## Offline planning

Use Node 22. Inputs, outputs and receipts are stored outside Git in the approved
durable root `/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15`.
Set `LOCATION_MIGRATION_PRIVATE_ROOT` to that canonical absolute directory.
Roots require 0700 and files 0600; root symlinks and every Git ancestor are rejected.
The earlier temporary directory is historical staging, not the recovery authority.

```sh
LOCATION_MIGRATION_PRIVATE_ROOT='/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15' \
  fnm exec --using 22 node scripts/location-enrichment/cli.mjs \
  --inventory '<fresh-private-inventory>' \
  --mappings '<verified-private-mappings>' \
  --out '<new-private-plan>'
```

Planning makes no API requests. UUID letter casing is normalized consistently with
database job uniqueness. Each row requires a verified owner match, exact
authenticated job identity, ZIP and primary area, controlled evidence labels and
verification time. Job references are normalized and unique across the entire client.
Existing differing references always conflict. Existing geography changes require
separate documented verification; omitted neighborhoods preserve existing values.
An area change cannot retain an incompatible neighborhood. Partial plans cannot apply.

## Procedure for an authorized run

After the coordinator verifies schema and actual public/website privacy permissions:

1. Capture a fresh complete administrator inventory with current modification state,
   private fields and canonical tenant relationships. Replan and review its exact hash.
2. Record exact authorization privately: planHash, endpointHash,
   productionApplyAuthorized, exclusiveWriter, editorialChangesPaused,
   schemaPermissionsVerified and recoveryLocationApproved. Access alone authorizes none
   of these assertions. Use only the specifically authorized Directus administrator
   token through `LOCATION_DIRECTUS_ADMIN_TOKEN` and the verified `DIRECTUS_URL`.
3. Run `cli.mjs --mode apply --plan <private-plan> --approval <private-authorization>
   --recovery-dir <approved-private-directory>`. The executor checks the full current
   inventory before any update, fsyncs narrow before-images, rereads immediately,
   writes only job_id/zip/service_area/neighborhood, and verifies every result.
4. Preserve before, after, match and complete receipts. A rerun of the same plan
   treats matching values as no-ops. Later editorial differences stop the run.
   Directus REST lacks atomic compare-and-swap; the exclusive edit window is required.
5. Only after successful complete backfill readback, apply the separately authorized
   `scripts/location-model/require-sonshine-enrichment.sql`. It rejects incomplete
   SonShine data before enforcing job/ZIP requirements for that client alone.
   The enrichment tool never executes or authorizes this SQL.

Recovery restores only the four recorded fields after comparing current values and
modification state to the saved after-image. Later edits require reconciliation.
Keep the privacy permissions during rollback; never expose references by restoring
a wildcard grant. The now-active SonShine requirement rejects the original null
job/ZIP before-values, so any authorized full backfill rollback must explicitly
coordinate removal of that scoped constraint before restoring those fields.
No destructive rollback automation is included.

The durable root contains the applied plan, exact authorization, 53 narrow before
and 53 after receipts under `project-enrichment-apply-01`, and 53 no-op match
receipts under `project-enrichment-repeat-01`. Both runs have complete receipts.
See the [evidence record](location-enrichment-evidence.md) for SQL and privacy receipts.

## Verification

`npm run verify:location-enrichment` passes 70 synthetic checks, including missing
and duplicate identities, tenant and neighborhood conflicts, verified corrections,
later editorial changes, interrupted-run recovery, same-plan and fresh-plan reruns,
private error suppression, malformed JSON, public projections, UUID case variants
and configurable private storage that also rejects nested Git destinations.
Live verification additionally covers all 53 applied records, complete recovery
receipts, the zero-write repeat, the actual scoped database constraint and public
permission behavior. Deployment and location-page acceptance remain separate gates.
