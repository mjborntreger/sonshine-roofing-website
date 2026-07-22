-- Database-maintained client/slug uniqueness for roofing glossary term routes.
-- The shared maintain_client_route_scope_key() function is installed by
-- directus-route-owner-invariants.sql and remains the authority for scope_key.

BEGIN;

UPDATE public.directus_fields
SET validation = '{"_and":[{"slug":{"_regex":"^[a-z0-9]+(?:-[a-z0-9]+)*$"}}]}'::json,
    validation_message =
      'Use a lowercase URL slug with letters, numbers, and single hyphens only.'
WHERE collection = 'roofing_glossary_terms'
  AND field = 'slug';

DROP TRIGGER IF EXISTS roofing_glossary_term_scope_key
ON public.roofing_glossary_terms;

CREATE TRIGGER roofing_glossary_term_scope_key
BEFORE INSERT OR UPDATE OF client, slug, scope_key
ON public.roofing_glossary_terms
FOR EACH ROW
EXECUTE FUNCTION public.maintain_client_route_scope_key('slug');

UPDATE public.roofing_glossary_terms SET scope_key = scope_key;

ALTER TABLE public.roofing_glossary_terms
  ALTER COLUMN scope_key SET DEFAULT '',
  ALTER COLUMN scope_key SET NOT NULL;

COMMIT;
