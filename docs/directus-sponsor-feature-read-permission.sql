-- Idempotent read access required by the Directus-only SonShine sponsor feature adapter.
-- This copies the existing blog_posts read-policy shape for Client Access and
-- intentionally grants no create, update, or delete capability.

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
  'sponsor_features',
  'read',
  NULL,
  NULL,
  NULL,
  '*',
  policy.id
FROM public.directus_policies AS policy
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
      AND existing.collection = 'sponsor_features'
      AND existing.action = 'read'
  );
