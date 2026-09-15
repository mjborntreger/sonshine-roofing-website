# Location model permissions and application gates

Current schema artifact: `location-model-v5`; deployment format `location-v3`;
starting application `0271ec7`. Integrity SQL: `location-invariants-v4`.
These local artifacts remove the abandoned review feed-membership requirements.
The preceding model-v4/invariants-v3 were applied and verified on 2026-09-15;
the owner separately approved removal of their unused live feed fields and CHECK,
and cleanup/readback completed on 2026-09-15. All project privacy, tenant, provenance and enrichment
constraints remain required. Location reviews now use a static import followed by
manual editorial maintenance; no workflow changes are part of this release.
Application deployment remains held.

## Recorded application

- Permission tightening changed one project reader grant before private fields
  were created. The additive schema applied 49 actions; final `--verify-only`
  reported zero remaining actions.
- Reader extensions applied eleven changes: seven updates and four creates.
  Administrative inspection established the intended policy ownership before use.
- Transactional invariant SQL and read-only verification passed. All 53 project
  enrichments were independently read back before the separately authorized
  SonShine-only job-ID/ZIP requirement was applied and validated.
- Actual website-reader and anonymous direct, nested, aliased and wildcard probes
  passed before and after backfill. These checks establish the current reader/public
  boundary. The existing Google review synchronization remains unchanged.

Private receipts are under
`/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15`, including the
schema, tighten/extend and before/after-backfill privacy result files listed in
[model evidence](location-model-evidence.md). The procedure below remains the
required order for any subsequent authorized run.

## Verified removal of unused review membership

Read-only inspection on 2026-09-15 found both abandoned columns present. All 49
review records across the shared CMS had `latest_feed_member=false` and
`latest_feed_order=null`. One explicit permission field list references them;
three existing wildcard review grants require no field-list mutation. No Directus
relations depend on either field. This is a global column-usage count, separate
from the 32-record SonShine reconciliation baseline.

The owner explicitly approved deletion of these two fields, the named CHECK and
associated permission entries after automatic approval review required a more
specific authorization. SQL dependency inspection found only expected defaults and
the CHECK. The coordinator removed exactly one permission field-list subset, one
CHECK and two columns through guarded execution, retaining all before-images.

Independent live verification confirms both Directus metadata and physical columns
are absent; the complete permission scope differs only by the two removed fields.
Model-v5 returns zero actions, SQL-v4 verification passes, the SonShine enrichment
requirement remains true, and actual direct/nested/aliased project job/ZIP denial
still passes. Existing 32 managed reviews and the active n8n workflow are unchanged.

Private preparation and receipts: `manual-review-schema-preparation-01/`,
`manual-review-schema-cleanup-01/`, and
`manual-review-schema-independent-verification-01.json` in the approved root.
Independent receipt SHA-256:
`d323e53b62c91f158c7283bf1a24688f004a5d93f79bb2b8643444d7e55be391`.
Preserve saved field definitions for guarded recovery. No workflow change occurred.

## Permission-first sequence

1. An authorized administrator resolves the website reader's direct and inherited
   role/policy assignments and every public read policy. Inspect all effective
   grants: Directus combines policies additively. A new restrictive grant cannot
   cancel an existing wildcard. Store the exact reviewed policy/client IDs only
   in a private mode-0600 JSON configuration outside Git.
2. Run `scripts/location-model/permissions.mjs --phase tighten
   --approved-policy-config <private-file>` as a dry run. Its configuration has
   `policyIds` (all reviewed effective read policies) and `clientId`.
   Tightening replaces project wildcard fields with the existing public allowlist,
   excluding job_id and ZIP, and preserves the prior row filters. It does not add
   a missing grant or introduce new columns. Existing narrow grants keep only
   their already allowed public fields; unavailable or empty scopes require review.
   Policies shared by other websites
   must retain their row scopes and compatible existing public fields.
3. After exact approval, repeat with `--apply --recovery-dir <private-directory>`.
   The tool requires `LOCATION_DIRECTUS_ADMIN_TOKEN`, `LOCATION_WEBSITE_TOKEN`
   and `DIRECTUS_URL`. Tokens are environment inputs and are never printed.
   Each update rereads its before-state, refuses intervening changes, saves a
   private before-image, applies, rereads, then saves a separate after-image.
   A unique mode-0700 directory prevents subsequent runs overwriting recovery.
   Recovery paths are resolved through symlinks and must remain outside every Git
   worktree, including the repository root itself.
4. Verify effective project field access for the actual website reader. Public
   permissions must explicitly deny private fields or deny project access.
   `scripts/setup-location-schema.mjs --apply` repeats this prerequisite before
   adding any fields. If anonymous effective permissions cannot be read, it
   requires anonymous project reads to return 403. Any unresolved policy is a
   blocker for adding job_id.
5. Apply the reviewed additive `scripts/setup-location-schema.mjs` plan, then
   `docs/location-model-invariants.sql`. Both require exact external-action
   authorization. The schema command defaults to dry-run; `--verify-only` refuses
   missing fields and conflicting required types/defaults/relations. SQL changes
   are transactional and do not fix conflicting editorial records automatically.
6. Prepare `--phase extend` after the schema exists. This phase adds explicit
   public projections and tenant/publication predicates for the location model.
   The private configuration must additionally contain
   `policyScopeVerifiedExclusive: true`, based on actual administrator inspection
   of all assignments. Do not assert this for shared Client Access policies.
   Resolve a dedicated SonShine reader policy first when necessary, under separate
   exact authorization, preserving unrelated clients. Existing stricter filters
   remain in force. Repeat dry-run, review, apply and effective readback.
7. Run the read-only SQL verification and `--phase probe`. The probe requires the
   real website token and checks direct, nested and aliased job-field requests,
   plus wildcard responses, for authenticated and anonymous readers. A probe
   failure blocks enrichment/import/release. Missing access is not a passing test.

The CLI phase commands all run through Node 22. `--phase probe` is read-only;
`--apply`, schema apply, invariant SQL and the enrichment SQL perform writes.
Admin tokens are not website build tokens. The configured reader cannot perform
schema/permission writes, so its successful content read does not authorize or
provide the administrative steps above.

## Projections and ownership

`schema.mjs` is the explicit field contract. Public project grants exclude job_id
and ZIP; frontend selection can read ID, required primary area and nullable
neighborhood. Nested `videos.project` requests obey the same project policy.
The video reader's existing published/client restriction remains unchanged, so a
published standalone video or one with an unpublished project stays independent.

Service-area readers include published taxonomy records regardless of page_status;
only the deployed normalization publishes page routes. Neighborhoods and content
must be published and in the same client. Section records have no status field.
Neighborhood `image` is an optional described photograph, separate from optional
`coverage_map`. Both have explicit public field grants and independent file
relations; deleting a photo clears only that optional image reference. Source
neighborhood photos must never be imported or presented as coverage maps.
Nearby junction readers require approved=true and both published taxonomy ends.
Unassigned sponsors/reviews may remain available to their authorized sitewide
consumers; location selection never treats them as geographic backfill.

Editorial policies must allow local assignments and editorial publication while
keeping migration provenance out of routine editorial writes. The static import
preserves verified attribution, dates, rating, source URL and available reply;
new static records have no fabricated Google `external_id`. Published static
records can be location matches without that identifier. The sitewide feed keeps
its existing Google-identity requirement and publication behavior. Reused records
that already have a verified Google identity retain their existing automation
ownership; assigning an area does not transfer their publication or retention to
manual control. Admin/migration access is separate and private project references
remain server-side.

The reader/public policy ownership and effective denial boundary were verified
for the applied model. The prepared v5 public review projection excludes the
unused feed fields and private WordPress provenance. Do not grant new workflow
permissions, seed membership, or change the existing synchronization policy.

## Database integrity

Composite foreign keys enforce client/area/neighborhood consistency in both
write directions. Primary project service_area remains SQL NOT NULL. A populated
job_id is trimmed and unique within its client; whitespace-only values, including
tabs/newlines, become NULL. UUID references normalize to lowercase; an additional
unique index prevents case variants from representing the same job twice. Existing
noncanonical/conflicting rows block invariant installation rather than being
silently rewritten. ZIP is
trimmed and checked only when populated. Junction pairs are unique, nearby links
are directed and cannot self-link, and row locks plus reassignment guards protect
junction tenant identities. Existing associated canonical records use RESTRICT;
optional map deletion may clear the map without deleting its owner.

FAQ page/service/area scopes are exclusive. Deleting an assigned service cannot
silently convert its FAQ into a global FAQ. Navigation resolves through its menu's
client and rejects foreign-client targets and mismatched parent menus. The SQL
preflight rejects preexisting conflicts without rewriting editorial timestamps.

After complete verified enrichment, the separately approved
`scripts/location-model/require-sonshine-enrichment.sql` was applied. It first
rejects missing/invalid SonShine values, then creates a validated
CHECK scoped to the actual SonShine client ID. It captures the ID inside the
database without recording it in Git. This protects the rule even if the client
slug later changes; unrelated clients keep optional fields. Neighborhood remains
nullable. UI-required flags are not used as the enforcement boundary.

## Recovery

Retain additive collections/fields and original WordPress/legacy compatibility
fields during application rollback. Do not drop source records or detach canonical
associations. The permission tool's private before/after files contain exact narrow
recovery state. Compare current policy state with the saved afterDigest before
restoring anything; later edits require review.

Never restore a former wildcard project permission while job_id exists, even when
rolling back the application. Preserve the safe explicit projection and deny job_id
and ZIP. Tight reader permissions are compatible with the prior project's explicit
queries. A rollback of tenant-scope extensions must be individually reviewed and
must keep the private-field restriction. The schema and privacy boundary should
normally remain installed while the coordinator restores the application and
narrow content before-images. The unchanged review workflow has no release or
rollback step in this migration.

The active SonShine requirement rejects the original null job/ZIP before-values.
Any authorized full enrichment rollback must coordinate removal of that scoped
constraint before restoring those values, while keeping private-field denial.

## Local verification

- `node scripts/verify-location-model.mjs`: synthetic API apply gate, dry run,
  idempotency, schema drift, required primary area, policy projections/scopes,
  before/after recovery and concurrent-edit refusal.
- `LOCATION_PGLITE_PATH=<temporary-install>/node_modules/@electric-sql/pglite/dist/index.js
  node scripts/location-model/verify-sql.mjs`: a fresh in-memory PostgreSQL engine
  executes the actual SQL twice and verifies 34 rejected mutations, normalization,
  local association retention, FAQ deletion/scope, junctions, navigation,
  static review null identity, manual publication, tenant/provenance integrity and
  the eventual scoped requirement. No real CMS is connected.
- `docs/verify-location-model.sql`: explicitly READ ONLY. It validates required
  constraints/indexes/triggers and returns whether the separate enrichment
  requirement is installed. False is a release blocker.

Local engine verification remains separate from the completed production
constraint, privacy and enrichment readback. Deployed output and actual-page
acceptance remain part of the held application release.
