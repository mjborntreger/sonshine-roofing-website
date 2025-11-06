SEO Guide
=========

Canonicals & Metadata
- Base metadata in `app/layout.tsx`.
- Per-page metadata in each route’s `generateMetadata`.
- Use `NEXT_PUBLIC_SITE_URL` for absolute canonical urls if needed.

Robots
- Staging: `Disallow: /` (non-prod).
- Production: `Allow: /` with sitemap at `/sitemap_index`.
- Page-level `noindex, follow` used for:
  - `/person/[slug]`
  - `/roofing-glossary/[slug]`
  - `/reviews`, `/tell-us-why` (utility pages)

Sitemaps
- Index: `/sitemap_index`
- Children:
  - `/sitemap_index/static` (build-time manifest)
  - `/sitemap_index/blog`, `/project`, `/roofing-glossary`, `/person`, `/video`, `/image`
- Preview mode on staging: set `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true`.
- After releases that touch image content, resubmit `/sitemap_index/image` in Search Console.

Structured Data
- RoofingContractor + Services JSON-LD injected in `app/layout.tsx`.
- Person, DefinedTerm, and FAQ JSON-LD where relevant.
- Ensure visible content matches JSON-LD.

Open Graph/Twitter
- Default image: `/og-default.png` (all references standardized).
