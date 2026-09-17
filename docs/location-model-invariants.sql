-- PREPARED, NOT APPLIED. Integrity artifact location-invariants-v4 (model location-model-v5). PostgreSQL only.
-- Permission-first gate must pass before schema creates roofing_projects.job_id.
-- Run after setup-location-schema, with ON_ERROR_STOP=1, under exact authorization.
-- Existing conflicting rows cause the transaction to abort; never repair them here.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Composite keys enforce tenant consistency in both directions, including parent
-- reassignment and concurrent changes. The existing IDs and scope keys survive.
CREATE UNIQUE INDEX IF NOT EXISTS location_areas_client_id ON public.roofing_service_areas(client,id);
CREATE UNIQUE INDEX IF NOT EXISTS location_neighborhoods_client_id_area ON public.roofing_neighborhoods(client,id,service_area);
CREATE UNIQUE INDEX IF NOT EXISTS location_neighborhoods_client_slug ON public.roofing_neighborhoods(client,slug);
CREATE UNIQUE INDEX IF NOT EXISTS location_neighborhoods_wordpress ON public.roofing_neighborhoods(client,wordpress_id) WHERE wordpress_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS location_pages_wordpress ON public.roofing_service_areas(client,wordpress_location_id) WHERE wordpress_location_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS location_projects_client_job ON public.roofing_projects(client,job_id) WHERE job_id IS NOT NULL;
-- UUID letter casing cannot create a second identity for the same AccuLynx job.
CREATE UNIQUE INDEX IF NOT EXISTS location_projects_client_job_uuid ON public.roofing_projects(client,lower(job_id))
  WHERE job_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
CREATE UNIQUE INDEX IF NOT EXISTS location_sponsor_area_pair ON public.sponsor_service_areas(sponsor,service_area);
CREATE UNIQUE INDEX IF NOT EXISTS location_nearby_area_pair ON public.roofing_service_area_neighbors(service_area,nearby_area);
CREATE UNIQUE INDEX IF NOT EXISTS location_coverage_area_pair ON public.service_area_section_areas(section,service_area);
CREATE UNIQUE INDEX IF NOT EXISTS location_pages_client_id ON public.website_pages(client,id);
CREATE UNIQUE INDEX IF NOT EXISTS location_services_client_id ON public.services(client,id);

-- These were already required in Directus; prevent NULL client identities in SQL.
ALTER TABLE public.reviews ALTER COLUMN client SET NOT NULL;
ALTER TABLE public.faqs ALTER COLUMN client SET NOT NULL;
ALTER TABLE public.sponsor_features ALTER COLUMN client SET NOT NULL;
ALTER TABLE public.service_area_sections ALTER COLUMN client SET NOT NULL;

DO $migration$
DECLARE entry record;
BEGIN
  FOR entry IN SELECT * FROM (VALUES
    ('roofing_projects','location_project_area_client','FOREIGN KEY (client,service_area) REFERENCES public.roofing_service_areas(client,id) ON DELETE RESTRICT ON UPDATE RESTRICT'),
    ('roofing_neighborhoods','location_neighborhood_area_client','FOREIGN KEY (client,service_area) REFERENCES public.roofing_service_areas(client,id) ON DELETE RESTRICT ON UPDATE RESTRICT'),
    ('roofing_projects','location_project_neighborhood_area','FOREIGN KEY (client,neighborhood,service_area) REFERENCES public.roofing_neighborhoods(client,id,service_area) ON DELETE RESTRICT ON UPDATE RESTRICT'),
    ('reviews','location_review_area_client','FOREIGN KEY (client,service_area) REFERENCES public.roofing_service_areas(client,id) ON DELETE RESTRICT ON UPDATE RESTRICT'),
    ('faqs','location_faq_area_client','FOREIGN KEY (client,service_area) REFERENCES public.roofing_service_areas(client,id) ON DELETE RESTRICT ON UPDATE RESTRICT'),
    ('faqs','location_faq_page_client','FOREIGN KEY (client,website_page) REFERENCES public.website_pages(client,id) ON DELETE RESTRICT ON UPDATE RESTRICT'),
    ('faqs','location_faq_service_client','FOREIGN KEY (client,service) REFERENCES public.services(client,id) ON DELETE RESTRICT ON UPDATE RESTRICT'),
    ('navigation_items','location_navigation_menu_fk','FOREIGN KEY (menu) REFERENCES public.navigation_menus(id) ON DELETE RESTRICT ON UPDATE RESTRICT'),
    ('navigation_items','location_navigation_page_fk','FOREIGN KEY (page) REFERENCES public.website_pages(id) ON DELETE RESTRICT ON UPDATE RESTRICT'),
    ('navigation_items','location_navigation_parent_fk','FOREIGN KEY (parent) REFERENCES public.navigation_items(id) ON DELETE RESTRICT ON UPDATE RESTRICT'),
    ('roofing_service_areas','location_page_publication','CHECK (page_status IN (''taxonomy_only'',''draft'',''published'') AND (page_status <> ''published'' OR (status = ''published'' AND nullif(btrim(page_title),'''') IS NOT NULL AND nullif(btrim(introduction),'''') IS NOT NULL AND published_at IS NOT NULL)))'),
    ('roofing_neighborhoods','location_neighborhood_content','CHECK (client IS NOT NULL AND service_area IS NOT NULL AND nullif(btrim(name),'''') IS NOT NULL AND slug ~ ''^[a-z0-9]+(-[a-z0-9]+)*$'' AND status IN (''draft'',''published'',''archived''))'),
    ('roofing_projects','location_project_reference_normalized','CHECK ((job_id IS NULL OR (job_id !~ ''^[[:space:]]|[[:space:]]$'' AND job_id<>'''')) AND (zip IS NULL OR zip ~ ''^[0-9]{5}(-[0-9]{4})?$''))'),
    ('roofing_projects','location_project_uuid_canonical','CHECK (job_id IS NULL OR job_id !~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' OR job_id=lower(job_id))'),
    ('reviews','location_review_provenance_array','CHECK (jsonb_typeof(wordpress_provenance::jsonb)=''array'')'),
    ('faqs','location_faq_scope_exclusive','CHECK (num_nonnulls(website_page,service,service_area)<=1)'),
    ('navigation_items','location_navigation_area_scope','CHECK ((link_type=''service_area'' AND service_area IS NOT NULL AND page IS NULL AND service IS NULL) OR (link_type<>''service_area'' AND service_area IS NULL))'),
    ('roofing_service_area_neighbors','location_nearby_not_self','CHECK (service_area<>nearby_area)')
  ) AS definitions(table_name,constraint_name,definition) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=format('public.%I',entry.table_name)::regclass AND conname=entry.constraint_name) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s',entry.table_name,entry.constraint_name,entry.definition);
    END IF;
  END LOOP;
END;
$migration$;

CREATE OR REPLACE FUNCTION public.location_normalize_project_reference()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  NEW.job_id := nullif(regexp_replace(NEW.job_id,'^[[:space:]]+|[[:space:]]+$','','g'),'');
  IF NEW.job_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    NEW.job_id := lower(NEW.job_id);
  END IF;
  NEW.zip := nullif(regexp_replace(NEW.zip,'^[[:space:]]+|[[:space:]]+$','','g'),'');
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS location_project_reference_guard ON public.roofing_projects;
CREATE TRIGGER location_project_reference_guard BEFORE INSERT OR UPDATE OF job_id,zip ON public.roofing_projects
  FOR EACH ROW EXECUTE FUNCTION public.location_normalize_project_reference();

-- Junctions inherit identity from their canonical owners. Lock both parent rows
-- while validating; reassignment guards below prevent later changes to that identity.
CREATE OR REPLACE FUNCTION public.location_validate_junction()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE left_client uuid; right_client uuid;
BEGIN
  IF TG_TABLE_NAME='sponsor_service_areas' THEN
    SELECT client INTO left_client FROM public.sponsor_features WHERE id=NEW.sponsor FOR SHARE;
    SELECT client INTO right_client FROM public.roofing_service_areas WHERE id=NEW.service_area FOR SHARE;
  ELSIF TG_TABLE_NAME='roofing_service_area_neighbors' THEN
    SELECT client INTO left_client FROM public.roofing_service_areas WHERE id=NEW.service_area FOR SHARE;
    SELECT client INTO right_client FROM public.roofing_service_areas WHERE id=NEW.nearby_area FOR SHARE;
  ELSIF TG_TABLE_NAME='service_area_section_areas' THEN
    SELECT client INTO left_client FROM public.service_area_sections WHERE id=NEW.section FOR SHARE;
    SELECT client INTO right_client FROM public.roofing_service_areas WHERE id=NEW.service_area FOR SHARE;
  END IF;
  IF left_client IS NULL OR right_client IS NULL OR left_client IS DISTINCT FROM right_client THEN
    RAISE EXCEPTION 'Location relationship requires existing records from the same client' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.location_guard_owner_reassignment()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE blocked boolean := false;
BEGIN
  IF NEW.client IS NOT DISTINCT FROM OLD.client THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME='roofing_service_areas' THEN
    blocked := EXISTS(SELECT 1 FROM public.sponsor_service_areas WHERE service_area=OLD.id)
      OR EXISTS(SELECT 1 FROM public.roofing_service_area_neighbors WHERE service_area=OLD.id OR nearby_area=OLD.id)
      OR EXISTS(SELECT 1 FROM public.service_area_section_areas WHERE service_area=OLD.id)
      OR EXISTS(SELECT 1 FROM public.navigation_items WHERE service_area=OLD.id);
  ELSIF TG_TABLE_NAME='sponsor_features' THEN
    blocked := EXISTS(SELECT 1 FROM public.sponsor_service_areas WHERE sponsor=OLD.id);
  ELSIF TG_TABLE_NAME='service_area_sections' THEN
    blocked := EXISTS(SELECT 1 FROM public.service_area_section_areas WHERE section=OLD.id);
  ELSIF TG_TABLE_NAME='navigation_menus' THEN
    blocked := EXISTS(SELECT 1 FROM public.navigation_items WHERE menu=OLD.id);
  ELSIF TG_TABLE_NAME='website_pages' THEN
    blocked := EXISTS(SELECT 1 FROM public.navigation_items WHERE page=OLD.id);
  ELSIF TG_TABLE_NAME='services' THEN
    blocked := EXISTS(SELECT 1 FROM public.navigation_items WHERE service=OLD.id);
  END IF;
  IF blocked THEN RAISE EXCEPTION 'Unassign location relationships before changing the owning client' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.location_validate_navigation()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE owner_client uuid; target_client uuid; target_id uuid; target_table text; parent_menu uuid;
BEGIN
  SELECT client INTO owner_client FROM public.navigation_menus WHERE id=NEW.menu FOR SHARE;
  IF owner_client IS NULL THEN RAISE EXCEPTION 'Navigation requires a client-owned menu' USING ERRCODE='23514'; END IF;
  FOR target_table,target_id IN SELECT * FROM (VALUES
    ('roofing_service_areas',NEW.service_area),('website_pages',NEW.page),('services',NEW.service)
  ) AS targets(table_name,record_id) LOOP
    IF target_id IS NOT NULL THEN
      EXECUTE format('SELECT client FROM public.%I WHERE id=$1 FOR SHARE',target_table) INTO target_client USING target_id;
      IF target_client IS NULL OR target_client IS DISTINCT FROM owner_client THEN
        RAISE EXCEPTION 'Navigation target must share its menu client' USING ERRCODE='23514';
      END IF;
    END IF;
  END LOOP;
  IF NEW.parent IS NOT NULL THEN
    SELECT menu INTO parent_menu FROM public.navigation_items WHERE id=NEW.parent FOR SHARE;
    IF parent_menu IS DISTINCT FROM NEW.menu OR NEW.parent=NEW.id THEN
      RAISE EXCEPTION 'Navigation parent must belong to the same menu and cannot be self' USING ERRCODE='23514';
    END IF;
  END IF;
  IF TG_OP='UPDATE' AND NEW.menu IS DISTINCT FROM OLD.menu AND EXISTS(SELECT 1 FROM public.navigation_items WHERE parent=OLD.id) THEN
    RAISE EXCEPTION 'Unassign child navigation before moving its parent menu' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$function$;

DO $migration$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['sponsor_service_areas','roofing_service_area_neighbors','service_area_section_areas'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS location_junction_guard ON public.%I',table_name);
    EXECUTE format('CREATE TRIGGER location_junction_guard BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.location_validate_junction()',table_name);
  END LOOP;
  FOREACH table_name IN ARRAY ARRAY['roofing_service_areas','sponsor_features','service_area_sections','navigation_menus','website_pages','services'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS location_owner_reassignment_guard ON public.%I',table_name);
    EXECUTE format('CREATE TRIGGER location_owner_reassignment_guard BEFORE UPDATE OF client ON public.%I FOR EACH ROW EXECUTE FUNCTION public.location_guard_owner_reassignment()',table_name);
  END LOOP;
END;
$migration$;
DROP TRIGGER IF EXISTS location_navigation_guard ON public.navigation_items;
CREATE TRIGGER location_navigation_guard BEFORE INSERT OR UPDATE ON public.navigation_items
  FOR EACH ROW EXECUTE FUNCTION public.location_validate_navigation();

-- SET NULL would make deleting a local service silently turn its FAQs global.
ALTER TABLE public.faqs DROP CONSTRAINT IF EXISTS faqs_service_foreign;
ALTER TABLE public.faqs ADD CONSTRAINT faqs_service_foreign FOREIGN KEY(service) REFERENCES public.services(id) ON DELETE RESTRICT;
UPDATE public.directus_relations SET one_deselect_action='nullify' WHERE many_collection='faqs' AND many_field='service';

-- Validate preexisting rows without touching their editorial timestamps.
DO $preflight$
BEGIN
  IF EXISTS(SELECT 1 FROM public.sponsor_service_areas j JOIN public.sponsor_features s ON s.id=j.sponsor JOIN public.roofing_service_areas a ON a.id=j.service_area WHERE s.client IS DISTINCT FROM a.client)
    OR EXISTS(SELECT 1 FROM public.roofing_service_area_neighbors j JOIN public.roofing_service_areas a ON a.id=j.service_area JOIN public.roofing_service_areas b ON b.id=j.nearby_area WHERE a.client IS DISTINCT FROM b.client)
    OR EXISTS(SELECT 1 FROM public.service_area_section_areas j JOIN public.service_area_sections s ON s.id=j.section JOIN public.roofing_service_areas a ON a.id=j.service_area WHERE s.client IS DISTINCT FROM a.client)
    OR EXISTS(SELECT 1 FROM public.navigation_items n JOIN public.navigation_menus m ON m.id=n.menu LEFT JOIN public.roofing_service_areas a ON a.id=n.service_area LEFT JOIN public.website_pages p ON p.id=n.page LEFT JOIN public.services s ON s.id=n.service WHERE m.client IS NULL OR (a.id IS NOT NULL AND a.client IS DISTINCT FROM m.client) OR (p.id IS NOT NULL AND p.client IS DISTINCT FROM m.client) OR (s.id IS NOT NULL AND s.client IS DISTINCT FROM m.client))
  THEN RAISE EXCEPTION 'Existing location relationship crosses clients; resolve before applying'; END IF;
END;
$preflight$;
COMMIT;
