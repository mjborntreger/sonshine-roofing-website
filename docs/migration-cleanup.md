# WordPress migration cleanup

Completed schema rollout, September 23, 2026. The owner accepted the September 22
VPS backups as the recovery point. No extra local recovery archive is created.
Both compatible frontends were released before schema removal; both credentialed
builds passed against the reduced schema. Current release and access status are
recorded in shared operational context.

Retire dedicated WP IDs/source dates across the imported collections, unused project
body and legacy project YouTube URL, review WP provenance, two WP-only file metadata
objects, temporary blog migration access, four retired n8n tables and ten archived
migration/image workflows. Retained setup/invariant tooling must not recreate them.
One-time timestamp/enrichment helpers and package commands are removed.

Preserve content, publication dates, relations, IDs/slugs, scoped constraints, media
bytes, rights/attribution, append-only processing/review history, working video aliases,
Worker redirect maps and current image/Google-review automation. Google review
`external_id` and source timestamps remain operational fields. Keep the suspended
migration author identity for historical attribution. Project keywords are optional
in both editor and build, with consistency checks when supplied.

The rollout is additive dates/permissions first, then both frontends, then destructive
schema/n8n cleanup, final rebuild/readback, and exact local artifact deletion after
retaining [media provenance](media-provenance.md) and the Worker's compact map evidence.
The supported n8n API removed four retired tables (409 rows) and ten archived
workflows with their ten history versions on September 23. Final readback: nine
tables, 22 archived workflows, and unchanged 44 non-archived / 40 active workflows.
Saved and published retained definitions matched their pre-deletion hashes. The
private sandbox was excluded from graph inspection and left untouched.

Final Directus readback confirms all 22 approved fields and their import-only
indexes/check are absent. The video guard retains its ordinary URL/client rules.
Retained row digests across 16 content/junction collections matched before and
after removal. Only the approved metadata keys changed on 365 files: 359
`content_migration` objects and six `migration_source` objects. Other file values,
metadata, and all 179 editorial records/dates were unchanged in the same transaction.
The temporary policy, its nine permissions and one assignment were removed;
the suspended author identity and its 106 blog creation attributions remain.

The six original Mac folders, four completed plans and 17 subsequently approved
local recovery/scratch folders were deleted after durable evidence consolidation.
Current repositories, active configuration, media and Worker maps remain.

Historic migration reports are labeled evidence; current operation belongs in
CONTENT, DEPLOY, location authoring and the canonical model SQL.
