const BUILD_ONLY_PATH_PREFIXES = [
  '/locations',
  '/faq',
  '/sitemap_index/location',
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
  let decoded: string;
  try { decoded = decodeURIComponent(value); } catch { return true; }
  // Next accepts route-file paths as implicit cache tags. A layout invalidation
  // can reach every location and its shared render dependencies.
  if (/[\\()[\]]/u.test(decoded) || [...decoded].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
    || decoded.split('/').some(segment => segment === '.' || segment === '..')
    || /\/(?:layout|page)\/?(?:[?#].*)?$/u.test(decoded)) return true;
  const path = normalizePath(decoded);
  return BUILD_ONLY_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** Legacy video cache tags cannot publish newer content within a deployment. */
export function isBuildOnlyRevalidationTag(value: string): boolean {
  const tag = value.trim().toLowerCase();
  if (tag.startsWith('_n_t_')) return true;
  return ['video', 'videos', 'video-library', 'directus:videos', 'sitemap:videos', 'sitemap-video-entries']
    .concat(['location', 'locations', 'directus:locations', 'sitemap:location', 'sitemap-location', 'sitemap:image:locations', 'faq', 'faqs', 'directus:faqs'])
    .some((prefix) => tag === prefix || tag.startsWith(`${prefix}:`));
}
