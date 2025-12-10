import { NextResponse } from 'next/server';
import { buildAlternateLinks, localizePath, stripLocalePrefix } from '../utils';

// The manifest is generated at build time to: public/__sitemaps/static-routes.json
// We fetch it from the current origin so this works on prod and staging without hardcoding.

type StaticRoute = { loc: string; lastmod?: string; locale?: string | null };
type StaticManifest = { generatedAt?: string; routes: StaticRoute[] };

const ENABLED =
  process.env.NEXT_PUBLIC_ENV === 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';
const PREVIEW =
  process.env.NEXT_PUBLIC_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';

// Important: render dynamically so we always read the latest manifest
export const dynamic = 'force-dynamic';
// (No revalidate; handled by reading the JSON at request time)

export async function GET(req: Request) {
  if (!ENABLED) return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });

  const origin = new URL(req.url).origin;
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

  const routes = Array.isArray(manifest.routes) ? manifest.routes : [];
  const seenBases = new Set<string>();
  const expanded: Array<StaticRoute & { alternates: string[] }> = [];
  routes.forEach((route) => {
    const basePath = stripLocalePrefix(route.loc);
    if (seenBases.has(basePath)) return;
    seenBases.add(basePath);
    const alternates = buildAlternateLinks(origin, basePath);
    localizePath(basePath).forEach(({ loc }) => {
      expanded.push({
        loc,
        locale: route.locale,
        lastmod: route.lastmod,
        alternates,
      });
    });
  });

  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...expanded.map((r) => {
      const loc = `${origin}${r.loc}`;
      const lastmod = r.lastmod ? `<lastmod>${r.lastmod}</lastmod>` : '';
      return `<url><loc>${loc}</loc>${lastmod}${r.alternates.join('')}</url>`;
    }),
    `</urlset>`,
  ].join('');

  return new NextResponse(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...(PREVIEW ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
    },
  });
}
