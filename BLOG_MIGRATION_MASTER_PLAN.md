# SonShine WordPress Blog to Directus — Master Plan

Status: execution in progress; paused at the Phase 4 Directus-credential gate described below.

Prepared: 2026-07-19

Supporting artifacts:

- `blog-topic-migration-manifest.json` — approved 108-post audit and topic assignments.
- `BLOG_MIGRATION_N8N_PLAN.md` — detailed queue/orchestrator/worker design.

## Approved outcome

- Migrate 106 WordPress posts into Directus with content preserved as-is.
- Exclude `grouper-tacos` and `lead-safe-certified` from the Directus post migration.
- Use the approved 21 flat, client-scoped `blog_topics` and each post's exact `proposed_topic_slugs`.
- Enforce a default maximum of three topics per post; the approved manifest has no candidate above three.
- Reuse the completed WordPress media migration mapping; never automatically re-import a missing asset.
- Preserve original slugs, publication and source-modified dates, rendered semantic body content, excerpt intent, SEO title/description, featured state/image, inline media, and approved authors/topics.
- Import posts as Directus drafts first. Publication, deployment, source cutover, WordPress retirement, and destructive cleanup remain distinct gates.
- Defer content freshness, consolidation, and rewriting to a later agent session.

## Authority and role boundaries

| Actor | May build/update unpublished n8n drafts and queue scaffolding | May execute/test n8n | May publish n8n | May perform final review writes |
| --- | --- | --- | --- | --- |
| n8n builder subagent | Yes, only when delegated by the primary | No | No | No |
| Primary agent | Yes; owns review and polish | Yes, only through this plan's safe progression | Yes, exact reviewed/tested migration versions only | Yes, for warranted in-scope corrections |
| Final review subagents | No; read-only inspection only | No | No | No |

The primary has explicit permission to run, test, and publish the two named n8n migration workflows. This does not authorize unrelated workflow changes, broad production-system mutation, deployment, WordPress deletion, or destructive cleanup.

The builder subagent must read `n8n.md`, the Workflow SDK reference, applicable best practices, this master plan, the detailed n8n plan, and the approved manifest before building. Every successful n8n write must be documented in `n8n.md` in the same session. The builder leaves all work unpublished and performs no execution.

## Phase 0 — completed planning baseline

- Audited all 108 sitemap posts from full body content.
- Approved the 21-topic catalog and three-topic maximum.
- Recorded 106 migration candidates and two exclusions in the versioned manifest.
- Reduced all four former four-topic assignments to three.
- Produced and primary-reviewed the detailed n8n design.
- Corrected retry accounting to three automatic claims: retry after 5 minutes, retry after 30 minutes, then terminal; separately requested manual retries are counted independently.

## Phase 1 — Directus schema and seed data

1. Read back the current schema and resolve exact collection/field names before writing.
2. Create client-scoped `blog_topics` with required client, name, slug, lifecycle state, and optional description.
3. Add the M2M `blog_posts.topics` relation and junction uniqueness protection.
4. Enforce unique topic identity per `(client, slug)` and same-client post/topic relations.
5. Add unique `blog_posts.external_id`, plus `published_at`, `source_updated_at`, and `featured`. Mark the automation-owned `external_id` and `source_updated_at` fields read-only in the Directus editor; keep `published_at`, `featured`, and ordinary content fields editorially editable.
6. Keep the legacy scalar `blog_posts.topic` during dual-read/backfill compatibility.
7. Seed and read back the exact 21 SonShine topic records.
8. Map Michael-authored WordPress posts to the existing Michael Borntreger `persons` record by exact approved identity. This is one explicit cross-client author exception.
9. Leave the 95 organization-authored candidates' `author` relation null and use the frontend `SonShine Roofing` Organization fallback.
10. Do not add separate canonical or Open Graph text fields initially. Leave focus-keyword fields empty when WordPress exposes no exact value.

Exit gate:

- Schema readback, unique constraints/guards, 21 topics, client ownership, and author mapping all match this plan.
- No blog post has been migrated and no frontend relies exclusively on the new relation yet.

## Phase 2 — frontend compatibility foundations

### Borntreger Digital

- Update `borntreger-digital-website` Directus fields/types/normalizers from scalar `topic` to relational `topics`, retaining a temporary scalar fallback.
- Use `published_at` for sorting, visible dates, SEO `publishedTime`, and structured data; retain Directus system dates only as audit/fallback values during transition.
- Render multiple topic chips rather than inventing a primary topic. Show a compact subset on cards and the complete set on detail pages.
- Seed/backfill Borntreger Digital's existing topic choices into client-scoped relation records before scalar removal.
- Update asset-generation queries if relation/date fields affect them and update `DIRECTUS_SCHEMA.md`.

### SonShine Roofing

- Add a Directus blog adapter that returns the current frontend's normalized post/card/filter shape.
- Implement relational-topic list/filter/facet reads, post detail, recent-post recommendations, API responses, and blog/image sitemap sources.
- Use a reversible source flag or equivalent dual-read boundary so WordPress remains the production fallback until cutover.
- Render author `Person` for the exact Michael relation and `Organization: SonShine Roofing` when author is null.
- Use `meta_title`, `meta_description`, slug-derived canonical paths, the Directus featured image, `published_at`, and `source_updated_at`.

Exit gate:

- Both repositories lint/build successfully against empty or pilot Directus blog results.
- Borntreger Digital remains compatible with its existing content.
- SonShine can switch between WordPress and Directus without deployment-time schema ambiguity.

## Phase 3 — delegated n8n construction

1. Spawn the n8n builder subagent when Phases 1–2 prerequisites are ready.
2. Builder creates `SRI WordPress Blog Migration Queue` with 108 post rows plus one control row and exact manifest hash/version.
3. Builder creates unpublished `SRI WordPress Blog Migration — Orchestrator` and callable `SRI WordPress Blog Migration — Post Worker` drafts.
4. Builder reuses the completed `SRI WordPress Media Migration Manifest` as read-only media identity and never reactivates the old media migration.
5. Builder includes sticky-note documentation, safe retention settings, exact folder/tags, shared Error Handler on the orchestrator only, strict worker API, leases, checkpoints, idempotency, dry-run/apply gates, and compact errors.
6. Builder validates node configurations and complete graphs while composing, reads back saved state, updates `n8n.md`, reports to the primary, and stops without execution or publication.

Primary review gate:

- Independently inspect every queue field/row count, node, connection, setting, credential binding, sticky note, manifest hash, folder/tag, retention option, and saved version.
- Merge/polish warranted changes, revalidate, and confirm the builder made no execution or publication.

## Phase 4 — primary-agent safe testing

1. Test pure transforms and classifiers with synthetic/pinned fixtures only.
2. Run all 106 bodies through local sanitizer/render checks and inventory removed markup, remaining WordPress URLs, images, headings, tables, embeds, and text/hash changes.
3. Verify ambiguous create/relation recovery with mocked responses.
4. Run `MODE=dry_run` over all 106 candidates, permitting only source/target reads and compact migration-queue checkpoints.
5. Require zero schema, source, topic, author, media, HTML, or target-conflict failures.
6. Review/polish the saved workflows again, then publish only the exact tested versions. Re-read active versions before apply-mode execution.

The builder subagent does not participate in execution, testing, or publication.

Current gate (2026-07-19): local source/media/render verification is green for all 106 candidates, and the primary-hardened n8n drafts remain inactive/unpublished. Four bounded manual attempts stopped before any post claim or Directus post write while runtime incompatibilities were corrected. The latest attempt passed sitemap, queue, and WordPress reconciliation, then received HTTP `403` on the first read-only Directus `clients` query through the existing n8n Directus credential. The queue remains 106 `pending` plus two `excluded`, with zero attempts. Continue only after Michael explicitly approves either repairing/rebinding that business-critical credential or creating a temporary least-privilege Directus migration identity and n8n credential; the latter is recommended. After the credential gate, restart with the same one-post dry-run pilot and retain the approved progression.

## Phase 5 — staged draft migration

Run serially and stop on any invariant failure:

1. One modern representative post.
2. Rerun the same post to prove idempotency.
3. One older legacy-markup post.
4. First reviewed batch of five.
5. Second reviewed batch of five.
6. Optional batches of ten only after both five-post batches reconcile cleanly.
7. Continue until the queue proves `verified=106`, `excluded=2`, and zero pending/running/retry/failed rows.

Every post remains `draft`. A missing media mapping is terminal/manual repair; it never triggers an automatic import. Automatic claims retry after 5 and 30 minutes, with the third failed claim terminal. Manual retries preserve attempts, IDs, hashes, and checkpoints.

## Phase 6 — end-to-end reconciliation and reversible cutover

- Prove exactly 106 unique SonShine `external_id` records and zero record for either excluded slug/source ID.
- Verify exact body hashes, zero WordPress upload-host references, media relations, topic sets, author policy, dates, featured state, excerpt, SEO fields, and draft status.
- Run both frontend builds plus route, filter/facet, recommendation, metadata, structured-data, sitemap, image, and date checks.
- Publish Directus posts, deploy frontends, revalidate caches, and switch the SonShine source only under the applicable production-change authorization.
- Keep the WordPress source and source flag available for rollback. Do not delete WordPress posts, media, queue state, or legacy scalar fields during this phase.
- Leave the two migration workflows in their exact reviewed state; any later unpublish/archive/cleanup is a separate action.

## Phase 7 — sequential independent final reviews

### Reviewer one

- Spawn one independent subagent after the operation is otherwise complete.
- Grant read-only access only and ask for an end-to-end review of Directus schema/data, 106/2 reconciliation, authors/topics/media/body fidelity, n8n queue/workflow versions and safety, both frontends, builds, sitemaps, metadata, and rollback posture.
- The primary assesses every finding, merges only evidence-backed in-scope corrections, updates documentation, and reruns affected checks.

### Reviewer two

- Spawn only after reviewer-one feedback has been resolved.
- Use a different independent subagent with read-only authority and a fresh review brief; do not ask it merely to confirm reviewer one.
- The primary again reviews every finding, merges warranted corrections, reruns the complete final suite, and records any intentionally deferred item.

Neither reviewer may mutate local files, Directus, n8n, WordPress, deployments, or other systems.

## Final completion contract

- Manifest: 108 unique audited rows, 106 migrate, two exclude, maximum three topics.
- Directus: exact approved schema, 21 SonShine topics, 106 fully verified posts, approved author mapping, no excluded post.
- Media: every referenced asset resolves through the completed verified media mapping; no duplicate import.
- n8n: queue terminal `106 verified / 2 excluded`, no active lease/failure, exact reviewed/tested published versions, documentation current.
- Frontends: Borntreger Digital consumes relational topics/new dates; SonShine consumes Directus posts with reversible fallback; builds and smoke checks pass.
- Reviews: two independent read-only reviews completed sequentially, with primary-agent disposition and re-verification after each.
- Cleanup/freshness: deferred unless separately authorized.
