// app/sitemap_index/blog/route.ts
import { NextResponse } from 'next/server';
import { listBlogSitemapEntries } from '@/lib/content/blog';
import { formatLastmod, normalizeEntryPath } from '../utils';
import { unstable_cache } from 'next/cache';
import { SITE_ORIGIN, sitemapEnabled, sitemapPreviewHeaders } from '@/lib/seo/site';

export const dynamic = 'force-static';
export const revalidate = 3600; // safety net; tag-based revalidation will be faster

const BASE = SITE_ORIGIN;
const SITEMAPS_ENABLED = sitemapEnabled();
const PREVIEW_HEADERS = sitemapPreviewHeaders();

const getPostUrls = unstable_cache(async () => {
  return listBlogSitemapEntries();
}, ['sitemap-blog:directus'], { revalidate: 3600, tags: ['sitemap', 'sitemap:blog'] });

export async function GET() {
  if (!SITEMAPS_ENABLED) return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });

  const items = await getPostUrls();
  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');
  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...items.map(n => {
      const path = normalizeEntryPath(n.uri);
      const lastmod = formatLastmod(n.modified);
      return `<url><loc>${BASE}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
    }),
    `</urlset>`
  ].join('');
  return new NextResponse(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...PREVIEW_HEADERS,
    },
  });
}
