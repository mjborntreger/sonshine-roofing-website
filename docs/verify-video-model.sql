-- Run only after docs/video-model-invariants.sql with psql ON_ERROR_STOP=1.
-- All fixture writes are synthetic and uncommitted. Existing rows are read only
-- for SonShine's client/project identity and valid material/service-area keys.
-- An unexpected result raises an exception; the transaction cannot commit.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $verify$
DECLARE
  sonshine_client uuid;
  fixture_client uuid := gen_random_uuid();
  sample_project uuid;
  sample_material uuid;
  sample_area uuid;
  project_one uuid := gen_random_uuid();
  project_two uuid := gen_random_uuid();
  video_one uuid := gen_random_uuid();
  video_two uuid := gen_random_uuid();
  video_other uuid := gen_random_uuid();
  category_one uuid := gen_random_uuid();
  category_two uuid := gen_random_uuid();
  category_other uuid := gen_random_uuid();
  assignment_one uuid := gen_random_uuid();
  assignment_two uuid := gen_random_uuid();
  fixture_prefix text := 'video-model-verify-' || replace(gen_random_uuid()::text, '-', '');
  youtube_one text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 11);
  youtube_two text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 11);
  youtube_three text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 11);
  fixture_url text;
  invalid_url text;
  reserved_slug text;
  failure_message text;
  failure_constraint text;
  checks integer := 0;
BEGIN
  SELECT id INTO STRICT sonshine_client
  FROM public.clients WHERE slug = 'sonshine-roofing';

  SELECT id, material_type, service_area
    INTO sample_project, sample_material, sample_area
  FROM public.roofing_projects
  WHERE client = sonshine_client AND status = 'published'
    AND material_type IS NOT NULL AND service_area IS NOT NULL
  ORDER BY id LIMIT 1;
  IF sample_project IS NULL THEN
    RAISE EXCEPTION 'Verification requires one existing published SonShine project';
  END IF;
  IF youtube_one = youtube_two OR youtube_one = youtube_three OR youtube_two = youtube_three
    OR EXISTS (SELECT 1 FROM public.videos WHERE client = sonshine_client
      AND youtube_id IN (youtube_one, youtube_two, youtube_three)) THEN
    RAISE EXCEPTION 'Synthetic identity collision; rerun verification';
  END IF;

  INSERT INTO public.clients (id, name, slug, is_active, abbreviation)
  VALUES (fixture_client, 'Synthetic video model verification', fixture_prefix, false, 'VMV');

  INSERT INTO public.roofing_projects
    (id, client, title, slug, description, material_type, service_area, status, published_at)
  VALUES
    (project_one, sonshine_client, 'Synthetic project one', fixture_prefix || '-project-one',
      'Synthetic roof replacement verification fixture.', sample_material, sample_area, 'draft', '2020-01-01T00:00:00Z'),
    (project_two, sonshine_client, 'Synthetic project two', fixture_prefix || '-project-two',
      'Synthetic roof replacement verification fixture.', sample_material, sample_area, 'draft', '2020-01-02T00:00:00Z');

  -- Multiple unlinked videos are valid: the optional project key is not a
  -- requirement, and the unique relation index must allow multiple NULLs.
  INSERT INTO public.videos
    (id, client, status, title, slug, description, youtube_url, published_at, legacy_ids)
  VALUES
    (video_one, sonshine_client, 'draft', 'Synthetic video one', fixture_prefix || '-video-one',
      'Independent synthetic video copy.', 'https://youtu.be/' || youtube_one,
      '2020-02-01T00:00:00Z', '[]'),
    (video_two, sonshine_client, 'draft', 'Synthetic video two', fixture_prefix || '-video-two',
      'Independent synthetic video copy.', 'https://www.youtube.com/watch?v=' || youtube_two,
      '2020-02-02T00:00:00Z', '[]');
  IF (SELECT count(*) FROM public.videos WHERE id IN (video_one, video_two) AND project IS NULL) <> 2 THEN
    RAISE EXCEPTION 'Optional project relation did not preserve two standalone videos';
  END IF;
  checks := checks + 1;

  -- Exercise every supported URL family through the actual row trigger, not
  -- only the parser. The generated ID, canonical URL, and scope key must agree.
  FOREACH fixture_url IN ARRAY ARRAY[
    'https://youtu.be/' || youtube_one || '?si=synthetic',
    'https://www.youtu.be/' || youtube_one || '/',
    'https://WWW.YOUTUBE.COM/watch?feature=share&v=' || youtube_one,
    'http://youtube.com/watch?v=' || youtube_one || '&t=4',
    'https://m.youtube.com/watch?v=' || youtube_one,
    'https://www.youtube.com/shorts/' || youtube_one,
    'https://www.youtube.com/embed/' || youtube_one,
    'https://www.youtube.com/v/' || youtube_one,
    'https://www.youtube.com/live/' || youtube_one,
    'https://www.youtube-nocookie.com/embed/' || youtube_one
  ] LOOP
    UPDATE public.videos SET youtube_url = fixture_url, scope_key = 'synthetic-wrong-value'
    WHERE id = video_one;
    IF NOT EXISTS (SELECT 1 FROM public.videos WHERE id = video_one
      AND youtube_id = youtube_one
      AND youtube_url = 'https://www.youtube.com/watch?v=' || youtube_one
      AND scope_key = 'sonshine-roofing:' || fixture_prefix || '-video-one') THEN
      RAISE EXCEPTION 'YouTube URL or scope-key normalization failed';
    END IF;
    checks := checks + 1;
  END LOOP;

  FOREACH invalid_url IN ARRAY ARRAY[
    'https://youtube.com.evil.test/watch?v=' || youtube_one,
    'https://evil.test/watch?v=' || youtube_one,
    'https://youtube.com@evil.test/watch?v=' || youtube_one,
    'https://evil.test@youtube.com/watch?v=' || youtube_one,
    'https://youtube.com:443/watch?v=' || youtube_one,
    'javascript:alert(1)',
    'youtube.com/watch?v=' || youtube_one,
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/watch?v=' || youtube_one || 'x',
    'https://www.youtube.com/watch?v=' || youtube_one || '&v=' || youtube_one,
    'https://www.youtube.com/watch?%76=' || youtube_one,
    'https://youtu.be/' || youtube_one || '/extra',
    'https://www.youtube-nocookie.com/watch?v=' || youtube_one,
    'https://www.youtube.com/watch?v=' || youtube_one || ' bad',
    NULL
  ] LOOP
    BEGIN
      UPDATE public.videos SET youtube_url = invalid_url WHERE id = video_one;
      RAISE EXCEPTION 'Invalid YouTube host, URL, or identity was accepted';
    EXCEPTION WHEN check_violation THEN
      checks := checks + 1;
    END;
  END LOOP;

  UPDATE public.videos SET project = project_one WHERE id = video_one;
  UPDATE public.videos SET project = project_two WHERE id = video_two;
  IF NOT EXISTS (SELECT 1 FROM public.videos WHERE id = video_one AND project = project_one)
    OR NOT EXISTS (SELECT 1 FROM public.videos WHERE id = video_two AND project = project_two) THEN
    RAISE EXCEPTION 'Valid one-to-one links were not stored';
  END IF;
  checks := checks + 1;

  BEGIN
    INSERT INTO public.videos
      (id, client, status, title, slug, description, youtube_url, published_at, legacy_ids, project)
    VALUES (gen_random_uuid(), sonshine_client, 'draft', 'Synthetic duplicate project',
      fixture_prefix || '-duplicate-project', 'Synthetic fixture.',
      'https://youtu.be/' || youtube_three, '2020-02-01T00:00:00Z', '[]', project_one);
    RAISE EXCEPTION 'A project accepted a second video';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS failure_constraint = CONSTRAINT_NAME;
    IF failure_constraint <> 'videos_project_unique' THEN RAISE; END IF;
    checks := checks + 1;
  END;
  BEGIN
    UPDATE public.videos SET project = project_one WHERE id = video_two;
    RAISE EXCEPTION 'Relinking a video claimed an already-linked project';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS failure_constraint = CONSTRAINT_NAME;
    IF failure_constraint <> 'videos_project_unique' THEN RAISE; END IF;
    checks := checks + 1;
  END;

  -- Unlinking is allowed, and must not alter the other video's relationship.
  UPDATE public.videos SET project = NULL WHERE id = video_two;
  IF NOT EXISTS (SELECT 1 FROM public.videos WHERE id = video_two AND project IS NULL)
    OR NOT EXISTS (SELECT 1 FROM public.videos WHERE id = video_one AND project = project_one) THEN
    RAISE EXCEPTION 'Unlinking changed an unrelated one-to-one relation';
  END IF;
  checks := checks + 1;

  BEGIN
    INSERT INTO public.videos
      (id, client, status, title, slug, description, youtube_url, published_at, legacy_ids)
    VALUES (gen_random_uuid(), sonshine_client, 'draft', 'Synthetic duplicate YouTube identity',
      fixture_prefix || '-duplicate-youtube', 'Synthetic fixture.',
      'https://www.youtube.com/shorts/' || youtube_one, '2020-02-01T00:00:00Z', '[]');
    RAISE EXCEPTION 'A duplicate normalized YouTube identity was accepted for one client';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS failure_constraint = CONSTRAINT_NAME;
    IF failure_constraint <> 'videos_client_youtube_unique' THEN RAISE; END IF;
    checks := checks + 1;
  END;
  BEGIN
    INSERT INTO public.videos
      (id, client, status, title, slug, description, youtube_url, published_at, legacy_ids)
    VALUES (gen_random_uuid(), sonshine_client, 'draft', 'Synthetic duplicate selection slug',
      fixture_prefix || '-video-one', 'Synthetic fixture.',
      'https://youtu.be/' || youtube_three, '2020-02-01T00:00:00Z', '[]');
    RAISE EXCEPTION 'A duplicate video slug was accepted for one client';
  EXCEPTION WHEN unique_violation THEN
    checks := checks + 1;
  END;

  -- The same slug/clip under another client is valid; uniqueness is per client.
  INSERT INTO public.videos
    (id, client, status, title, slug, description, youtube_url, published_at, legacy_ids)
  VALUES (video_other, fixture_client, 'draft', 'Synthetic other-client video',
    fixture_prefix || '-video-one', 'Synthetic fixture.',
    'https://youtu.be/' || youtube_one, '2020-02-01T00:00:00Z', '[]');
  checks := checks + 1;

  BEGIN
    INSERT INTO public.videos
      (id, client, status, title, slug, description, youtube_url, published_at, legacy_ids, project)
    VALUES (gen_random_uuid(), fixture_client, 'draft', 'Synthetic cross-client project',
      fixture_prefix || '-cross-client', 'Synthetic fixture.',
      'https://youtu.be/' || youtube_three, '2020-02-01T00:00:00Z', '[]', sample_project);
    RAISE EXCEPTION 'Cross-client project relation was accepted on insert';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS failure_message = MESSAGE_TEXT;
    IF failure_message <> 'Video and project must have the same client' THEN RAISE; END IF;
    checks := checks + 1;
  END;
  BEGIN
    UPDATE public.videos SET project = project_one WHERE id = video_other;
    RAISE EXCEPTION 'Cross-client project relation was accepted on update';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS failure_message = MESSAGE_TEXT;
    IF failure_message <> 'Video and project must have the same client' THEN RAISE; END IF;
    checks := checks + 1;
  END;
  BEGIN
    UPDATE public.roofing_projects SET client = fixture_client WHERE id = project_one;
    RAISE EXCEPTION 'Changing a linked project client crossed its video client';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS failure_message = MESSAGE_TEXT;
    IF failure_message <> 'Project reassignment would cross video clients' THEN RAISE; END IF;
    checks := checks + 1;
  END;
  BEGIN
    UPDATE public.videos SET client = fixture_client WHERE id = video_one;
    RAISE EXCEPTION 'Changing a linked video client crossed its project client';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS failure_message = MESSAGE_TEXT;
    IF failure_message <> 'Video and project must have the same client' THEN RAISE; END IF;
    checks := checks + 1;
  END;

  INSERT INTO public.video_categories (id, client, status, name, slug, sort)
  VALUES
    (category_one, sonshine_client, 'published', 'Synthetic category one', fixture_prefix || '-category-one', 1),
    (category_two, sonshine_client, 'published', 'Synthetic category two', fixture_prefix || '-category-two', 2),
    (category_other, fixture_client, 'published', 'Synthetic other-client category', fixture_prefix || '-category-one', 1);
  FOREACH reserved_slug IN ARRAY ARRAY['roofing-project', 'other'] LOOP
    BEGIN
      INSERT INTO public.video_categories (id, client, status, name, slug, sort)
      VALUES (gen_random_uuid(), sonshine_client, 'draft', 'Synthetic reserved category', reserved_slug, 0);
      RAISE EXCEPTION 'A derived classification was accepted as an editable category';
    EXCEPTION WHEN check_violation THEN
      checks := checks + 1;
    END;
  END LOOP;
  BEGIN
    INSERT INTO public.video_categories (id, client, status, name, slug, sort)
    VALUES (gen_random_uuid(), sonshine_client, 'draft', 'Synthetic duplicate category', fixture_prefix || '-category-one', 0);
    RAISE EXCEPTION 'Duplicate category slug was accepted for one client';
  EXCEPTION WHEN unique_violation THEN
    checks := checks + 1;
  END;

  -- Multiple memberships are valid, including a project-linked video. The
  -- junction enforces distinct (video, category) pairs and both tenant edges.
  INSERT INTO public.video_category_assignments (id, video, category)
  VALUES
    (assignment_one, video_one, category_one),
    (assignment_two, video_two, category_one),
    (gen_random_uuid(), video_one, category_two);
  IF (SELECT count(*) FROM public.video_category_assignments WHERE video = video_one) <> 2 THEN
    RAISE EXCEPTION 'Overlapping category assignments were not preserved';
  END IF;
  checks := checks + 1;
  BEGIN
    INSERT INTO public.video_category_assignments (id, video, category)
    VALUES (gen_random_uuid(), video_one, category_one);
    RAISE EXCEPTION 'Duplicate video/category assignment was accepted';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS failure_constraint = CONSTRAINT_NAME;
    IF failure_constraint <> 'video_category_assignments_unique' THEN RAISE; END IF;
    checks := checks + 1;
  END;
  BEGIN
    INSERT INTO public.video_category_assignments (id, video, category)
    VALUES (gen_random_uuid(), video_one, category_other);
    RAISE EXCEPTION 'Cross-client category assignment was accepted on insert';
  EXCEPTION WHEN check_violation THEN
    checks := checks + 1;
  END;
  BEGIN
    UPDATE public.video_category_assignments SET category = category_other WHERE id = assignment_one;
    RAISE EXCEPTION 'Changing the assignment category crossed clients';
  EXCEPTION WHEN check_violation THEN
    checks := checks + 1;
  END;
  BEGIN
    UPDATE public.video_category_assignments SET video = video_other WHERE id = assignment_one;
    RAISE EXCEPTION 'Changing the assignment video crossed clients';
  EXCEPTION WHEN check_violation THEN
    checks := checks + 1;
  END;
  BEGIN
    UPDATE public.videos SET client = fixture_client WHERE id = video_two;
    RAISE EXCEPTION 'Changing a standalone video client crossed its assigned category client';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS failure_message = MESSAGE_TEXT;
    IF failure_message <> 'Video reassignment would cross category clients' THEN RAISE; END IF;
    checks := checks + 1;
  END;
  BEGIN
    UPDATE public.video_categories SET client = fixture_client WHERE id = category_one;
    RAISE EXCEPTION 'Changing a category client crossed its assigned videos clients';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS failure_message = MESSAGE_TEXT;
    IF failure_message <> 'Category reassignment would cross video clients' THEN RAISE; END IF;
    checks := checks + 1;
  END;

  IF (SELECT project FROM public.videos WHERE id = video_one) IS DISTINCT FROM project_one
    OR (SELECT client FROM public.videos WHERE id = video_one) IS DISTINCT FROM sonshine_client
    OR (SELECT client FROM public.videos WHERE id = video_two) IS DISTINCT FROM sonshine_client
    OR (SELECT client FROM public.roofing_projects WHERE id = project_one) IS DISTINCT FROM sonshine_client
    OR (SELECT client FROM public.video_categories WHERE id = category_one) IS DISTINCT FROM sonshine_client
    OR (SELECT video FROM public.video_category_assignments WHERE id = assignment_one) IS DISTINCT FROM video_one
    OR (SELECT category FROM public.video_category_assignments WHERE id = assignment_one) IS DISTINCT FROM category_one THEN
    RAISE EXCEPTION 'A rejected mutation left a changed relationship or tenant';
  END IF;
  checks := checks + 1;

  RAISE NOTICE 'PASS: % video model checks; all synthetic fixtures will be rolled back', checks;
END;
$verify$;

ROLLBACK;
