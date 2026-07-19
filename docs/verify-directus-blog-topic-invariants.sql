-- Transactional verification for the topic-assignment database guards.
-- This deliberately exercises failing writes and rolls every successful
-- setup insert back before exiting.

BEGIN;

DO $function$
DECLARE
  sample_post uuid;
  website_design uuid;
  google_ads uuid;
  local_seo uuid;
  automation uuid;
  sonshine_roof_leaks uuid;
  duplicate_rejected boolean := false;
  cross_client_rejected boolean := false;
  fourth_topic_rejected boolean := false;
  scope_key_rewritten boolean := false;
BEGIN
  SELECT id INTO sample_post
    FROM public.blog_posts
   WHERE slug = 'sample-blog-post';

  SELECT id INTO website_design
    FROM public.blog_topics
   WHERE scope_key = 'borntreger-digital:website-design';
  SELECT id INTO google_ads
    FROM public.blog_topics
   WHERE scope_key = 'borntreger-digital:google-ads';
  SELECT id INTO local_seo
    FROM public.blog_topics
   WHERE scope_key = 'borntreger-digital:local-seo';
  SELECT id INTO automation
    FROM public.blog_topics
   WHERE scope_key = 'borntreger-digital:automation';
  SELECT id INTO sonshine_roof_leaks
    FROM public.blog_topics
   WHERE scope_key = 'sonshine-roofing:roof-leaks';

  BEGIN
    INSERT INTO public.blog_posts_blog_topics (id, blog_post, blog_topic)
    VALUES (gen_random_uuid(), sample_post, website_design);
  EXCEPTION WHEN unique_violation THEN
    duplicate_rejected := true;
  END;

  IF NOT duplicate_rejected THEN
    RAISE EXCEPTION 'Duplicate topic assignment guard did not fire';
  END IF;

  BEGIN
    INSERT INTO public.blog_posts_blog_topics (id, blog_post, blog_topic)
    VALUES (gen_random_uuid(), sample_post, sonshine_roof_leaks);
  EXCEPTION WHEN check_violation THEN
    cross_client_rejected := true;
  END;

  IF NOT cross_client_rejected THEN
    RAISE EXCEPTION 'Cross-client topic assignment guard did not fire';
  END IF;

  INSERT INTO public.blog_posts_blog_topics (id, blog_post, blog_topic)
  VALUES
    (gen_random_uuid(), sample_post, google_ads),
    (gen_random_uuid(), sample_post, local_seo);

  BEGIN
    INSERT INTO public.blog_posts_blog_topics (id, blog_post, blog_topic)
    VALUES (gen_random_uuid(), sample_post, automation);
  EXCEPTION WHEN check_violation THEN
    fourth_topic_rejected := true;
  END;

  IF NOT fourth_topic_rejected THEN
    RAISE EXCEPTION 'Three-topic maximum guard did not fire';
  END IF;

  UPDATE public.blog_topics
     SET scope_key = 'intentionally-wrong'
   WHERE id = website_design
   RETURNING scope_key = 'borntreger-digital:website-design'
        INTO scope_key_rewritten;

  IF NOT scope_key_rewritten THEN
    RAISE EXCEPTION 'Client/topic scope key maintenance guard did not fire';
  END IF;

  RAISE NOTICE 'PASS: scope-key, duplicate, cross-client, and three-topic guards enforced invariants';
END;
$function$;

ROLLBACK;
