// app/sitemap_index/route.ts
import { NextResponse } from 'next/server';
import { envFlagTrue, SITE_ORIGIN, sitemapEnabled, sitemapPreviewHeaders } from '@/lib/seo/site';

export const dynamic = 'force-static'; // can be cached by ISR
export const revalidate = 3600;        // safety net (1h) – revalidateTag will bust sooner

const BASE = SITE_ORIGIN;
const SITEMAPS_ENABLED = sitemapEnabled();
const PREVIEW_HEADERS = sitemapPreviewHeaders();
const FAQ_ENABLED = envFlagTrue('NEXT_PUBLIC_ENABLE_FAQ_SITEMAP');

export function GET() {
  if (!SITEMAPS_ENABLED) return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  const sitemaps = [
    `${BASE}/sitemap_index/static`,
    `${BASE}/sitemap_index/blog`,
    ...(FAQ_ENABLED ? [`${BASE}/sitemap_index/faq`] : []),
    `${BASE}/sitemap_index/project`,
    `${BASE}/sitemap_index/location`,
    `${BASE}/sitemap_index/roofing-glossary`,
    `${BASE}/sitemap_index/person`,
    `${BASE}/sitemap_index/video`,
    `${BASE}/sitemap_index/image`,
  ];
  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');
  const xml = `${head}
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((loc) => `    <sitemap><loc>${loc}</loc></sitemap>`).join('\n')}
  </sitemapindex>`;
  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...PREVIEW_HEADERS,
    },
  });
}
