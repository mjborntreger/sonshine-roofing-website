-- Directus cannot express these cross-row/cross-table guards through its
-- collection/field/relation APIs. Apply this after creating blog_topics and
-- blog_posts_blog_topics. The separate composite unique index is created with
-- CREATE UNIQUE INDEX CONCURRENTLY in production to avoid a table lock.

CREATE OR REPLACE FUNCTION public.maintain_blog_topic_scope_key()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  client_slug text;
BEGIN
  SELECT slug
    INTO client_slug
    FROM public.clients
   WHERE id = NEW.client;

  IF client_slug IS NULL THEN
    RAISE EXCEPTION 'Blog topics require an existing client'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Blog topic slugs must be lowercase URL-safe slugs'
      USING ERRCODE = '23514';
  END IF;

  NEW.scope_key := client_slug || ':' || NEW.slug;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS blog_topic_scope_key ON public.blog_topics;
CREATE TRIGGER blog_topic_scope_key
BEFORE INSERT OR UPDATE OF client, slug, scope_key
ON public.blog_topics
FOR EACH ROW
EXECUTE FUNCTION public.maintain_blog_topic_scope_key();

-- Directus validates physical NOT NULL columns before PostgreSQL defaults and
-- BEFORE triggers run. Keep scope_key physically nullable so hidden values may
-- be omitted from API payloads, while an explicit CHECK constraint preserves
-- the stored non-null/nonblank invariant after the trigger generates the
-- canonical client-slug:topic-slug value.
--
-- Do not toggle scope_key nullability through the Directus Data Model UI. Its
-- column.alter() path also emits a redundant ALTER TYPE, which PostgreSQL
-- rejects because scope_key appears in this trigger's UPDATE OF definition.
ALTER TABLE public.blog_topics
  ADD CONSTRAINT blog_topics_scope_key_nonblank
  CHECK (scope_key IS NOT NULL AND btrim(scope_key) <> '') NOT VALID;

ALTER TABLE public.blog_topics
  VALIDATE CONSTRAINT blog_topics_scope_key_nonblank;

ALTER TABLE public.blog_topics
  ALTER COLUMN scope_key DROP DEFAULT,
  ALTER COLUMN scope_key DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.enforce_blog_topic_assignment_invariants()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  post_client uuid;
  topic_client uuid;
  existing_topic_count integer;
BEGIN
  SELECT client
    INTO post_client
    FROM public.blog_posts
   WHERE id = NEW.blog_post;

  SELECT client
    INTO topic_client
    FROM public.blog_topics
   WHERE id = NEW.blog_topic;

  IF post_client IS NULL OR topic_client IS NULL THEN
    RAISE EXCEPTION 'Blog topic assignments require an existing post and topic with client ownership'
      USING ERRCODE = '23514';
  END IF;

  IF post_client <> topic_client THEN
    RAISE EXCEPTION 'Blog posts and topics must belong to the same client'
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*)
    INTO existing_topic_count
    FROM public.blog_posts_blog_topics
   WHERE blog_post = NEW.blog_post
     AND id <> NEW.id;

  IF existing_topic_count >= 3 THEN
    RAISE EXCEPTION 'A blog post may have at most three topics'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS blog_topic_assignment_invariants
ON public.blog_posts_blog_topics;
CREATE TRIGGER blog_topic_assignment_invariants
BEFORE INSERT OR UPDATE OF blog_post, blog_topic
ON public.blog_posts_blog_topics
FOR EACH ROW
EXECUTE FUNCTION public.enforce_blog_topic_assignment_invariants();
