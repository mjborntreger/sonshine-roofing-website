-- Database-maintained client/route uniqueness guards for shared Directus.
-- Directus exposes scope_key as hidden and read-only; this trigger is the
-- authority and rewrites it whenever client, path/slug, or scope_key changes.

CREATE OR REPLACE FUNCTION public.maintain_client_route_scope_key()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  client_slug text;
  route_value text;
BEGIN
  SELECT slug
    INTO client_slug
    FROM public.clients
   WHERE id = NEW.client;

  IF client_slug IS NULL THEN
    RAISE EXCEPTION '% requires an existing client', TG_TABLE_NAME
      USING ERRCODE = '23514';
  END IF;

  route_value := to_jsonb(NEW) ->> TG_ARGV[0];

  IF route_value IS NULL OR btrim(route_value) = '' THEN
    RAISE EXCEPTION '%.% may not be empty', TG_TABLE_NAME, TG_ARGV[0]
      USING ERRCODE = '23514';
  END IF;

  IF TG_ARGV[0] = 'path' AND route_value !~ '^/' THEN
    RAISE EXCEPTION 'Website page paths must begin with /'
      USING ERRCODE = '23514';
  END IF;

  IF TG_ARGV[0] = 'slug'
     AND route_value !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Route slugs must be lowercase URL-safe slugs'
      USING ERRCODE = '23514';
  END IF;

  NEW.scope_key := client_slug || ':' || route_value;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS website_page_scope_key ON public.website_pages;
CREATE TRIGGER website_page_scope_key
BEFORE INSERT OR UPDATE OF client, path, scope_key
ON public.website_pages
FOR EACH ROW
EXECUTE FUNCTION public.maintain_client_route_scope_key('path');

DROP TRIGGER IF EXISTS service_scope_key ON public.services;
CREATE TRIGGER service_scope_key
BEFORE INSERT OR UPDATE OF client, slug, scope_key
ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.maintain_client_route_scope_key('slug');

DROP TRIGGER IF EXISTS blog_post_scope_key ON public.blog_posts;
CREATE TRIGGER blog_post_scope_key
BEFORE INSERT OR UPDATE OF client, slug, scope_key
ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.maintain_client_route_scope_key('slug');

DROP TRIGGER IF EXISTS case_study_scope_key ON public.case_studies;
CREATE TRIGGER case_study_scope_key
BEFORE INSERT OR UPDATE OF client, slug, scope_key
ON public.case_studies
FOR EACH ROW
EXECUTE FUNCTION public.maintain_client_route_scope_key('slug');

DROP TRIGGER IF EXISTS special_offer_scope_key ON public.special_offers;
CREATE TRIGGER special_offer_scope_key
BEFORE INSERT OR UPDATE OF client, slug, scope_key
ON public.special_offers
FOR EACH ROW
EXECUTE FUNCTION public.maintain_client_route_scope_key('slug');

DROP TRIGGER IF EXISTS person_scope_key ON public.persons;
CREATE TRIGGER person_scope_key
BEFORE INSERT OR UPDATE OF client, slug, scope_key
ON public.persons
FOR EACH ROW
EXECUTE FUNCTION public.maintain_client_route_scope_key('slug');

-- Populate all existing rows through the same trigger path.
UPDATE public.website_pages SET scope_key = scope_key;
UPDATE public.services SET scope_key = scope_key;
UPDATE public.blog_posts SET scope_key = scope_key;
UPDATE public.case_studies SET scope_key = scope_key;
UPDATE public.special_offers SET scope_key = scope_key;
UPDATE public.persons SET scope_key = scope_key;

ALTER TABLE public.website_pages
  ALTER COLUMN scope_key SET NOT NULL,
  ALTER COLUMN noindex SET DEFAULT false,
  ALTER COLUMN noindex SET NOT NULL;
ALTER TABLE public.services ALTER COLUMN scope_key SET NOT NULL;
ALTER TABLE public.blog_posts ALTER COLUMN scope_key SET NOT NULL;
ALTER TABLE public.case_studies ALTER COLUMN scope_key SET NOT NULL;
ALTER TABLE public.special_offers ALTER COLUMN scope_key SET NOT NULL;
ALTER TABLE public.persons ALTER COLUMN scope_key SET NOT NULL;
