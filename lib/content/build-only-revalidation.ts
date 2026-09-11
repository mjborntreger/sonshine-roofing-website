const BUILD_ONLY_PATH_PREFIXES = [
  '/special-offers',
  '/project',
  '/video-library',
  '/api/resources/video',
  '/api/resources/project',
  '/sitemap_index/video',
  '/sitemap_index/project',
  '/sitemap_index/special-offer',
] as const;

function normalizePath(value: string): string {
  const path = value.split(/[?#]/, 1)[0] || '/';
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : withLeadingSlash;
}

export function isBuildOnlyRevalidationPath(value: string): boolean {
  const path = normalizePath(value);
  return BUILD_ONLY_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** Legacy video cache tags cannot publish newer content within a deployment. */
export function isBuildOnlyRevalidationTag(value: string): boolean {
  const tag = value.trim().toLowerCase();
  return ['video', 'videos', 'video-library', 'directus:videos', 'sitemap:videos', 'sitemap-video-entries']
    .some((prefix) => tag === prefix || tag.startsWith(`${prefix}:`));
}
