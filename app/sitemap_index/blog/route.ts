// app/sitemap_index/blog/route.ts
import { NextResponse } from 'next/server';
import { wpFetch } from '@/lib/wp';
import { unstable_cache } from 'next/cache';

const BASE = process.env.NEXT_PUBLIC_SITE_URL!;
const ENABLED =
  process.env.NEXT_PUBLIC_ENV === 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';
const PREVIEW =
  process.env.NEXT_PUBLIC_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';

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
  if (!ENABLED) return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });

  const items = await getPostUrls();
  const body = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...items.map(n => `<url><loc>${BASE}${n.uri}</loc>${n.modifiedGmt ? `<lastmod>${n.modifiedGmt}</lastmod>` : ''}</url>`),
    `</urlset>`
  ].join('');
  return new NextResponse(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...(PREVIEW ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
    },
  });
}
