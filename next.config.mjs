// Security headers (CSP enforced in all environments)
const csp = `
  default-src 'self' https://next.sonshineroofing.com;
  base-uri 'self';
  form-action 'self' https://*.acculynx.com;
  frame-ancestors 'none';
  frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://*.acculynx.com https://challenges.cloudflare.com https://vercel.live https://www.google.com https://maps.google.com https://www.googletagmanager.com https://www.googleadservices.com;
  img-src 'self' data: blob: https:;
  font-src 'self' https://*.tawk.to https://fonts.gstatic.com data:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.tawk.to https://www.googletagmanager.com;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://www.googletagmanager.com https://vercel.live https://challenges.cloudflare.com https://*.tawk.to https://www.clarity.ms https://scripts.clarity.ms https://cdn.callrail.com https://js.callrail.com https://googleads.g.doubleclick.net https://www.googleadservices.com blob:;
  connect-src 'self' ws: wss: https://sonshineroofing.com https://next.sonshineroofing.com https://vitals.vercel-insights.com https://*.acculynx.com https://*.tawk.to https://challenges.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com https://analytics.google.com https://www.google.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://q.clarity.ms;
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
      { protocol: "https", hostname: "i.ytimg.com" }
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
  }
};

export default nextConfig;
