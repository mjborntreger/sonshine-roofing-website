-- Apply after scripts/setup-video-schema.mjs, before importing any videos.
-- Additive PostgreSQL invariants; retain roofing_projects.youtube_url for rollback.
BEGIN;

CREATE OR REPLACE FUNCTION public.video_youtube_id(input_url text)
RETURNS text LANGUAGE plpgsql IMMUTABLE STRICT AS $function$
DECLARE
  parts text[];
  host_name text;
  url_path text;
  query_part text;
  candidate text;
  pair text;
  matches integer := 0;
BEGIN
  parts := regexp_match(btrim(input_url), '^https?://([^/?#]+)([^?#]*)(\?[^#]*)?(#.*)?$', 'i');
  IF parts IS NULL OR btrim(input_url) ~ '[[:space:]]' THEN
    RAISE EXCEPTION 'Video requires an allowed YouTube URL' USING ERRCODE = '23514';
  END IF;
  host_name := lower(parts[1]);
  url_path := parts[2];
  query_part := coalesce(parts[3], '');
  IF host_name IN ('youtu.be', 'www.youtu.be') THEN
    candidate := substring(url_path from '^/([A-Za-z0-9_-]{11})/?$');
  ELSIF host_name IN ('youtube.com', 'www.youtube.com', 'm.youtube.com') THEN
    IF url_path = '/watch' THEN
      FOREACH pair IN ARRAY string_to_array(ltrim(query_part, '?'), '&') LOOP
        IF pair LIKE 'v=%' THEN
          candidate := substring(pair from 3);
          matches := matches + 1;
        END IF;
      END LOOP;
      IF matches <> 1 THEN candidate := NULL; END IF;
    ELSE
      candidate := substring(url_path from '^/(?:embed|shorts|v|live)/([A-Za-z0-9_-]{11})/?$');
    END IF;
  ELSIF host_name IN ('youtube-nocookie.com', 'www.youtube-nocookie.com') THEN
    candidate := substring(url_path from '^/embed/([A-Za-z0-9_-]{11})/?$');
  END IF;
  IF candidate IS NULL OR candidate !~ '^[A-Za-z0-9_-]{11}$' THEN
    RAISE EXCEPTION 'Video requires an allowed YouTube URL and exact 11-character ID' USING ERRCODE = '23514';
  END IF;
  RETURN candidate;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_video_model()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE
  related_client uuid;
  client_slug text;
  related record;
BEGIN
  IF NEW.client IS NULL OR btrim(coalesce(NEW.slug, '')) = '' THEN
    RAISE EXCEPTION 'Video requires a client and stable slug' USING ERRCODE = '23514';
  END IF;
  SELECT slug INTO client_slug FROM public.clients WHERE id = NEW.client FOR SHARE;
  IF client_slug IS NULL THEN
    RAISE EXCEPTION 'Video client must exist' USING ERRCODE = '23514';
  END IF;
  -- Video selection slugs preserve legacy Unicode; the shared route guard is
  -- intentionally stricter and must remain unchanged for other collections.
  NEW.scope_key := client_slug || ':' || NEW.slug;
  NEW.youtube_id := public.video_youtube_id(NEW.youtube_url);
  IF NEW.youtube_id IS NULL THEN
    RAISE EXCEPTION 'Video requires a YouTube URL' USING ERRCODE = '23514';
  END IF;
  NEW.youtube_url := 'https://www.youtube.com/watch?v=' || NEW.youtube_id;
  IF NEW.project IS NOT NULL THEN
    SELECT client INTO related_client FROM public.roofing_projects WHERE id = NEW.project FOR SHARE;
    IF NOT FOUND OR related_client IS DISTINCT FROM NEW.client THEN
      RAISE EXCEPTION 'Video and project must have the same client' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.client IS DISTINCT FROM OLD.client THEN
    FOR related IN SELECT c.client FROM public.video_categories c
      JOIN public.video_category_assignments a ON a.category = c.id
      WHERE a.video = NEW.id FOR SHARE OF c
    LOOP
      IF related.client IS DISTINCT FROM NEW.client THEN
        RAISE EXCEPTION 'Video reassignment would cross category clients' USING ERRCODE = '23514';
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.external_id IS NOT NULL AND NEW.source_updated_at IS NOT NULL THEN
    NEW.date_updated := NEW.source_updated_at;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'published'
    AND OLD.external_id IS NOT NULL AND OLD.date_updated = OLD.source_updated_at
    AND (to_jsonb(NEW) - ARRAY['status', 'date_updated', 'user_updated'])
      = (to_jsonb(OLD) - ARRAY['status', 'date_updated', 'user_updated']) THEN
    -- Initial publication alone is not an editorial content change.
    NEW.date_updated := OLD.date_updated;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_video_category()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE related record;
BEGIN
  IF NEW.client IS NULL OR NEW.slug IS NULL OR NEW.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    OR NEW.slug IN ('roofing-project', 'other') OR btrim(coalesce(NEW.name, '')) = '' THEN
    RAISE EXCEPTION 'Category requires a client, name, and non-reserved stable slug' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.client IS DISTINCT FROM OLD.client THEN
    FOR related IN SELECT v.client FROM public.videos v
      JOIN public.video_category_assignments a ON a.video = v.id
      WHERE a.category = NEW.id FOR SHARE OF v
    LOOP
      IF related.client IS DISTINCT FROM NEW.client THEN
        RAISE EXCEPTION 'Category reassignment would cross video clients' USING ERRCODE = '23514';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_video_category_assignment()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE video_client uuid; category_client uuid;
BEGIN
  SELECT client INTO video_client FROM public.videos WHERE id = NEW.video FOR SHARE;
  SELECT client INTO category_client FROM public.video_categories WHERE id = NEW.category FOR SHARE;
  IF video_client IS NULL OR category_client IS NULL OR video_client IS DISTINCT FROM category_client THEN
    RAISE EXCEPTION 'Video and category must exist and have the same client' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_project_video_client()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE related record;
BEGIN
  IF NEW.client IS DISTINCT FROM OLD.client THEN
    FOR related IN SELECT client FROM public.videos WHERE project = NEW.id FOR SHARE LOOP
      IF related.client IS DISTINCT FROM NEW.client THEN
        RAISE EXCEPTION 'Project reassignment would cross video clients' USING ERRCODE = '23514';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS video_model_guard ON public.videos;
DROP TRIGGER IF EXISTS videos_scope_key ON public.videos;
CREATE TRIGGER video_model_guard BEFORE INSERT OR UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.validate_video_model();
DROP TRIGGER IF EXISTS video_category_guard ON public.video_categories;
CREATE TRIGGER video_category_guard BEFORE INSERT OR UPDATE ON public.video_categories
  FOR EACH ROW EXECUTE FUNCTION public.validate_video_category();
DROP TRIGGER IF EXISTS video_assignment_guard ON public.video_category_assignments;
CREATE TRIGGER video_assignment_guard BEFORE INSERT OR UPDATE ON public.video_category_assignments
  FOR EACH ROW EXECUTE FUNCTION public.validate_video_category_assignment();
DROP TRIGGER IF EXISTS project_video_client_guard ON public.roofing_projects;
CREATE TRIGGER project_video_client_guard BEFORE UPDATE OF client ON public.roofing_projects
  FOR EACH ROW EXECUTE FUNCTION public.validate_project_video_client();

DO $migration$
DECLARE collection_name text;
BEGIN
  FOREACH collection_name IN ARRAY ARRAY['video_categories'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = format('public.%I', collection_name)::regclass
      AND tgname = collection_name || '_scope_key' AND NOT tgisinternal) THEN
      EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE OF client, slug, scope_key ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.maintain_client_route_scope_key(''slug'')', collection_name || '_scope_key', collection_name);
    END IF;
  END LOOP;
END;
$migration$;

CREATE UNIQUE INDEX IF NOT EXISTS videos_client_slug_unique ON public.videos(client, slug);
CREATE UNIQUE INDEX IF NOT EXISTS videos_client_youtube_unique ON public.videos(client, youtube_id);
CREATE UNIQUE INDEX IF NOT EXISTS videos_client_external_unique ON public.videos(client, external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS videos_project_unique ON public.videos(project) WHERE project IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS video_categories_client_slug_unique ON public.video_categories(client, slug);
CREATE UNIQUE INDEX IF NOT EXISTS video_category_assignments_unique ON public.video_category_assignments(video, category);

-- CHECK constraints remain active if triggers are disabled by privileged maintenance.
DO $migration$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.videos'::regclass AND conname = 'videos_content_check') THEN
    ALTER TABLE public.videos ADD CONSTRAINT videos_content_check CHECK (
      client IS NOT NULL AND slug IS NOT NULL AND slug = btrim(slug) AND slug <> ''
      AND slug !~ '[[:space:][:cntrl:]/?#&=%]' AND position(chr(92) in slug) = 0
      AND title IS NOT NULL AND btrim(title) <> '' AND description IS NOT NULL AND btrim(description) <> ''
      AND status IS NOT NULL AND status IN ('draft', 'published', 'archived') AND published_at IS NOT NULL
      AND youtube_id IS NOT NULL AND youtube_id ~ '^[A-Za-z0-9_-]{11}$'
      AND youtube_url IS NOT NULL AND youtube_url = 'https://www.youtube.com/watch?v=' || youtube_id
      AND legacy_ids IS NOT NULL AND jsonb_typeof(legacy_ids::jsonb) = 'array'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.video_categories'::regclass AND conname = 'video_categories_content_check') THEN
    ALTER TABLE public.video_categories ADD CONSTRAINT video_categories_content_check CHECK (
      client IS NOT NULL AND slug IS NOT NULL AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      AND slug NOT IN ('roofing-project', 'other') AND name IS NOT NULL AND btrim(name) <> ''
      AND status IS NOT NULL AND status IN ('draft', 'published', 'archived')
    );
  END IF;
END;
$migration$;
COMMIT;
