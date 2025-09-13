

import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { wpFetch } from '@/lib/wp';

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

interface SitemapVideosResult {
  videoEntries: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: Node[];
  };
}

// Cache the list with a tag so WP can ping /api/revalidate to bust it
const getVideoUrls = unstable_cache(
  async () => {
    const q = /* GraphQL */ `
      query SitemapVideos($first: Int!, $after: String) {
        videoEntries(
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
      const data = await wpFetch<SitemapVideosResult>(q, vars);
      const page = data?.videoEntries;
      if (page?.nodes?.length) nodes.push(...page.nodes);
      after = page?.pageInfo?.hasNextPage ? (page.pageInfo.endCursor ?? undefined) : undefined;
    } while (after);

    return nodes;
  },
  ['sitemap-videos'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap:videos'] }
);

export async function GET() {
  if (!ENABLED) {
    return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  }

  const items = await getVideoUrls();

  const body = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...items.map((n) => {
      const loc = `${BASE}${n.uri}`;
      const lastmod = n.modifiedGmt ? `<lastmod>${n.modifiedGmt}</lastmod>` : '';
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
