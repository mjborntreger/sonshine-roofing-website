import { deploymentBundle } from './lib/content/deployment-snapshot.mjs';
import { nonMediaLegacyRedirects } from './lib/content/legacy-media-redirects.mjs';
import { getDirectusBuildSettings } from './lib/content/directus-build-settings.mjs';

const directusBuildSettings = await getDirectusBuildSettings();
const csp = directusBuildSettings?.contentSecurityPolicy ?? '';

const imageRemotePatterns = [
  { protocol: 'https', hostname: 'sonshineroofing.com' },
  { protocol: 'https', hostname: 'coc.codes' },
  { protocol: 'https', hostname: 'res.cloudinary.com' },
  { protocol: 'https', hostname: 'seal-westflorida.bbb.org' },
  { protocol: 'https', hostname: 'i.ytimg.com' },
  { protocol: 'https', hostname: 'www.google.com' },
];

const directusUrl = deploymentBundle().snapshots['editorial.json'].assetOrigin;
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
    // The build capture validates the source URL before sealing the bundle.
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  output: 'standalone',
  outputFileTracingIncludes: { '/*': ['./.generated/*.json', './public/__sitemaps/static-routes.json', './public/llms.txt'] },
  // Bound resource use while rendering the captured content into static pages.
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
    const directusRedirects = deploymentBundle().snapshots['editorial.json'].redirects;

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

      // /wp-content rules run from the sealed deployment snapshot in Proxy.
      ...nonMediaLegacyRedirects,
    ];
  },
};

export default nextConfig;
