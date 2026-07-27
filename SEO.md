# SEO Guide

## Canonicals and metadata

- Base site metadata in `app/(site)/layout.tsx`.
- Per-page metadata in each route’s `generateMetadata`.
- Use `NEXT_PUBLIC_BASE_URL` for absolute canonical urls if needed.

## Robots

- Non-production `robots.txt` uses `Disallow: /`. When sitemap preview is
  explicitly enabled, sitemap responses add `X-Robots-Tag: noindex, nofollow`;
  there is no host-wide staging header.
- Production: `Allow: /` with sitemap at `/sitemap_index`.
- Page-level robots overrides:
  - `noindex, follow`: `/reviews`, `/tell-us-why` (and children), `/roofing-glossary/[slug]`, and any Directus route owner whose `noindex` field is true.
  - Directus `persons` and `special_offers` use their stored `noindex` toggle.
    Keep approved public profiles indexable. Special-offer expiration does not
    override the toggle.
  - `index, follow`: the `/faq` archive.
  - Legacy `/faq/[slug]` URLs intentionally return a normal 404 and are excluded from sitemaps.

## Sitemaps

- Index: `/sitemap_index`
- Children:
  - `/sitemap_index/static` (build-time manifest)
  - `/sitemap_index/blog`, `/project`, `/location`, `/roofing-glossary`, `/person`, `/special-offer`, `/video`, `/image`
- The `/faq` archive remains in the static manifest; individual FAQ anchors are not sitemap URLs.
- `/sitemap_index/roofing-glossary` reads Directus and emits only term records
  whose own `noindex` value is false. The business policy keeps glossary terms
  noindex, so the child sitemap should remain empty while the archive stays
  indexable.
- Preview mode on staging: set `NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW=true`.
- After releases that touch image content, resubmit `/sitemap_index/image` in Search Console.

## Structured data

- RoofingContractor and Services JSON-LD are injected in
  `app/(site)/layout.tsx`.
- Person, DefinedTerm, and FAQ JSON-LD where relevant.
- Ensure visible content matches JSON-LD.

## Open Graph and Twitter

- Prefer the described Directus `site_settings.default_og_image` where the
  route adapter exposes it. Legacy fallbacks are not yet standardized, and the
  repository does not track the `/og-default.png` file referenced by several
  routes.
