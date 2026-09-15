# One-time SonShine project enrichment

Status: prepared; no project updates or required-field SQL applied.
Private artifact contract: `location-enrichment-v1`; shared contract: `location-v3`.
This is a manually initiated backfill. It adds no AccuLynx synchronization or schedule.

## Verified input and proposed changes

The owner supplied 53 manual project/job matches. Authenticated job lookups
verified every identity and postal ZIP. Existing primary areas are corroborated
and retained; every neighborhood remains unverified/null. See the narrow
[discovery evidence](location-enrichment-evidence.md).

The private `project-enrichment-plan-v1.json` contains 53 updates with no missing,
duplicate, held or conflicting mappings. Its canonical hash is
`bd575388e8a5088e768ad484aa7a0c4deae4394673af6ee12e00cec2f8e3db42`.
It is complete for reconciliation, but `readyForApply=false`: the new schema and
actual privacy permission checks have not been applied or verified. Null new-field
before-values are explicitly future placeholders. Refresh the actual administrator
inventory and replan after schema installation; never toggle these flags on this plan.

## Offline planning

Use Node 22. Inputs and outputs must be private files outside Git. The default root
is `/private/tmp/sonshine-location-migration-20260915`; it is temporary. Before
production work, move and verify artifacts in approved durable storage and set
`LOCATION_MIGRATION_PRIVATE_ROOT` to that canonical absolute directory. Roots require
0700 and files 0600; root symlinks and every Git ancestor are rejected.

```sh
fnm exec --using 22 node scripts/location-enrichment/cli.mjs \
  --inventory /private/tmp/sonshine-location-migration-20260915/project-enrichment-inventory-v1.json \
  --mappings /private/tmp/sonshine-location-migration-20260915/project-enrichment-verified-mappings-v2.json \
  --out /private/tmp/sonshine-location-migration-20260915/project-enrichment-plan-next.json
```

Planning makes no API requests. Each row requires a verified owner match, exact
authenticated job identity, ZIP and primary area, controlled evidence labels and
verification time. Job references are normalized and unique across the entire client.
Existing differing references always conflict. Existing geography changes require
separate documented verification; omitted neighborhoods preserve existing values.
An area change cannot retain an incompatible neighborhood. Partial plans cannot apply.

## Authorized apply and readback

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
a wildcard grant. No destructive rollback automation is included.

## Verification

`npm run verify:location-enrichment` passes 63 synthetic checks, including missing
and duplicate identities, tenant and neighborhood conflicts, verified corrections,
later editorial changes, interrupted-run recovery, same-plan and fresh-plan reruns,
private error suppression, public projections and configurable private storage.
Synthetic checks and authenticated discovery do not establish an applied backfill,
actual public denial, production constraints or deployed page acceptance.
