import { NextResponse } from 'next/server';
import { resolveSiteOrigin, sitemapEnabled, sitemapPreviewHeaders } from '@/lib/seo/site';

// The manifest is generated at build time to: public/__sitemaps/static-routes.json
// We fetch it from the current origin so this works on prod and staging without hardcoding.

type StaticManifest = { generatedAt?: string; routes: { loc: string; lastmod?: string }[] };

const SITEMAPS_ENABLED = sitemapEnabled();
const PREVIEW_HEADERS = sitemapPreviewHeaders();

// Important: render dynamically so we always read the latest manifest
export const dynamic = 'force-dynamic';
// (No revalidate; handled by reading the JSON at request time)

export async function GET(req: Request) {
  if (!SITEMAPS_ENABLED) return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });

  const origin = resolveSiteOrigin(req.headers);
  let manifest: StaticManifest = { routes: [] };

  try {
    const res = await fetch(`${origin}/__sitemaps/static-routes.json`, { cache: 'no-store' });
    if (res.ok) manifest = (await res.json()) as StaticManifest;
  } catch {
    // fall through with empty manifest
  }

  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');

  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...manifest.routes.map((r) => {
      const loc = `${origin}${r.loc}`;
      const lastmod = r.lastmod ? `<lastmod>${r.lastmod}</lastmod>` : '';
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
