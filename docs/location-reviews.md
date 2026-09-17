# Manual location reviews

Owner scope confirmed 2026-09-15: import the selected WordPress reviews once,
deduplicate them, link them to the approved location, and maintain them by hand.
The existing **SRI Latest Reviews Catcher -> Directus** workflow remains unchanged.
Workflow publication, membership seeding and a maintenance-window cutover are not
prerequisites for this import.

## Ownership and isolation

- Manually imported reviews keep `external_id` null. That field is reserved for a
  verified Google review resource identity, never a WordPress or contributor ID.
- Preserve real attribution, review text, owner reply, source link and date. The
  owner confirmed all 72 selected reviews have actual five-star ratings. One
  absent review date stays null. Two scheme-less source URLs were verified with
  an `https://` prefix; preserve the original raw URL in WordPress provenance.
- Preserve stable source keys in `wordpress_provenance`, separately from source
  facts. Approved location-page placement supplies the initial `service_area`.
  Editors own subsequent content, geography and publication.
- The unchanged Google workflow manages same-client Google reviews with a
  populated `external_id`. The existing sitewide reader uses that identity
  condition too. Static null-identity imports remain outside both.
- Confirmed matches are reused. A match with a populated Google identity requires
  explicit disposition; do not duplicate it, clear its identity, or promise manual
  publication independent of the existing workflow.
- Location snapshots select published, actual five-star, same-client, assigned
  reviews. No Google identity or feed-membership field is needed. Location content
  changes become visible through a successful deployment.

## Import and hand maintenance

1. Refresh source and target inventories. Reconcile source URL, normalized author
   and text, and attribution-only candidates. Hold ambiguous or archived matches
   for explicit review. Account for every source occurrence.
2. Prepare an exact hashed dry run using verified source facts, owner-approved
   assignments and URL corrections keyed by the unchanged source identity.
3. Apply under the already-authorized CMS edit pause, preserving narrow private
   before-images. The executor requires explicit null Google identity on existing
   and written static records. Creates start draft; updates preserve publication.
4. Verify each field and relation, then publish approved new reviews in a separate
   status-only step. Repeat the inventory/plan and verify no duplicates or updates.
5. For later manual changes, edit the Directus review and its service area directly.
   Keep unknown dates null and `external_id` null. Deploy when the location snapshot
   should include the change. Existing project testimonials stay independent.

The owner approved the CMS import and all 72 reviews. Website deployment still
requires final approval. For recovery, compare current fields and modification
state to the saved after-image before restoring migration-owned fields. Retain
private recovery records; they are not public authoring content.

The abandoned workflow patch and seed artifacts were never applied. Their private
copies are retained as withdrawn historical evidence, not executable release steps.
