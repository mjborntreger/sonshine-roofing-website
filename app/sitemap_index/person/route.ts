import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { wpFetch } from '@/lib/wp';
import { formatLastmod, normalizeEntryPath } from '../utils';

export const dynamic = 'force-static';
export const revalidate = 3600; // safety net; tag-based revalidation will be faster

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonshineroofing.com';
const ENABLED =
  process.env.NEXT_PUBLIC_ENV === 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';
const PREVIEW =
  process.env.NEXT_PUBLIC_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';

// Minimal node shape for sitemap entries
interface Node { uri: string; modifiedGmt?: string | null }

interface SitemapPersonsResult {
  persons: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: Node[];
  };
}

// Cache the list with a tag so WP can ping /api/revalidate to bust it
const getPersonUrls = unstable_cache(
  async () => {
    const q = /* GraphQL */ `
      query SitemapPersons($first: Int!, $after: String) {
        persons(
          first: $first,
          after: $after,
          where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC } }
        ) {
          pageInfo { hasNextPage endCursor }
          nodes { uri modifiedGmt }
        }
      }
    `;

    const nodes: Node[] = [];
    let after: string | undefined;

    do {
      const vars: { first: number; after?: string } = after ? { first: 200, after } : { first: 200 };
      const data = await wpFetch<SitemapPersonsResult>(q, vars);
      const page = data?.persons;
      if (page?.nodes?.length) nodes.push(...page.nodes);
      after = page?.pageInfo?.hasNextPage ? (page.pageInfo.endCursor ?? undefined) : undefined;
    } while (after);

    return nodes;
  },
  ['sitemap-person'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap:person'] }
);

export async function GET() {
  if (!ENABLED) {
    return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  }

  const items = await getPersonUrls();

  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');
  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...items.map((n) => {
      const path = normalizeEntryPath(n.uri);
      const loc = `${BASE}${path}`;
      const isoLastmod = formatLastmod(n.modifiedGmt);
      const lastmod = isoLastmod ? `<lastmod>${isoLastmod}</lastmod>` : '';
      return `<url><loc>${loc}</loc>${lastmod}</url>`;
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
