# Video migration and recovery

The September 2026 migration moves the 26 published WordPress video entries and
53 project clips into independently authored Directus `videos` records. The
current library has 79 distinct videos and 27 ordinary category assignments.
The homepage clip reuses an in-scope library identity but its page placement
remains hard-coded. About and the entire truck-sale page are outside CMS scope.
Authoring and independent publication rules are in
[CONTENT.md](../CONTENT.md#publishing-videos-in-directus).

## Additive schema and access

`scripts/setup-video-schema.mjs` accepts `--dry-run` (default), `--apply`, and
`--verify-only`. It uses the task-authorized `DIRECTUS_URL` and server token from
the environment. It adds missing fields, collections, and relationships, and
stops on competing field types or relationship targets. Existing project
`youtube_url` remains present for rollback. Existing fields are not overwritten.

After reviewing and applying that additive schema, apply
[video-model-invariants.sql](video-model-invariants.sql) through the authorized
database administration path. The SQL derives the normalized YouTube identity
and scope key, preserves legacy Unicode video slugs, enforces per-client slug
and clip uniqueness, restricts each project to one video, prevents duplicate
category assignments, and rejects cross-client relationships and reassignment.
The relationship is stored only in `videos.project`; reverse editor views must
use that same relation. Parent deletion requires deliberate unlinking first.
Reserved category slugs are `roofing-project` and `other`.

Configure permissions separately before authoring:

- Editors operate only within their authorized client. Permit ordinary video
  content, status, project, and category edits; keep `external_id`,
  `source_updated_at`, `legacy_ids`, `youtube_id`, and `scope_key` outside their
  writable fields. Read-only Studio displays supplement server permissions.
- The frontend build identity needs the published client-scoped video,
  category, and assignment fields requested by the build adapter. It reads the
  raw project relationship only to derive classification, and published project
  fields for eligible public context. Unpublished project details stay private.
- The migration identity needs explicit, temporary schema/import authority.
  This guide and command availability do not grant that authority. Keep tokens
  out of source files, command output, exports, and checkpoints.

Run the rollback-only database checks in
[verify-video-model.sql](verify-video-model.sql) before importing and after any
invariant changes. Synthetic checks must leave the live content unchanged.

## Private source manifest

Capture the complete source and destination baseline before migration. Store
exports and checkpoints outside the repository; never commit raw CMS exports.
The importer consumes one JSON manifest:

```json
{
  "version": 1,
  "client": { "id": "verified-client-id", "slug": "sonshine-roofing" },
  "expectedCounts": { "wordpress": 26, "projects": 53 },
  "wordpress": [],
  "projects": []
}
```

Each WordPress row contains `databaseId`, GraphQL `id`, `slug`, `title`, UTC
`dateGmt` and `modifiedGmt`, `videoLibraryMetadata` with `youtubeUrl` and
`description`, and the complete `videoCategories.nodes` list with `name` and
`slug`. Verify cursor pagination and nested connections before writing the
manifest. Preserve unused SEO/image/source fields in the private backup.

Each project row contains the existing Directus `id`, `client`, `status`,
`slug`, `title`, `description`, `youtube_url`, `published_at`, `date_updated`,
and `source_updated_at`. It must be a currently published SonShine project.
The migration copies its current title, description, and chronology into the
independent video once. These fields are not synchronized after editorial
handoff. Legacy aliases include WordPress GraphQL IDs and `project-<slug>`.

The source manifest is frozen by checksum in its private checkpoint. A changed
manifest or destination edit stops the importer for explicit reconciliation.
Treat counts as a reviewed inventory, not permission to ignore source changes.

## Import, verify, and publish

Use Node 22 with `DIRECTUS_CLIENT_SLUG=sonshine-roofing` and the authorized
Directus environment. Supply an absolute path to the private manifest:

```bash
node scripts/migrate-wordpress-videos.mjs --source /private/path/video-source.json --dry-run
node scripts/migrate-wordpress-videos.mjs --source /private/path/video-source.json --apply
node scripts/migrate-wordpress-videos.mjs --source /private/path/video-source.json --verify-only
```

Apply creates published category vocabulary and draft videos. Ordinary category
order starts at Commercials 10, Explainers 20, In the Field 40, leaving Roofing
Projects at derived order 30. Deterministic identities and a checkpoint next
to the source manifest let interrupted creates and assignments resume without
duplicates. A repeated unchanged apply performs no CMS writes. An alternate
private checkpoint path can be supplied with `--checkpoint`.

Verification checks source mappings, independent video fields, category parity,
project baseline, compatibility aliases, and timestamps. It rejects unexpected
records, changed content, removed completed assignments, or later destination
edits before writing. This is migration tooling, not an ongoing synchronization
job. A final source re-export and comparison must reconcile added, removed,
unpublished, or edited WordPress records before release.

After verification and release authorization, transition the complete set:

```bash
node scripts/migrate-wordpress-videos.mjs --source /private/path/video-source.json --apply --publish
node scripts/migrate-wordpress-videos.mjs --source /private/path/video-source.json --verify-only --publish
```

Publication preflight verifies every record and assignment before the first
status write. Interrupted publication can resume. The database seeds initial
`date_updated` from verified source freshness and preserves it for an untouched
draft-to-published transition. Normal later Directus edits advance freshness.
Migration timestamps are never presented as original publication dates.

Run `scripts/verify-video-migration.mjs` for synthetic source, pagination,
interruption, replay, publication, and conflict tests. Also run the relevant
project/video, archive, playback, revalidation, JSON-LD, lint, typecheck, and
credentialed build checks before release. Inspect the actual packaged artifact
and compiled routes. Source-level checks alone do not verify deployment.

## Release and rollback

Publishing Directus content alone does not release website changes. Projects
and videos share one atomic `.generated/projects.json` artifact generated
during a successful build and carried in the standalone deployment. Failed
refreshes invalidate the candidate artifact; runtime reads never fall back to
WordPress or newer CMS state. Waiting or requesting revalidation does not
publish edits.

Capture the previous successful image and deployment configuration before
cutover. Check all 79 library selections, project links, overlapping filters,
legacy IDs, playback, sitemap destinations, and archive metadata after release.
YouTube embeds use the player URL in sitemap and structured data; a YouTube
watch page is not a media-file URL. See Google's
[video sitemap requirements](https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps).
The approved initial category counts are Commercials 7, Explainers 17, In the
Field 3, Roofing Projects 53, Other 0; membership counts exceed distinct totals.

If candidate validation fails, restore the prior deployment image. Retain
WordPress video records and the old project `youtube_url` for that recovery
window. Keep the new Directus rows for diagnosis. Reconcile post-cutover
editorial changes before returning authoring to WordPress; never rerun a source
import to erase later Directus work. Remove obsolete rollback fields only under
a separate, verified authorization after the retention window.
