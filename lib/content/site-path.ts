export function normalizeWebsitePath(value: string): string {
  const withoutQuery = value.split(/[?#]/, 1)[0] || '/';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : '/';
}
