import { getDirectusRedirects } from "./lib/content/directus-redirects.mjs";

// Security headers (CSP enforced in all environments)
const csp = `
  default-src 'self' https://connect.facebook.net https://storage.googleapis.com https://wp.sonshineroofing.com;
  base-uri 'self';
  form-action 'self' https://*.acculynx.com;
  frame-ancestors https://www.google.com;
  frame-src https://connect.facebook.net https://cdn.socket.io https://www.youtube-nocookie.com https://www.facebook.com https://www.instagram.com https://www.youtube.com https://*.acculynx.com https://challenges.cloudflare.com https://www.google.com https://maps.google.com https://www.googletagmanager.com https://www.googleadservices.com https://insight.adsrvr.org https://ct.pinterest.com https://tag.brandcdn.com https://adservices.brandcdn.com https://d1eoo1tco6rr5e.cloudfront.net https://calendly.com;
  img-src 'self' data: blob: https: https://directus.borntregerdigital.com https://connect.facebook.net https://*.amazon-adsystem.com https://*.brandcdn.com https://assets.calendly.com;
  media-src 'self' blob: https:;
  font-src 'self' https://fonts.gstatic.com https://assets.calendly.com data:;
  style-src 'self' 'unsafe-inline' https://cdn.socket.io https://fonts.bunny.net https://cdn.jsdelivr.net https://fonts.googleapis.com https://www.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://assets.calendly.com;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' data: https://connect.facebook.net https://www.gstatic.com https://maps.googleapis.com https://www.google.com https://storage.googleapis.com https://www.googletagmanager.com https://*.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://qq.leadsbyquickquote.com https://challenges.cloudflare.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://www.googleadservices.com blob: https://*.amazon-adsystem.com https://s.pinimg.com https://*.brandcdn.com https://js.adsrvr.org https://*.tvsquared.com https://ct.pinterest.com https://assets.calendly.com https://hatch-javascript.s3.amazonaws.com https://unpkg.com https://app.usehatchapp.com;
  script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' data: https://cdn.socket.io https://connect.facebook.net https://www.gstatic.com https://maps.googleapis.com https://www.google.com https://storage.googleapis.com https://qq.leadsbyquickquote.com https://www.googletagmanager.com https://*.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://challenges.cloudflare.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://www.googleadservices.com blob: https://*.amazon-adsystem.com https://s.pinimg.com https://*.brandcdn.com https://js.adsrvr.org https://*.tvsquared.com https://ct.pinterest.com https://assets.calendly.com https://hatch-javascript.s3.amazonaws.com https://unpkg.com https://app.usehatchapp.com;
  connect-src 'self' ws: wss: https://cdn.socket.io https://connect.facebook.net https://places.googleapis.com https://maps.googleapis.com https://cdn.jsdelivr.net https://storage.googleapis.com https://quickquote-api-628343900656.us-central1.run.app https://quickquote-api-223492134056.us-central1.run.app https://quickquote-api-78479757910.us-central1.run.app https://sonshineroofing.com https://wp.sonshineroofing.com https://*.acculynx.com https://challenges.cloudflare.com https://www.googletagmanager.com https://*.googletagmanager.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.google.com https://google.com https://*.google.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.g.doubleclick.net https://ad.doubleclick.net https://pagead2.googlesyndication.com https://stats.g.doubleclick.net/g/collect https://*.amazon-adsystem.com https://www.facebook.com https://connect.facebook.net https://ct.pinterest.com https://s.pinimg.com https://*.brandcdn.com https://js.adsrvr.org https://insight.adsrvr.org https://*.tvsquared.com https://*.paa-reporting-advertising.amazon https://*.amazon https://calendly.com https://assets.calendly.com https://app.usehatchapp.com;
  object-src 'none';
`.replace(/\s{2,}/g, ' ').trim();

const imageRemotePatterns = [
  { protocol: "https", hostname: "sonshineroofing.com" },
  { protocol: "https", hostname: "wp.sonshineroofing.com" },
  { protocol: "https", hostname: "**.wp.com" },
  { protocol: "https", hostname: "coc.codes" },
  { protocol: "https", hostname: "res.cloudinary.com" },
  { protocol: "https", hostname: "seal-westflorida.bbb.org" },
  { protocol: "https", hostname: "i.ytimg.com" },
  { protocol: "https", hostname: "www.google.com" },
];

const directusUrl = process.env.DIRECTUS_URL?.trim();
if (directusUrl) {
  try {
    const url = new URL(directusUrl);
    if (url.protocol === "https:" || url.protocol === "http:") {
      imageRemotePatterns.push({
        protocol: url.protocol.replace(":", ""),
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
  output: "standalone",
  images: {
    remotePatterns: imageRemotePatterns
  },
  async headers() {
    const cspHeaderKey = 'Content-Security-Policy';
    const immutableAssetCache = "public, max-age=31536000, immutable";
    const sitemapCache = "public, s-maxage=3600, stale-while-revalidate=300";

    return [
      {
        source: "/__sitemaps/sitemap.xsl",
        headers: [
          { key: "Cache-Control", value: immutableAssetCache },
          { key: "Content-Type", value: "text/xsl; charset=utf-8" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: immutableAssetCache }],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: immutableAssetCache }],
      },
      {
        source: "/:path*\\.(ico|png|jpg|jpeg|gif|svg|webp|avif|txt|webmanifest)",
        headers: [{ key: "Cache-Control", value: immutableAssetCache }],
      },
      {
        source: "/__sitemaps/static-routes.json",
        headers: [{ key: "Cache-Control", value: sitemapCache }],
      },
      {
        source: "/sitemap_index/:path*",
        headers: [{ key: "Cache-Control", value: sitemapCache }],
      },
      {
        source: "/sitemap_index",
        headers: [{ key: "Cache-Control", value: sitemapCache }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: cspHeaderKey, value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
          { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains; preload" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" }
        ]
      }
    ];
  },

  // Pick one canonical style to avoid slash chaos:
  // trailingSlash: true,  // always add slash
  trailingSlash: false,

  async redirects() {
    const directusRedirects = await getDirectusRedirects();

    return [
      // === Canonical host — www → apex (run first to avoid extra hops) ===
      { source: "/:path*", has: [{ type: 'host', value: 'www.sonshineroofing.com' }], destination: "https://sonshineroofing.com/:path*", permanent: true },

      // Content-specific redirects are managed in Directus and loaded at build time.
      ...directusRedirects,

      // De-paginate everywhere: /something/page/2 -> /something/
      { source: "/:prefix*/page/:n(\\d+)", destination: "/:prefix*", permanent: true },

      // Strip .html endings globally
      { source: "/:path*.html", destination: "/:path*", permanent: true },

      // WordPress sitemap aliases need regex matching that the shared redirects schema does not expose.
      { source: "/:prefix*/:seg(wp\\-sitemap.*)", destination: "/sitemap_index", permanent: true },
    ];
  },
};

export default nextConfig;
