import { getDirectusRedirects } from './lib/content/directus-redirects.mjs';
import { getDirectusBuildSettings } from './lib/content/directus-build-settings.mjs';

const directusBuildSettings = await getDirectusBuildSettings();
const csp = directusBuildSettings?.contentSecurityPolicy ?? '';

const imageRemotePatterns = [
  { protocol: 'https', hostname: 'sonshineroofing.com' },
  { protocol: 'https', hostname: 'wp.sonshineroofing.com' },
  { protocol: 'https', hostname: '**.wp.com' },
  { protocol: 'https', hostname: 'coc.codes' },
  { protocol: 'https', hostname: 'res.cloudinary.com' },
  { protocol: 'https', hostname: 'seal-westflorida.bbb.org' },
  { protocol: 'https', hostname: 'i.ytimg.com' },
  { protocol: 'https', hostname: 'www.google.com' },
];

const directusUrl = process.env.DIRECTUS_URL?.trim();
if (directusUrl) {
  try {
    const url = new URL(directusUrl);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      imageRemotePatterns.push({
        protocol: url.protocol.replace(':', ''),
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
      });
    }
  } catch {
    // Ignore invalid local configuration; the content fetcher will surface missing/invalid env separately.
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  output: 'standalone',
  // Keep WordPress and Directus traffic bounded while static pages are generated.
  experimental: {
    cpus: 2,
    staticGenerationMaxConcurrency: 1,
  },
  images: {
    remotePatterns: imageRemotePatterns,
  },
  async headers() {
    const cspHeaderKey = 'Content-Security-Policy';
    const immutableAssetCache = 'public, max-age=31536000, immutable';
    const sitemapCache = 'public, s-maxage=3600, stale-while-revalidate=300';

    return [
      {
        source: '/__sitemaps/sitemap.xsl',
        headers: [
          { key: 'Cache-Control', value: immutableAssetCache },
          { key: 'Content-Type', value: 'text/xsl; charset=utf-8' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: immutableAssetCache }],
      },
      {
        source: '/:path*\\.(ico|png|jpg|jpeg|gif|svg|webp|avif|txt|webmanifest)',
        headers: [{ key: 'Cache-Control', value: immutableAssetCache }],
      },
      {
        source: '/__sitemaps/static-routes.json',
        headers: [{ key: 'Cache-Control', value: sitemapCache }],
      },
      {
        source: '/sitemap_index/:path*',
        headers: [{ key: 'Cache-Control', value: sitemapCache }],
      },
      {
        source: '/sitemap_index',
        headers: [{ key: 'Cache-Control', value: sitemapCache }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      {
        source: '/(.*)',
        headers: [
          ...(csp ? [{ key: cspHeaderKey, value: csp }] : []),
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=15552000; includeSubDomains; preload',
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ];
  },

  // Pick one canonical style to avoid slash chaos:
  // trailingSlash: true,  // always add slash
  trailingSlash: false,

  async redirects() {
    const directusRedirects = await getDirectusRedirects();

    return [
      // === Canonical host — www → apex (run first to avoid extra hops) ===
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.sonshineroofing.com' }],
        destination: 'https://sonshineroofing.com/:path*',
        permanent: true,
      },

      // Content-specific redirects are managed in Directus and loaded at build time.
      ...directusRedirects,

      // De-paginate everywhere: /something/page/2 -> /something/
      { source: '/:prefix*/page/:n(\\d+)', destination: '/:prefix*', permanent: true },

      // Strip .html endings globally
      { source: '/:path*.html', destination: '/:path*', permanent: true },

      // WordPress sitemap aliases need regex matching that the shared redirects schema does not expose.
      { source: '/:prefix*/:seg(wp\\-sitemap.*)', destination: '/sitemap_index', permanent: true },
    ];
  },
};

export default nextConfig;
