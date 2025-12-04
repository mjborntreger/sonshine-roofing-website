// Security headers (CSP enforced in all environments)
const csp = `
  default-src 'self' https://next.sonshineroofing.com;
  base-uri 'self';
  form-action 'self' https://*.acculynx.com;
  frame-ancestors 'none';
  frame-src https://www.youtube-nocookie.com https://www.facebook.com https://www.instagram.com https://www.youtube.com https://*.acculynx.com https://challenges.cloudflare.com https://vercel.live https://www.google.com https://maps.google.com https://www.googletagmanager.com https://www.googleadservices.com https://insight.adsrvr.org https://ct.pinterest.com https://tag.brandcdn.com https://adservices.brandcdn.com https://d1eoo1tco6rr5e.cloudfront.net https://calendly.com https://conversations-widget.brevo.com https://*.brevo.com;
  img-src 'self' data: blob: https: https://*.amazon-adsystem.com https://*.brandcdn.com https://assets.calendly.com https://conversations-widget.brevo.com https://*.brevo.com;
  font-src 'self' https://fonts.gstatic.com https://assets.calendly.com https://conversations-widget.brevo.com https://*.brevo.com data:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com https://assets.calendly.com https://conversations-widget.brevo.com https://*.brevo.com;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://storage.googleapis.com https://www.googletagmanager.com https://qq.leadsbyquickquote.com https://vercel.live https://challenges.cloudflare.com https://www.clarity.ms https://scripts.clarity.ms https://cdn.callrail.com https://js.callrail.com https://googleads.g.doubleclick.net https://www.googleadservices.com blob: https://*.amazon-adsystem.com https://s.pinimg.com https://connect.facebook.net https://*.brandcdn.com https://js.adsrvr.org https://*.tvsquared.com https://ct.pinterest.com https://assets.calendly.com https://conversations-widget.brevo.com https://*.brevo.com;
  script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://storage.googleapis.com https://qq.leadsbyquickquote.com https://www.googletagmanager.com https://vercel.live https://challenges.cloudflare.com https://www.clarity.ms https://scripts.clarity.ms https://cdn.callrail.com https://js.callrail.com https://googleads.g.doubleclick.net https://www.googleadservices.com blob: https://*.amazon-adsystem.com https://s.pinimg.com https://connect.facebook.net https://*.brandcdn.com https://js.adsrvr.org https://*.tvsquared.com https://ct.pinterest.com https://assets.calendly.com https://conversations-widget.brevo.com https://*.brevo.com;
  connect-src 'self' ws: wss: https://sonshineroofing.com https://next.sonshineroofing.com https://vitals.vercel-insights.com https://*.acculynx.com https://challenges.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com https://analytics.google.com https://www.google.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://q.clarity.ms https://a.clarity.ms/collect https://stats.g.doubleclick.net/g/collect https://*.amazon-adsystem.com https://www.facebook.com https://connect.facebook.net https://ct.pinterest.com https://s.pinimg.com https://*.brandcdn.com https://js.adsrvr.org https://insight.adsrvr.org https://*.tvsquared.com https://*.paa-reporting-advertising.amazon https://*.amazon https://calendly.com https://assets.calendly.com https://conversations-widget.brevo.com https://*.brevo.com;
  object-src 'none';
`.replace(/\s{2,}/g, ' ').trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "sonshineroofing.com" },
      { protocol: "https", hostname: "next.sonshineroofing.com" },
      { protocol: "https", hostname: "**.wp.com" },
      { protocol: "https", hostname: "coc.codes" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "seal-westflorida.bbb.org" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "www.google.com" }
    ]
  },
  async headers() {
    const cspHeaderKey = 'Content-Security-Policy';
    return [
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
    return [
      // === Canonical host — www → apex (run first to avoid extra hops) ===
      { source: "/:path*", has: [{ type: 'host', value: 'www.sonshineroofing.com' }], destination: "https://sonshineroofing.com/:path*", permanent: true },

      // Manual rules from existing config
      // Removed two trailing-slash adders to avoid loops with trailingSlash=false
      // { source: "/roof-inspection", destination: "/roof-inspection/", permanent: true },
      // { source: "/5-things-ask-sarasota-roofing-contractor", destination: "/5-things-ask-sarasota-roofing-contractor/", permanent: true },
      // Move legacy blog posts from /blog/* to /*, but keep /blog archive intact
      { source: "/blog/:path(.+)", destination: "/:path", permanent: true },

      // De-paginate everywhere: /something/page/2 -> /something/
      { source: "/:prefix*/page/:n(\\d+)", destination: "/:prefix*", permanent: true },

      // Strip .html endings globally
      { source: "/:path*.html", destination: "/:path*", permanent: true },

      // === Legacy Pages ===
      { source: "/roof-repairs", destination: "/roof-repair", permanent: true },
      { source: "/quote", destination: "https://www.myquickroofquote.com/contractors/sonshine-roofing", permanent: true },
      { source: "/about", destination: "/about-sonshine-roofing", permanent: true },
      { source: "/roof-replacement", destination: "/roof-replacement-sarasota-fl", permanent: true },
      { source: "/services/roof-replacement", destination: "/roof-replacement-sarasota-fl", permanent: true },
      { source: "/roof-replacement-sarasota", destination: "/roof-replacement-sarasota-fl", permanent: true },
      { source: "/services/roof-repair", destination: "/roof-repair", permanent: true },
      { source: "/services/roof-inspection", destination: "/roof-inspection", permanent: true },
      { source: "/services/roof-maintenance", destination: "/roof-maintenance", permanent: true },
      { source: "/:prefix*/:seg(wp\\-sitemap.*)", destination: "/sitemap_index", permanent: true },
      { source: "/sitemap", destination: "/sitemap_index", permanent: true },
      { source: "/sitemap_index.xml", destination: "/sitemap_index", permanent: true },
      { source: "/video-sitemap", destination: "/sitemap_index", permanent: true },
      { source: "/local-sitemap", destination: "/sitemap_index", permanent: true },
      { source: "/image-sitemap", destination: "/sitemap_index/image", permanent: true },
      { source: "/image-sitemap.xml", destination: "/sitemap_index/image", permanent: true },
      { source: "/roof-inspection-sarasota", destination: "/roof-inspection", permanent: true },
      { source: "/html-sitemap", destination: "/sitemap_index", permanent: true },
      { source: "/expert-answers-to-your-roofing-questions", destination: "/faq", permanent: true },
      { source: "/services/roof-care-club", destination: "/roof-maintenance#roof-care-club", permanent: true },
      { source: "/roof-care-club", destination: "/roof-maintenance#roof-care-club", permanent: true },
      { source: "/roofing-terms-and-definitions", destination: "/roofing-glossary", permanent: true },
      { source: "/our-services/roof-maintenance-services/why-you-need-roof-inspection", destination: "/roof-inspection", permanent: true },
      { source: "/instant-free-quote", destination: "https://www.myquickroofquote.com/contractors/sonshine-roofing", permanent: true },
      { source: "/roof-repair-sarasota", destination: "/roof-repair", permanent: true },
      { source: "/sarasota/roofing-contractors", destination: "/", permanent: true },
      { source: "/repair-vs-replace", destination: "/roof-replacement-sarasota-fl#repair-vs-replace", permanent: true },
      { source: "/service-areas", destination: "/about-sonshine-roofing", permanent: true },
      { source: "/roofing-services", destination: "contact-us", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/what-should-i-do-if-my-roof-is-damaged-after-a-storm/", destination: "/roof-is-damaged-after-a-storm/", permanent: true },
      { source: "/book", destination: "/contact-us", permanent: true },
      { source: "/about-us", destination: "about-sonshine-roofing", permanent: true },

      // === Persons ===
      { source: "/about/mina-2", destination: "/person/mina", permanent: true },
      { source: "/about/bob", destination: "/person/bob", permanent: true },
      { source: "/about/josh", destination: "/person/josh", permanent: true },
      { source: "/about/tara-bell", destination: "/person/tara", permanent: true },
      { source: "/about-sonshine-roofing/nathan-borntreger-owner", destination: "/person/nathan-borntreger", permanent: true },
      { source: "/about/nathan", destination: "/person/nathan-borntreger", permanent: true },
      { source: "/about/nathan-borntreger", destination: "/person/nathan-borntreger", permanent: true },
      { source: "/about/angela", destination: "/person/angela", permanent: true },
      { source: "/about/jeremy-b", destination: "/person/jb", permanent: true },
      { source: "/about/steve", destination: "/person/steve", permanent: true },

      // === Blog Slug Changes ===
      { source: "/irresistible-blackened-grouper-tacos-with-creamy-lime-crema", destination: "/grouper-tacos", permanent: true },
      { source: "/9-warning-signs-of-roof-leaks/", destination: "/roof-repair", permanent: true },
      { source: "/roof-cleaning-in-florida-expert-answers-from-hoover-pressure-cleaning", destination: "/roof-cleaning-in-florida", permanent: true },
      { source: "/roof-leaks", destination: "/roof-leaks-warning-signs", permanent: true },
      { source: "/10-warning-signs-of-roof-leaks", destination: "/roof-leaks-warning-signs", permanent: true },
      { source: "/🌞-energy-efficient-roofing-options-for-florida-homes-save-money-and-beat-the-heat-☀%EF%B8%8F💸🏠", destination: "/energy-efficient-roofing-options-florida", permanent: true },
      { source: "/9-warning-signs-of-roof-leaks", destination: "/roof-leaks-warning-signs", permanent: true },
      { source: "/project/treedale-glen-lakewood-ranch", destination: "/project/treesdale-glen-lakewood-ranch", permanent: true },

      // === Broken Backlinks ===
      { source: "/wp-content/uploads/roof-lifespan-1-1080x619.jpg", destination: "https://next.sonshineroofing.com/wp-content/uploads/extend-roof-lifespan.webp", permanent: true },
      { source: "/wp-content/uploads/sarasota-roofing-companies-sonshine-roofing.jpg", destination: "https://next.sonshineroofing.com/wp-content/uploads/cropped-GBP-logo.png", permanent: true },
      { source: "/wp-content/uploads/sonshine-roofing-logo.jpg", destination: "https://next.sonshineroofing.com/wp-content/uploads/cropped-GBP-logo.png", permanent: true },
      { source: "/wp-content/uploads/how-long-does-a-roof-last-composite.jpg", destination: "https://next.sonshineroofing.com/wp-content/uploads/how-long-does-a-roof-last-tile.webp", permanent: true },
      { source: "/wp-content/uploads/pitch-roofed-roof-vs.-flat-roof.jpg", destination: "https://next.sonshineroofing.com/wp-content/uploads/pitched-roof-vs-flat-roof.webp", permanent: true },
      { source: "/wp-content/uploads/how-long-does-a-roof-last-slate.jpg", destination: "https://next.sonshineroofing.com/wp-content/uploads/how-long-does-a-roof-last-tile.webp", permanent: true },
      { source: "/wp-content/uploads/need-roof-repair-attic2-1080x675.jpg", destination: "https://next.sonshineroofing.com/wp-content/uploads/need-roof-repair-attic-800x450-1.webp", permanent: true },
      { source: "/wp-content/uploads/roofing-contractor-1-1080x675.jpg", destination: "https://next.sonshineroofing.com/wp-content/uploads/ask-sarasota-roofing-contractor-1.webp", permanent: true },
      { source: "/wp-content/uploads/GAF-Footer-LOGO.png", destination: "https://next.sonshineroofing.com/wp-content/uploads/master-elite-logo-hi-res-png.png", permanent: true },
      { source: "/wp-content/uploads/roof-leak-warning-9-roof-stain.jpg", destination: "https://next.sonshineroofing.com/wp-content/uploads/roof-leak-warning-9-roof-stain.webp", permanent: true },
      { source: "/wp-content/uploads/roof-leak-warning-1-algae.jpg", destination: "https://next.sonshineroofing.com/wp-content/uploads/roof-leak-warning-1-algae.webp", permanent: true },
      { source: "/wp-content/uploads/how-long-does-a-tile-roof-last-in-florida-1080x675.jpg", destination: "https://next.sonshineroofing.com/wp-content/uploads/how-long-does-a-roof-last-tile.webp", permanent: true },
      { source: "/wp-content/:path*", destination: "https://next.sonshineroofing.com/wp-content/:path*", permanent: true },
      { source: "/free-roofing-estimate", destination: "/contact-us", permanent: true },
      { source: "/double-roof-service-life", destination: "/roof-maintenance", permanent: true },
      { source: "/wp-content/uploads/Lifted-Cox.jpg", destination: "/", permanent: true },

      // === Legacy Project Categories & Archives (Collapsed) ===
      // All legacy category URLs → unified Projects page with a location filter.
      // Query strings (UTMs, etc.) are preserved and will merge with `?sa=:city`.
      { source: "/:city(sarasota|bradenton|lakewood-ranch|palmetto|punta-gorda|siesta-key|nokomis|venice|north-port|port-charlotte|myakka-city)-roofing-contractor/:path*", destination: "/project?sa=:city", permanent: true },
      { source: "/project-category/:city(sarasota|bradenton|lakewood-ranch|palmetto|punta-gorda|siesta-key|nokomis|venice|north-port|port-charlotte|myakka-city)/:path*", destination: "/project?sa=:city", permanent: true },
      { source: "/project_category/:city(sarasota|bradenton|lakewood-ranch|palmetto|punta-gorda|siesta-key|nokomis|venice|north-port|port-charlotte|myakka-city)-roofing-contractor/:path*", destination: "/project?sa=:city", permanent: true },

      // === Deleted Content (410) — you will move these to middleware later ===
      // 410s handled in middleware.ts for proper Gone responses

      // (host redirect placed at top)
    ];
  },
};

export default nextConfig;
