// app/sitemap_index/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-static'; // can be cached by ISR
export const revalidate = 3600;        // safety net (1h) – revalidateTag will bust sooner

const BASE = process.env.NEXT_PUBLIC_SITE_URL!;
const ENABLED =
  process.env.NEXT_PUBLIC_ENV === 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';
const PREVIEW =
  process.env.NEXT_PUBLIC_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';

export function GET() {
  if (!ENABLED) return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');
  const xml = `${head}
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap><loc>${BASE}/sitemap_index/static</loc></sitemap>
    <sitemap><loc>${BASE}/sitemap_index/blog</loc></sitemap>
    <sitemap><loc>${BASE}/sitemap_index/project</loc></sitemap>
    <sitemap><loc>${BASE}/sitemap_index/video-library</loc></sitemap>
    <sitemap><loc>${BASE}/sitemap_index/faq</loc></sitemap>
    <sitemap><loc>${BASE}/sitemap_index/roofing-glossary</loc></sitemap>
    <sitemap><loc>${BASE}/sitemap_index/person</loc></sitemap>
  </sitemapindex>`;
  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...(PREVIEW ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
    },
  });
}
