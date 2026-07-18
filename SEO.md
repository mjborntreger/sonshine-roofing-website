SEO Guide
=========

Canonicals & Metadata
- Base metadata in `app/layout.tsx`.
- Per-page metadata in each route’s `generateMetadata`.
- Use `NEXT_PUBLIC_BASE_URL` for absolute canonical urls if needed.

Robots
- Staging: `Disallow: /` (non-prod) + `X-Robots-Tag: noindex, nofollow, noimageindex` on the staging host.
- Production: `Allow: /` with sitemap at `/sitemap_index`.
- Page-level robots overrides:
  - `noindex, follow`: `/reviews`, `/tell-us-why` (and children), `/special-offers/[slug]`, `/person/[slug]` except `nathan-borntreger`.
  - `index, follow`: `/roofing-glossary/[slug]` and the `/faq` archive.
  - Legacy `/faq/[slug]` URLs intentionally return a normal 404 and are excluded from sitemaps.

Sitemaps
- Index: `/sitemap_index`
- Children:
  - `/sitemap_index/static` (build-time manifest)
  - `/sitemap_index/blog`, `/project`, `/location`, `/roofing-glossary`, `/person`, `/video`, `/image`
- The `/faq` archive remains in the static manifest; individual FAQ anchors are not sitemap URLs.
- Preview mode on staging: set `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true`.
- After releases that touch image content, resubmit `/sitemap_index/image` in Search Console.

Structured Data
- RoofingContractor + Services JSON-LD injected in `app/layout.tsx`.
- Person, DefinedTerm, and FAQ JSON-LD where relevant.
- Ensure visible content matches JSON-LD.

Open Graph/Twitter
- Default image: `/og-default.png` (all references standardized).
