// app/sitemap_index/blog/route.ts
import { NextResponse } from 'next/server';
import { wpFetch } from '@/lib/content/wp';
import { formatLastmod, normalizeEntryPath } from '../utils';
import { unstable_cache } from 'next/cache';
import { SITE_ORIGIN, sitemapEnabled, sitemapPreviewHeaders } from '@/lib/seo/site';

export const dynamic = 'force-static';
export const revalidate = 3600; // safety net; tag-based revalidation will be faster

const BASE = SITE_ORIGIN;
const SITEMAPS_ENABLED = sitemapEnabled();
const PREVIEW_HEADERS = sitemapPreviewHeaders();

type Node = { uri: string; modifiedGmt?: string | null };

type SitemapPostsResult = {
  posts: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: Node[];
  };
};

const getPostUrls = unstable_cache(async () => {
  // Grab slugs + last modified (adjust query name to yours)
  const q = /* GraphQL */ `
    query SitemapPosts($first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC }}) {
        pageInfo { hasNextPage endCursor }
        nodes { uri modifiedGmt }
      }
    }
  `;
  const nodes: Node[] = [];
  let after: string | null = null;
  do {
    const vars: { first: number; after?: string } = after ? { first: 200, after } : { first: 200 };
    const data = await wpFetch<SitemapPostsResult>(q, vars);
    nodes.push(...(data?.posts?.nodes ?? []));
    after = data?.posts?.pageInfo?.hasNextPage ? data.posts.pageInfo.endCursor : null;
  } while (after);
  return nodes;
}, ['sitemap-blog'], { revalidate: 3600, tags: ['sitemap', 'sitemap:blog'] });

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
      const lastmod = formatLastmod(n.modifiedGmt);
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
