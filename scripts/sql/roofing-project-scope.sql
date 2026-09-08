-- Apply after the Directus project collections and relations exist.
-- Reuse the established client/slug guard without changing its shared function.
BEGIN;

DO $migration$
DECLARE
  collection_name text;
  trigger_name text;
BEGIN
  FOREACH collection_name IN ARRAY ARRAY[
    'roofing_projects',
    'roofing_material_types',
    'roofing_roof_colors',
    'roofing_service_areas'
  ] LOOP
    trigger_name := collection_name || '_scope_key';
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid = format('public.%I', collection_name)::regclass
        AND tgname = trigger_name
        AND NOT tgisinternal
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OF client, slug, scope_key ON public.%I FOR EACH ROW EXECUTE FUNCTION public.maintain_client_route_scope_key(''slug'')',
        trigger_name, collection_name
      );
    END IF;

    EXECUTE format('UPDATE public.%I SET scope_key = scope_key WHERE scope_key IS NULL', collection_name);
    -- Directus validates requests before PostgreSQL runs the trigger. Keep the
    -- hidden derived field nullable at the API boundary, as existing route
    -- collections do; the trigger always supplies a nonempty unique value.
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN scope_key DROP NOT NULL', collection_name);
  END LOOP;
END;
$migration$;

COMMIT;
