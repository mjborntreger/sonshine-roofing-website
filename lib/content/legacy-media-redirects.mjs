const MEDIA_ROOT = '/wp-content';

export function isLegacyMediaPath(pathname) {
  const path = pathname.toLowerCase();
  return path === MEDIA_ROOT || path.startsWith(`${MEDIA_ROOT}/`);
}

// These global rules run before Proxy. Media paths previously matched the CMS
// wildcard first, so they must continue to bypass these later legacy rules.
export const nonMediaLegacyRedirects = [
  {
    source: '/:prefix((?!wp-content(?:/|$))[^/]+(?:/[^/]+)*)?/page/:n(\\d+)',
    destination: '/:prefix*',
    permanent: true,
  },
  {
    source: '/:path((?!wp-content(?:/|$))[^/]+(?:/[^/]+)*).html',
    destination: '/:path*',
    permanent: true,
  },
  {
    source: '/:prefix((?!wp-content(?:/|$))[^/]+(?:/[^/]+)*)?/:seg(wp\\-sitemap.*)',
    destination: '/sitemap_index',
    permanent: true,
  },
];

/** Resolve only captured rules; never fetch content or follow a redirect. */
export function resolveLegacyMediaRedirect(requestUrl, rules) {
  const request = new URL(requestUrl);
  if (!isLegacyMediaPath(request.pathname)) return null;
  // Match Next's case-insensitive source paths. Do not decode the path: encoded
  // separators/filenames must still reach the Worker's own normalization policy.
  const path = request.pathname.toLowerCase();
  const rule = rules.find((candidate) => {
    const source = candidate.sourcePath.toLowerCase();
    return candidate.wildcard
      ? path.startsWith(`${source.slice(0, -2)}/`) && path.length > source.length - 1
      : path === source || path === `${source}/`;
  });
  if (!rule) return null;

  const suffix = rule.wildcard ? request.pathname.slice(rule.sourcePath.length - 1) : '';
  const target = new URL(
    rule.wildcard ? rule.destination.replace('*', () => suffix) : rule.destination,
    request.origin,
  );
  if (rule.preserveQuery) {
    const destinationKeys = new Set(target.searchParams.keys());
    for (const [key, value] of request.searchParams)
      if (!destinationKeys.has(key)) target.searchParams.append(key, value);
  }
  return {
    // Keep relative destinations independent of the standalone server's bind
    // address; the browser resolves them against the public request origin.
    destination: rule.destination.startsWith('/')
      ? target.pathname + target.search + target.hash
      : target.toString(),
    statusCode: rule.statusCode,
  };
}
