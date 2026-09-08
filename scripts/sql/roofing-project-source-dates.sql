-- Initial migration/final source sync only, before Directus editorial handoff.
-- Directus overwrites its system timestamps during API imports. Restore the
-- verified WordPress dates after --apply, then run the importer --verify-only.
-- Do not run after normal Directus editing begins: those edits own date_updated.
BEGIN;

UPDATE public.roofing_projects AS project
SET date_created = project.published_at,
    date_updated = project.source_updated_at
FROM public.clients AS client
WHERE project.client = client.id
  AND client.slug = 'sonshine-roofing'
  AND project.external_id LIKE 'wordpress:sonshine-roofing:%';

COMMIT;
