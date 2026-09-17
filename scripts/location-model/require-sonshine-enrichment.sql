-- SEPARATE POST-BACKFILL ACTION. Do not run before complete, verified enrichment.
-- Require separately reviewed private backfill evidence and recovery mappings.
-- The actual CHECK captures the verified client ID internally; no IDs enter Git.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
LOCK TABLE public.roofing_projects IN SHARE ROW EXCLUSIVE MODE;
DO $backfill$
DECLARE target_client uuid;
BEGIN
  SELECT id INTO STRICT target_client FROM public.clients WHERE slug='sonshine-roofing';
  IF NOT EXISTS (SELECT 1 FROM public.roofing_projects WHERE client=target_client)
    OR EXISTS (SELECT 1 FROM public.roofing_projects WHERE client=target_client AND ((job_id IS NULL OR job_id='' OR job_id ~ '^[[:space:]]|[[:space:]]$') OR zip IS NULL OR zip !~ '^[0-9]{5}(-[0-9]{4})?$')) THEN
    RAISE EXCEPTION 'SonShine enrichment is incomplete; do not enable required fields';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.roofing_projects'::regclass AND conname='location_sonshine_project_enrichment') THEN
    EXECUTE format('ALTER TABLE public.roofing_projects ADD CONSTRAINT location_sonshine_project_enrichment CHECK (client<>%L::uuid OR (job_id IS NOT NULL AND job_id<>'''' AND job_id !~ ''^[[:space:]]|[[:space:]]$'' AND zip IS NOT NULL AND zip ~ ''^[0-9]{5}(-[0-9]{4})?$''))',target_client);
  END IF;
END;
$backfill$;
-- Global field nullability stays optional so unrelated clients are unaffected.
COMMIT;
