import { NextResponse } from 'next/server';
import { listLocationSitemapEntries } from '@/lib/content/locations';
import { formatLastmod } from '../utils';
import { SITE_ORIGIN, sitemapEnabled, sitemapPreviewHeaders } from '@/lib/seo/site';

export const dynamic = 'force-static';
export const revalidate = false;
export async function GET() {
  if (!sitemapEnabled()) return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  const items = await listLocationSitemapEntries();
  const body = `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items.map(page => {
    const modified = formatLastmod(page.modified);
    return `<url><loc>${SITE_ORIGIN}/locations/${page.slug}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ''}</url>`;
  }).join('')}</urlset>`;
  return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8', ...sitemapPreviewHeaders() } });
}
