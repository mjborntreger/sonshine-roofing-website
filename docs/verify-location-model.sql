-- READ ONLY. This file never creates fixtures, updates data, or takes write locks.
-- Run after schema/invariant apply with psql ON_ERROR_STOP=1.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '30s';
DO $verify$
DECLARE name text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='roofing_projects' AND column_name='service_area' AND is_nullable<>'NO') THEN
    RAISE EXCEPTION 'Primary project area became optional';
  END IF;
  FOREACH name IN ARRAY ARRAY[
    'location_project_area_client','location_neighborhood_area_client','location_project_neighborhood_area',
    'location_review_area_client','location_faq_area_client','location_faq_page_client','location_faq_service_client',
    'location_navigation_menu_fk','location_navigation_page_fk','location_navigation_parent_fk',
    'location_page_publication','location_neighborhood_content','location_project_reference_normalized','location_project_uuid_canonical',
    'location_review_feed_shape','location_review_provenance_array','location_faq_scope_exclusive',
    'location_navigation_area_scope','location_nearby_not_self'
  ] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public' AND c.conname=name AND c.convalidated) THEN
      RAISE EXCEPTION 'Missing validated location constraint: %',name;
    END IF;
  END LOOP;
  FOREACH name IN ARRAY ARRAY['location_projects_client_job','location_projects_client_job_uuid','location_neighborhoods_client_slug','location_pages_wordpress','location_neighborhoods_wordpress','location_sponsor_area_pair','location_nearby_area_pair','location_coverage_area_pair'] LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname=name AND indexdef LIKE 'CREATE UNIQUE INDEX%') THEN
      RAISE EXCEPTION 'Missing unique location index: %',name;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND t.tgenabled<>'D' AND NOT t.tgisinternal AND t.tgname IN ('location_project_reference_guard','location_junction_guard','location_owner_reassignment_guard','location_navigation_guard'))<>11 THEN
    RAISE EXCEPTION 'Missing or disabled location integrity trigger';
  END IF;
  IF EXISTS(SELECT 1 FROM public.sponsor_service_areas j JOIN public.sponsor_features s ON s.id=j.sponsor JOIN public.roofing_service_areas a ON a.id=j.service_area WHERE s.client IS DISTINCT FROM a.client)
    OR EXISTS(SELECT 1 FROM public.roofing_service_area_neighbors j JOIN public.roofing_service_areas a ON a.id=j.service_area JOIN public.roofing_service_areas b ON b.id=j.nearby_area WHERE a.client IS DISTINCT FROM b.client)
    OR EXISTS(SELECT 1 FROM public.service_area_section_areas j JOIN public.service_area_sections s ON s.id=j.section JOIN public.roofing_service_areas a ON a.id=j.service_area WHERE s.client IS DISTINCT FROM a.client) THEN
    RAISE EXCEPTION 'Cross-client junction exists';
  END IF;
  RAISE NOTICE 'PASS: location-invariants-v3 present; private references were not selected';
END;
$verify$;
-- A false result is an explicit enrichment/release blocker, not an optional check.
SELECT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.roofing_projects'::regclass AND conname='location_sonshine_project_enrichment' AND convalidated) AS sonshine_enrichment_required;
ROLLBACK;
