-- Idempotent Directus read-policy additions required by the SonShine frontend
-- when BLOG_CONTENT_SOURCE=directus. This intentionally grants read only and
-- copies the existing blog_posts policy scope (all fields, no row override).

INSERT INTO public.directus_permissions (
  collection,
  action,
  permissions,
  validation,
  presets,
  fields,
  policy
)
SELECT
  requested.collection,
  'read',
  NULL,
  NULL,
  NULL,
  '*',
  policy.id
FROM public.directus_policies AS policy
CROSS JOIN (
  VALUES
    ('blog_topics'),
    ('blog_posts_blog_topics')
) AS requested(collection)
WHERE policy.name = 'Client Access'
  AND EXISTS (
    SELECT 1
    FROM public.directus_permissions AS existing_blog_access
    WHERE existing_blog_access.policy = policy.id
      AND existing_blog_access.collection = 'blog_posts'
      AND existing_blog_access.action = 'read'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.directus_permissions AS existing
    WHERE existing.policy = policy.id
      AND existing.collection = requested.collection
      AND existing.action = 'read'
  );
