import { NextResponse } from 'next/server';
import { listPersonSitemapEntries } from '@/lib/content/persons';
import { formatLastmod, normalizeEntryPath } from '../utils';
import { SITE_ORIGIN, sitemapEnabled, sitemapPreviewHeaders } from '@/lib/seo/site';

export const dynamic = 'force-static';
export const revalidate = 3600; // safety net; tag-based revalidation will be faster

const BASE = SITE_ORIGIN;
const SITEMAPS_ENABLED = sitemapEnabled();
const PREVIEW_HEADERS = sitemapPreviewHeaders();

export async function GET() {
  if (!SITEMAPS_ENABLED) {
    return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  }

  const items = await listPersonSitemapEntries();

  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');
  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...items.map((entry) => {
      const path = normalizeEntryPath(entry.uri);
      const loc = `${BASE}${path}`;
      const isoLastmod = formatLastmod(entry.modified);
      const lastmod = isoLastmod ? `<lastmod>${isoLastmod}</lastmod>` : '';
      return `<url><loc>${loc}</loc>${lastmod}</url>`;
    }),
    `</urlset>`,
  ].join('');

  return new NextResponse(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...PREVIEW_HEADERS,
    },
  });
}
