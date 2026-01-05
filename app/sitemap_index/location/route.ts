import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { wpFetch } from '@/lib/content/wp';
import { formatLastmod, normalizeEntryPath } from '../utils';
import { SITE_ORIGIN, sitemapEnabled, sitemapPreviewHeaders } from '@/lib/seo/site';

export const dynamic = 'force-static';
export const revalidate = 3600; // safety net; tag-based revalidation will be faster

const BASE = SITE_ORIGIN;
const SITEMAPS_ENABLED = sitemapEnabled();
const PREVIEW_HEADERS = sitemapPreviewHeaders();

interface Node {
  uri: string;
  modifiedGmt?: string | null;
}

interface SitemapLocationsResult {
  locations: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: Node[];
  };
}

const getLocationUrls = unstable_cache(
  async () => {
    const query = /* GraphQL */ `
      query SitemapLocations($first: Int!, $after: String) {
        locations(
          first: $first
          after: $after
          where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC } }
        ) {
          pageInfo { hasNextPage endCursor }
          nodes { uri modifiedGmt }
        }
      }
    `;

    const nodes: Node[] = [];
    let after: string | null = null;

    do {
      const variables: { first: number; after?: string | null } = after ? { first: 200, after } : { first: 200 };
      const data = await wpFetch<SitemapLocationsResult>(query, variables);
      const page = data?.locations;
      if (page?.nodes?.length) nodes.push(...page.nodes);
      after = page?.pageInfo?.hasNextPage ? page.pageInfo.endCursor ?? null : null;
    } while (after);

    return nodes;
  },
  ['sitemap-location'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap:location'] }
);

export async function GET() {
  if (!SITEMAPS_ENABLED) {
    return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  }

  const items = await getLocationUrls();

  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');

  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...items.map((node) => {
      const rawPath = normalizeEntryPath(node.uri);
      const path = rawPath.startsWith('/location/')
        ? rawPath.replace('/location/', '/locations/')
        : rawPath;
      if (path === '/') return null;
      const loc = `${BASE}${path}`;
      const isoLastmod = formatLastmod(node.modifiedGmt);
      const lastmod = isoLastmod ? `<lastmod>${isoLastmod}</lastmod>` : '';
      return `<url><loc>${loc}</loc>${lastmod}</url>`;
    }).filter(Boolean),
    `</urlset>`,
  ].join('');

  return new NextResponse(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...PREVIEW_HEADERS,
    },
  });
}
