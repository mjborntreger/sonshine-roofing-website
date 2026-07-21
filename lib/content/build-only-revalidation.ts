const BUILD_ONLY_PATH_PREFIXES = [
  '/special-offers',
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
